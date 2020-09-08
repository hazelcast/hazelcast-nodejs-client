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

const fenceThreadIdSymbol = Symbol('FenceThreadIdSymbol');

interface Fence extends Long {
    [fenceThreadIdSymbol]?: number;
}

const INVALID_FENCE = Long.fromNumber(0);

function isValidFence(fence: Long): boolean {
    return fence.greaterThan(INVALID_FENCE);
}

/** @internal */
export class FencedLockProxy extends CPSessionAwareProxy implements FencedLock {

    // "thread id" -> id of the session that has acquired the lock
    private readonly lockedSessionIds: Map<number, Long> = new Map();

    constructor(client: HazelcastClient,
                groupId: RaftGroupId,
                proxyName: string,
                objectName: string) {
        super(client, CPProxyManager.LOCK_SERVICE, groupId, proxyName, objectName);
    }

    destroy(): Promise<void> {
        return super.destroy()
            .then(() => this.lockedSessionIds.clear());
    }

    lock(): Promise<Fence> {
        const threadId = this.nextThreadId();
        const invocationUid = UuidUtil.generate();
        return this.doLock(threadId, invocationUid);
    }

    private doLock(threadId: number, invocationUid: UUID): Promise<Fence> {
        let sessionId: Long;
        return this.acquireSession()
            .then((id) => {
                sessionId = id;
                return this.requestLock(sessionId, Long.fromNumber(threadId), invocationUid);
            })
            .then((fence: Fence) => {
                assert(isValidFence(fence), 'FencedLock somehow hit reentrant lock limit');
                this.lockedSessionIds.set(threadId, sessionId);
                fence[fenceThreadIdSymbol] = threadId;
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

    tryLock(timeout?: number): Promise<Fence | undefined> {
        if (timeout === undefined) {
            timeout = 0;
        }
        assertNumber(timeout);
        const threadId = this.nextThreadId();
        const invocationUid = UuidUtil.generate();
        return this.doTryLock(timeout, threadId, invocationUid);
    }

    private doTryLock(timeout: number, threadId: number, invocationUid: UUID): Promise<Fence | undefined> {
        const start = Date.now();
        let sessionId: Long;
        return this.acquireSession()
            .then((id) => {
                sessionId = id;
                return this.requestTryLock(sessionId, Long.fromNumber(threadId), invocationUid, timeout);
            })
            .then((fence: Fence) => {
                if (isValidFence(fence)) {
                    this.lockedSessionIds.set(threadId, sessionId);
                    fence[fenceThreadIdSymbol] = threadId;
                    return fence;
                }

                this.releaseSession(sessionId);
                return undefined;
            })
            .catch((err) => {
                if (err instanceof WaitKeyCancelledError) {
                    this.releaseSession(sessionId);
                    return undefined;
                }
                if (err instanceof SessionExpiredError) {
                    this.invalidateSession(sessionId);

                    timeout -= Date.now() - start;
                    if (timeout < 0) {
                        return undefined;
                    }
                    return this.doTryLock(timeout, threadId, invocationUid);
                }
                throw err;
            });
    }

    unlock(token: Long): Promise<void> {
        const threadId = this.extractThreadId(token);
        const sessionId = this.getSessionId();

        // the order of the following checks is important
        const lockedSessionId = this.lockedSessionIds.get(threadId);
        if (lockedSessionId !== undefined && !lockedSessionId.equals(sessionId)) {
            this.lockedSessionIds.delete(threadId);
            return Promise.reject(this.newLockOwnershipLostError(lockedSessionId));
        }
        if (NO_SESSION_ID.equals(sessionId)) {
            this.lockedSessionIds.delete(threadId);
            return Promise.reject(
                new IllegalMonitorStateError('Client is not owner of the Lock[' + this.proxyName + '].')
            );
        }

        return this.requestUnlock(sessionId, Long.fromNumber(threadId), UuidUtil.generate())
            .then(() => {
                this.lockedSessionIds.delete(threadId);
                this.releaseSession(sessionId);
            })
            .catch((err) => {
                if (err instanceof SessionExpiredError) {
                    this.lockedSessionIds.delete(threadId);
                    this.invalidateSession(sessionId);

                    throw this.newLockOwnershipLostError(sessionId);
                }
                if (err instanceof IllegalMonitorStateError) {
                    this.lockedSessionIds.delete(threadId);
                }
                throw err;
            });
    }

    isLocked(): Promise<boolean> {
        return this.requestLockOwnershipState().then((state) => {
            const locked = isValidFence(state.fence);
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

    private extractThreadId(fence: Fence): number {
        if (!Long.isLong(fence)) {
            throw new TypeError('Fencing token should be of type Long');
        }
        const threadId = fence[fenceThreadIdSymbol] as number;
        if (threadId === undefined) {
            throw new TypeError('Invalid fencing token provided');
        }
        return threadId;
    }

    private newLockOwnershipLostError(sessionId: Long) {
        return new LockOwnershipLostError('Client is not owner of the Lock[' + this.proxyName
            + '] because its Session[' + sessionId.toString() + '] was closed by server!');
    }
}
