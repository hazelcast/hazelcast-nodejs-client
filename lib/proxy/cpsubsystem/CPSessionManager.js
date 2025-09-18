"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPSessionManager = exports.NO_SESSION_ID = exports.SessionState = void 0;
const Long = require("long");
const core_1 = require("../../core");
const CPSessionCreateSessionCodec_1 = require("../../codec/CPSessionCreateSessionCodec");
const CPSessionCloseSessionCodec_1 = require("../../codec/CPSessionCloseSessionCodec");
const CPSessionHeartbeatSessionCodec_1 = require("../../codec/CPSessionHeartbeatSessionCodec");
const CPSessionGenerateThreadIdCodec_1 = require("../../codec/CPSessionGenerateThreadIdCodec");
const Util_1 = require("../../util/Util");
/** @internal */
class SessionState {
    constructor(id, groupId, ttlMillis) {
        this.acquireCount = 0;
        this.id = id;
        this.groupId = groupId;
        this.ttlMillis = ttlMillis;
        this.creationTime = Date.now();
    }
    acquire(count) {
        this.acquireCount += count;
        return this.id;
    }
    release(count) {
        this.acquireCount -= count;
    }
    isValid() {
        return this.isInUse() || !this.isExpired(Date.now());
    }
    isInUse() {
        return this.acquireCount > 0;
    }
    isExpired(timestamp) {
        let expirationTime = this.creationTime + this.ttlMillis;
        if (expirationTime < 0) {
            expirationTime = Number.MAX_SAFE_INTEGER;
        }
        return timestamp > expirationTime;
    }
}
exports.SessionState = SessionState;
/** @internal */
exports.NO_SESSION_ID = Long.fromNumber(-1);
/** @internal */
class CPSessionManager {
    constructor(logger, clientName, invocationService) {
        this.logger = logger;
        this.clientName = clientName;
        this.invocationService = invocationService;
        // <group_id, session_state> map
        this.sessions = new Map();
        // group id to in-flight create session requests map
        this.inFlightCreateSessionRequests = new Map();
        this.isShutdown = false;
    }
    getSessionId(groupId) {
        const session = this.sessions.get(groupId.getStringId());
        return session !== undefined ? session.id : exports.NO_SESSION_ID;
    }
    acquireSession(groupId, permits = 1) {
        return this.getOrCreateSession(groupId).then((state) => {
            return state.acquire(permits);
        });
    }
    releaseSession(groupId, sessionId, permits = 1) {
        const session = this.sessions.get(groupId.getStringId());
        if (session !== undefined && session.id.equals(sessionId)) {
            session.release(permits);
        }
    }
    invalidateSession(groupId, sessionId) {
        const session = this.sessions.get(groupId.getStringId());
        if (session !== undefined && session.id.equals(sessionId)) {
            this.sessions.delete(groupId.getStringId());
        }
    }
    createUniqueThreadId(groupId) {
        if (this.isShutdown) {
            return Promise.reject(new core_1.IllegalStateError('Session manager is already shut down'));
        }
        return this.requestGenerateThreadId(groupId);
    }
    shutdown() {
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
            .then(() => {
            this.sessions.clear();
            this.inFlightCreateSessionRequests.clear();
        });
    }
    getOrCreateSession(groupId) {
        if (this.isShutdown) {
            return Promise.reject(new core_1.IllegalStateError('Session manager is already shut down'));
        }
        const session = this.sessions.get(groupId.getStringId());
        if (session === undefined || !session.isValid()) {
            return this.createNewSession(groupId);
        }
        return Promise.resolve(session);
    }
    createNewSession(groupId) {
        // Check if there is a session request for this group id in-flight.
        const inFlightRequest = this.inFlightCreateSessionRequests.get(groupId.getStringId());
        if (inFlightRequest === undefined) {
            // No in-flight request for this group id. Let's make a new one and register it.
            const requestNewSessionPromise = this.requestNewSession(groupId).then((response) => {
                const state = new SessionState(response.sessionId, groupId, response.ttlMillis.toNumber());
                this.sessions.set(groupId.getStringId(), state);
                this.scheduleHeartbeatTask(response.heartbeatMillis.toNumber());
                return state;
            });
            this.inFlightCreateSessionRequests.set(groupId.getStringId(), requestNewSessionPromise);
            // Remove the request once it is completed normally or exceptionally.
            // This ensures that, if there is no session(request failed or session somehow removed later)
            // or the session is expired, later, a new request can be made for the same group id.
            const onResponseOrError = () => this.inFlightCreateSessionRequests.delete(groupId.getStringId());
            requestNewSessionPromise.then(onResponseOrError, onResponseOrError);
            return requestNewSessionPromise;
        }
        else {
            // There is an in-flight session request for this group id. We should
            // wait for it to complete normally or exceptionally, and then try again.
            // There should be no concurrent create session requests for the same
            // group id.
            const onResponseOrError = () => this.getOrCreateSession(groupId);
            return inFlightRequest.then(onResponseOrError, onResponseOrError);
        }
    }
    requestNewSession(groupId) {
        const clientMessage = CPSessionCreateSessionCodec_1.CPSessionCreateSessionCodec.encodeRequest(groupId, this.clientName);
        return this.invocationService.invokeOnRandomTarget(clientMessage, CPSessionCreateSessionCodec_1.CPSessionCreateSessionCodec.decodeResponse);
    }
    requestCloseSession(groupId, sessionId) {
        const clientMessage = CPSessionCloseSessionCodec_1.CPSessionCloseSessionCodec.encodeRequest(groupId, sessionId);
        return this.invocationService.invokeOnRandomTarget(clientMessage, CPSessionCloseSessionCodec_1.CPSessionCloseSessionCodec.decodeResponse);
    }
    requestHeartbeat(groupId, sessionId) {
        const clientMessage = CPSessionHeartbeatSessionCodec_1.CPSessionHeartbeatSessionCodec.encodeRequest(groupId, sessionId);
        return this.invocationService.invokeOnRandomTarget(clientMessage, () => { });
    }
    requestGenerateThreadId(groupId) {
        const clientMessage = CPSessionGenerateThreadIdCodec_1.CPSessionGenerateThreadIdCodec.encodeRequest(groupId);
        return this.invocationService.invokeOnRandomTarget(clientMessage, CPSessionGenerateThreadIdCodec_1.CPSessionGenerateThreadIdCodec.decodeResponse);
    }
    scheduleHeartbeatTask(heartbeatMillis) {
        if (this.heartbeatTask !== undefined) {
            return;
        }
        this.heartbeatTask = (0, Util_1.scheduleWithRepetition)(() => {
            for (const session of this.sessions.values()) {
                if (session.isInUse()) {
                    this.requestHeartbeat(session.groupId, session.id)
                        .catch((err) => {
                        if (err instanceof core_1.SessionExpiredError || err instanceof core_1.CPGroupDestroyedError) {
                            this.invalidateSession(session.groupId, session.id);
                        }
                    });
                }
            }
        }, heartbeatMillis, heartbeatMillis);
    }
    cancelHeartbeatTask() {
        if (this.heartbeatTask !== undefined) {
            (0, Util_1.cancelRepetitionTask)(this.heartbeatTask);
        }
    }
}
exports.CPSessionManager = CPSessionManager;
//# sourceMappingURL=CPSessionManager.js.map