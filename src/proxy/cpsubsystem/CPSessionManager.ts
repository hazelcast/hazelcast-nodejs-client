/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** @ignore *//** */

import * as Long from 'long';
import {RaftGroupId} from './RaftGroupId';
import {
    IllegalStateError,
    SessionExpiredError,
    CPGroupDestroyedError
} from '../../core';
import {
    CPSessionCreateSessionCodec,
    CPSessionCreateSessionResponseParams
} from '../../codec/CPSessionCreateSessionCodec';
import {CPSessionCloseSessionCodec} from '../../codec/CPSessionCloseSessionCodec';
import {CPSessionHeartbeatSessionCodec} from '../../codec/CPSessionHeartbeatSessionCodec';
import {CPSessionGenerateThreadIdCodec} from '../../codec/CPSessionGenerateThreadIdCodec';
import {ILogger} from '../../logging/ILogger';
import {
    scheduleWithRepetition,
    cancelRepetitionTask,
    Task,
    delayedPromise,
    deferredPromise, DeferredPromise
} from '../../util/Util';
import {InvocationService} from '../../invocation/InvocationService';

/** @internal */
export class SessionState {

    readonly id: Long;
    readonly groupId: RaftGroupId;
    readonly ttlMillis: number;
    readonly creationTime: number;
    acquireCount = 0;

    constructor(id: Long, groupId: RaftGroupId, ttlMillis: number) {
        this.id = id;
        this.groupId = groupId;
        this.ttlMillis = ttlMillis;
        this.creationTime = Date.now();
    }

    acquire(count: number): Long {
        this.acquireCount += count;
        return this.id;
    }

    release(count: number): void {
        this.acquireCount -= count;
    }

    isValid(): boolean {
        return this.isInUse() || !this.isExpired(Date.now());
    }

    isInUse(): boolean {
        return this.acquireCount > 0;
    }

    private isExpired(timestamp: number): boolean {
        let expirationTime = this.creationTime + this.ttlMillis;
        if (expirationTime < 0) {
            expirationTime = Number.MAX_SAFE_INTEGER;
        }
        return timestamp > expirationTime;
    }
}

/** @internal */
export const NO_SESSION_ID = Long.fromNumber(-1);

/** @internal */
export class CPSessionManager {

    // <group_id, session_state> map
    private readonly sessions: Map<string, SessionState> = new Map();
    // Holds ongoing session creation deferred promises. Used to synchronize concurrent session creation.
    private readonly sessionCreationDeferredMap: Map<string, DeferredPromise<SessionState>> = new Map();
    private heartbeatTask: Task;
    private isShutdown = false;

    constructor(
        private readonly logger: ILogger,
        private readonly clientName: string,
        private readonly invocationService: InvocationService
    ) {
    }

    getSessionId(groupId: RaftGroupId): Long {
        const session = this.sessions.get(groupId.getStringId());
        return session !== undefined ? session.id : NO_SESSION_ID;
    }

    acquireSession(groupId: RaftGroupId, permits = 1): Promise<Long> {
        return this.getOrCreateSession(groupId).then((state) => {
            return state.acquire(permits);
        });
    }

    releaseSession(groupId: RaftGroupId, sessionId: Long, permits = 1): void {
        const session = this.sessions.get(groupId.getStringId());
        if (session !== undefined && session.id.equals(sessionId)) {
            session.release(permits);
        }
    }

    invalidateSession(groupId: RaftGroupId, sessionId: Long): void {
        const session = this.sessions.get(groupId.getStringId());
        if (session !== undefined && session.id.equals(sessionId)) {
            this.sessions.delete(groupId.getStringId());
        }
    }

    createUniqueThreadId(groupId: RaftGroupId): Promise<Long> {
        if (this.isShutdown) {
            return Promise.reject(new IllegalStateError('Session manager is already shut down'));
        }
        return this.requestGenerateThreadId(groupId);
    }

    shutdown(): Promise<void> {
        if (this.isShutdown) {
            return Promise.resolve();
        }
        this.isShutdown = true;
        this.cancelHeartbeatTask();
        const closePromises = [];
        for (const session of this.sessions.values()) {
            closePromises.push(this.requestCloseSession(session.groupId, session.id));
        }
        return Promise.all(closePromises)
            .catch((e) => {
                this.logger.debug('CPSessionManager', 'Could not close CP sessions.', e);
            })
            .then(() => this.sessions.clear());
    }

    private getOrCreateSession(groupId: RaftGroupId): Promise<SessionState> {
        if (this.isShutdown) {
            return Promise.reject(new IllegalStateError('Session manager is already shut down'));
        }
        const session = this.sessions.get(groupId.getStringId());
        if (session === undefined || !session.isValid()) {
            const createSessionDeferred = this.sessionCreationDeferredMap.get(groupId.getStringId());
            if (!createSessionDeferred) {
                const sessionCreateDeferred = deferredPromise<SessionState>();
                this.sessionCreationDeferredMap.set(groupId.getStringId(), sessionCreateDeferred);
                const session = this.sessions.get(groupId.getStringId());
                if (session === undefined || !session.isValid()) {
                    this.createNewSession(groupId).then(state => {
                        sessionCreateDeferred.resolve(state);
                    }).catch(err => {
                        sessionCreateDeferred.reject(err);
                    });
                    return sessionCreateDeferred.promise;
                } else {
                    return Promise.resolve(session);
                }
            } else {
                return createSessionDeferred.promise;
            }
        }
        return Promise.resolve(session);
    }

    private createNewSession(groupId: RaftGroupId): Promise<SessionState> {
        return this.requestNewSession(groupId).then((response) => {
            const state = new SessionState(response.sessionId, groupId, response.ttlMillis.toNumber());
            this.sessions.set(groupId.getStringId(), state);
            this.scheduleHeartbeatTask(response.heartbeatMillis.toNumber());
            /*
                let sessionCreateDeferred = this.sessionCreationJobs.get(groupId.getStringId());
                if (!sessionCreateDeferred) {
                    sessionCreateDeferred = deferredPromise<SessionState>();
                    this.sessionCreationJobs.set(groupId.getStringId(), sessionCreateDeferred);
                }
                sessionCreateDeferred.resolve(state)
                return sessionCreateDeferred.promise;
             */
            return state;
        });
    }

    private requestNewSession(groupId: RaftGroupId): Promise<CPSessionCreateSessionResponseParams> {
        const clientMessage = CPSessionCreateSessionCodec.encodeRequest(groupId, this.clientName);
        return this.invocationService.invokeOnRandomTarget(clientMessage)
            .then((clientMessage) => {
                const response = CPSessionCreateSessionCodec.decodeResponse(clientMessage);
                return response;
            });
    }

    private requestCloseSession(groupId: RaftGroupId, sessionId: Long): Promise<boolean> {
        const clientMessage = CPSessionCloseSessionCodec.encodeRequest(groupId, sessionId);
        return this.invocationService.invokeOnRandomTarget(clientMessage)
            .then(CPSessionCloseSessionCodec.decodeResponse);
    }

    private requestHeartbeat(groupId: RaftGroupId, sessionId: Long): Promise<void> {
        const clientMessage = CPSessionHeartbeatSessionCodec.encodeRequest(groupId, sessionId);
        return this.invocationService.invokeOnRandomTarget(clientMessage)
            .then(() => {
            });
    }

    private requestGenerateThreadId(groupId: RaftGroupId): Promise<Long> {
        const clientMessage = CPSessionGenerateThreadIdCodec.encodeRequest(groupId);
        return this.invocationService.invokeOnRandomTarget(clientMessage)
            .then(CPSessionGenerateThreadIdCodec.decodeResponse);
    }

    private scheduleHeartbeatTask(heartbeatMillis: number): void {
        if (this.heartbeatTask !== undefined) {
            return;
        }
        this.heartbeatTask = scheduleWithRepetition(() => {
            for (const session of this.sessions.values()) {
                if (session.isInUse()) {
                    this.requestHeartbeat(session.groupId, session.id)
                        .catch((err) => {
                            if (err instanceof SessionExpiredError || err instanceof CPGroupDestroyedError) {
                                this.invalidateSession(session.groupId, session.id);
                            }
                        });
                }
            }
        }, heartbeatMillis, heartbeatMillis);
    }

    private cancelHeartbeatTask(): void {
        if (this.heartbeatTask !== undefined) {
            cancelRepetitionTask(this.heartbeatTask);
        }
    }
}
