/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import * as assert from 'assert';
import * as Long from 'long';
import * as Promise from 'bluebird';
import {HazelcastClient} from '../../HazelcastClient';
import {CPSessionAwareProxy} from './CPSessionAwareProxy';
import {FencedLock} from '../FencedLock';
import {CPProxyManager} from './CPProxyManager';
import {NO_SESSION_ID} from './CPSessionManager';
import {RaftGroupId} from './RaftGroupId';
import {FencedLockLockCodec} from '../../codec/FencedLockLockCodec';
import {FencedLockTryLockCodec} from '../../codec/FencedLockTryLockCodec';
import {FencedLockUnlockCodec} from '../../codec/FencedLockUnlockCodec';
import {
    FencedLockGetLockOwnershipCodec,
    FencedLockGetLockOwnershipResponseParams
} from '../../codec/FencedLockGetLockOwnershipCodec';
import {assertNumber} from '../../util/Util';
import {UuidUtil} from '../../util/UuidUtil';
import {
    IllegalMonitorStateError,
    LockOwnershipLostError,
    SessionExpiredError,
    WaitKeyCancelledError,
    UUID
} from '../../core';

const INVALID_FENCE = Long.fromNumber(0);

/**
 * Contains information for the last successful lock acquire.
 */
class LastKnownLock {

    // "thread id" that has acquired the lock
    threadId: number;
    // session id that has acquired the lock
    sessionId: Long;

    update(threadId: number, sessionId: Long) {
        this.threadId = threadId;
        this.sessionId = sessionId;
    }

    clear(): void {
        this.threadId = undefined;
        this.sessionId = undefined;
    }

    clearIfSameThread(threadId: number): void {
        if (this.threadId === threadId) {
            this.clear();
        }
    }

    isEmpty(): boolean {
        return this.threadId === undefined && this.sessionId === undefined;
    }
}

function isValidFence(fence: Long): boolean {
    return fence.greaterThan(INVALID_FENCE);
}

function wrapErrorWithPromise(fn: () => void): Promise<any> | undefined {
    try {
        fn();
        return undefined;
    } catch (err) {
        return Promise.reject(err);
    }
}

/** @internal */
export class FencedLockProxy extends CPSessionAwareProxy implements FencedLock {

    private readonly lastKnownLock = new LastKnownLock();

    constructor(client: HazelcastClient,
                groupId: RaftGroupId,
                proxyName: string,
                objectName: string) {
        super(client, CPProxyManager.LOCK_SERVICE, groupId, proxyName, objectName);
    }

    lock(): Promise<Long> {
        const threadId = this.nextThreadId();
        const invocationUid = UuidUtil.generate();
        return this.doLock(threadId, invocationUid);
    }

    private doLock(threadId: number, invocationUid: UUID): Promise<Long> {
        let sessionId: Long;
        return this.acquireSession()
            .then((id) => {
                sessionId = id;
                this.verifyLockedSessionId(sessionId, true);
                return this.requestLock(sessionId, Long.fromNumber(threadId), invocationUid);
            })
            .then((fence) => {
                assert(isValidFence(fence), 'FencedLock somehow hit reentrant lock limit');
                this.lastKnownLock.update(threadId, sessionId);
                return fence;
            })
            .catch((err) => {
                if (err instanceof SessionExpiredError) {
                    this.invalidateSession(sessionId);
                    return this.doLock(threadId, invocationUid);
                }
                if (err instanceof WaitKeyCancelledError) {
                    this.releaseSession(sessionId);
                    throw new IllegalMonitorStateError('Lock[' + this.objectName
                        + '] not acquired because the lock call on the CP group was cancelled.');
                }
                throw err;
            });
    }

    tryLock(timeout?: number): Promise<Long> {
        if (timeout === undefined) {
            timeout = 0;
        }
        assertNumber(timeout);
        const threadId = this.nextThreadId();
        const invocationUid = UuidUtil.generate();
        return this.doTryLock(timeout, threadId, invocationUid);
    }

    private doTryLock(timeout: number, threadId: number, invocationUid: UUID): Promise<Long> {
        const start = Date.now();
        let sessionId: Long;
        return this.acquireSession()
            .then((id) => {
                sessionId = id;
                this.verifyLockedSessionId(sessionId, true);
                return this.requestTryLock(sessionId, Long.fromNumber(threadId), invocationUid, timeout);
            })
            .then((fence) => {
                if (isValidFence(fence)) {
                    this.lastKnownLock.update(threadId, sessionId);
                } else {
                    this.releaseSession(sessionId);
                }
                return fence;
            })
            .catch((err) => {
                if (err instanceof WaitKeyCancelledError) {
                    this.releaseSession(sessionId);
                    return INVALID_FENCE;
                }
                if (err instanceof SessionExpiredError) {
                    this.invalidateSession(sessionId);

                    timeout -= Date.now() - start;
                    if (timeout < 0) {
                        return INVALID_FENCE;
                    }
                    return this.doTryLock(timeout, threadId, invocationUid);
                }
                throw err;
            });
    }

    unlock(): Promise<void> {
        const threadId = this.lastKnownLock.threadId;
        const sessionId = this.getSessionId();
        const rejected = wrapErrorWithPromise(() => this.verifyLockedSessionId(sessionId, false));
        if (rejected) {
            return rejected;
        }
        if (this.lastKnownLock.isEmpty() || NO_SESSION_ID.equals(sessionId)) {
            this.lastKnownLock.clear();
            return Promise.reject(
                new IllegalMonitorStateError('Client is not owner of the Lock[' + this.proxyName + '].')
            );
        }

        return this.requestUnlock(sessionId, Long.fromNumber(threadId), UuidUtil.generate())
            .then(() => {
                this.lastKnownLock.clearIfSameThread(threadId);
                this.releaseSession(sessionId);
            })
            .catch((err) => {
                if (err instanceof SessionExpiredError) {
                    this.lastKnownLock.clearIfSameThread(threadId);
                    this.invalidateSession(sessionId);

                    throw this.newLockOwnershipLostError(sessionId);
                }
                if (err instanceof IllegalMonitorStateError) {
                    this.lastKnownLock.clearIfSameThread(threadId);
                }
                throw err;
            });
    }

    isLocked(): Promise<boolean> {
        const sessionId = this.getSessionId();
        const rejected = wrapErrorWithPromise(() => this.verifyLockedSessionId(sessionId, false));
        if (rejected) {
            return rejected;
        }

        return this.requestLockOwnershipState().then((state) => {
            const locked = isValidFence(state.fence);
            if (locked && sessionId.equals(state.sessionId)) {
                this.lastKnownLock.update(state.threadId.toNumber(), state.sessionId);
            }
            return locked;
        });
    }

    private requestLock(sessionId: Long, threadId: Long, invocationUid: UUID): Promise<Long> {
        return this.encodeInvokeOnRandomTarget(
            FencedLockLockCodec, this.groupId, this.objectName, sessionId, threadId, invocationUid
        ).then((clientMessage) => {
            const response = FencedLockLockCodec.decodeResponse(clientMessage);
            return response.response;
        });
    }

    private requestTryLock(sessionId: Long, threadId: Long, invocationUid: UUID, timeout: number): Promise<Long> {
        return this.encodeInvokeOnRandomTarget(
            FencedLockTryLockCodec, this.groupId, this.objectName, sessionId, threadId, invocationUid, timeout
        ).then((clientMessage) => {
            const response = FencedLockTryLockCodec.decodeResponse(clientMessage);
            return response.response;
        });
    }

    private requestUnlock(sessionId: Long, threadId: Long, invocationUid: UUID): Promise<boolean> {
        return this.encodeInvokeOnRandomTarget(
            FencedLockUnlockCodec, this.groupId, this.objectName, sessionId, threadId, invocationUid
        ).then((clientMessage) => {
            const response = FencedLockUnlockCodec.decodeResponse(clientMessage);
            return response.response;
        });
    }

    private requestLockOwnershipState(): Promise<FencedLockGetLockOwnershipResponseParams> {
        return this.encodeInvokeOnRandomTarget(
            FencedLockGetLockOwnershipCodec, this.groupId, this.objectName
        ).then((clientMessage) => {
            const response = FencedLockGetLockOwnershipCodec.decodeResponse(clientMessage);
            return response;
        });
    }

    private verifyLockedSessionId(sessionId: Long, releaseSession: boolean): void {
        const lockedSessionId = this.lastKnownLock.sessionId;
        if (lockedSessionId !== undefined && !lockedSessionId.equals(sessionId)) {
            this.lastKnownLock.clear();
            if (releaseSession) {
                this.releaseSession(sessionId);
            }
            throw this.newLockOwnershipLostError(lockedSessionId);
        }
    }

    private newLockOwnershipLostError(sessionId: Long) {
        return new LockOwnershipLostError('Client is not owner of the Lock[' + this.proxyName
            + '] because its Session[' + sessionId.toString() + '] was closed by server!');
    }
}
