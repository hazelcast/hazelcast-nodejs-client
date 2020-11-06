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

import * as Long from 'long';
import {HazelcastClient} from '../../HazelcastClient';
import {CPSessionAwareProxy} from './CPSessionAwareProxy';
import {ISemaphore} from '../ISemaphore';
import {CPProxyManager} from './CPProxyManager';
import {NO_SESSION_ID} from './CPSessionManager';
import {RaftGroupId} from './RaftGroupId';
import {
    assertNonNegativeNumber,
    assertPositiveNumber
} from '../../util/Util';
import {UuidUtil} from '../../util/UuidUtil';
import {SemaphoreInitCodec} from '../../codec/SemaphoreInitCodec';
import {SemaphoreAcquireCodec} from '../../codec/SemaphoreAcquireCodec';
import {SemaphoreAvailablePermitsCodec} from '../../codec/SemaphoreAvailablePermitsCodec';
import {SemaphoreDrainCodec} from '../../codec/SemaphoreDrainCodec';
import {SemaphoreChangeCodec} from '../../codec/SemaphoreChangeCodec';
import {SemaphoreReleaseCodec} from '../../codec/SemaphoreReleaseCodec';
import {
    IllegalStateError,
    SessionExpiredError,
    WaitKeyCancelledError,
    UUID
} from '../../core';

/**
 * Since a proxy does not know how many permits will be drained on
 * the Raft group, it uses this constant to increment its local session
 * acquire count. Then, it adjusts the local session acquire count after
 * the drain response is returned.
 */
const DRAIN_SESSION_ACQ_COUNT = 1024;

/** @internal */
export class SessionAwareSemaphoreProxy extends CPSessionAwareProxy implements ISemaphore {

    constructor(client: HazelcastClient,
                groupId: RaftGroupId,
                proxyName: string,
                objectName: string) {
        super(client, CPProxyManager.SEMAPHORE_SERVICE, groupId, proxyName, objectName);
    }

    init(permits: number): Promise<boolean> {
        assertNonNegativeNumber(permits);
        return this.encodeInvokeOnRandomTarget(SemaphoreInitCodec, this.groupId, this.objectName, permits)
            .then(SemaphoreInitCodec.decodeResponse);
    }

    acquire(permits = 1): Promise<void> {
        assertPositiveNumber(permits);

        const invocationUid = UuidUtil.generate();
        return this.doAcquire(permits, invocationUid);
    }

    private doAcquire(permits: number, invocationUid: UUID): Promise<void> {
        let sessionId: Long;
        const threadId = Long.fromNumber(this.nextThreadId());
        return this.acquireSession(permits)
            .then((id) => {
                sessionId = id;
                return this.requestAcquire(sessionId, threadId, invocationUid, permits, -1);
            })
            .catch((err) => {
                if (err instanceof SessionExpiredError) {
                    this.invalidateSession(sessionId);
                    return this.doAcquire(permits, invocationUid);
                }
                this.releaseSession(sessionId, permits);
                if (err instanceof WaitKeyCancelledError) {
                    throw new IllegalStateError('Semaphore[' + this.objectName
                        + '] not acquired because the acquire call on the CP group was cancelled.');
                }
                throw err;
            })
            .then(() => {});
    }

    tryAcquire(permits = 1, timeout = 0): Promise<boolean> {
        assertPositiveNumber(permits);
        assertNonNegativeNumber(timeout);

        const invocationUid = UuidUtil.generate();
        return this.doTryAcquire(permits, timeout, invocationUid);
    }

    private doTryAcquire(permits: number, timeout: number, invocationUid: UUID): Promise<boolean> {
        const start = Date.now();
        let sessionId: Long;
        const threadId = Long.fromNumber(this.nextThreadId());
        return this.acquireSession(permits)
            .then((id) => {
                sessionId = id;
                return this.requestAcquire(sessionId, threadId, invocationUid, permits, timeout);
            })
            .then((acquired) => {
                if (!acquired) {
                    this.releaseSession(sessionId, permits);
                }
                return acquired;
            })
            .catch((err) => {
                if (err instanceof SessionExpiredError) {
                    this.invalidateSession(sessionId);

                    timeout -= Date.now() - start;
                    if (timeout < 0) {
                        return false;
                    }
                    return this.doTryAcquire(permits, timeout, invocationUid);
                }
                this.releaseSession(sessionId, permits);
                if (err instanceof WaitKeyCancelledError) {
                    return false;
                }
                throw err;
            });
    }

    release(permits = 1): Promise<void> {
        assertPositiveNumber(permits);

        const sessionId = this.getSessionId();
        if (NO_SESSION_ID.equals(sessionId)) {
            return Promise.reject(this.newIllegalStateError());
        }
        const threadId = Long.fromNumber(this.nextThreadId());
        const invocationUid = UuidUtil.generate();
        return this.requestRelease(sessionId, threadId, invocationUid, permits)
            .then(() => {
                this.releaseSession(sessionId, permits);
            })
            .catch((err) => {
                if (err instanceof SessionExpiredError) {
                    this.invalidateSession(sessionId);
                    throw this.newIllegalStateError(err);
                }
                this.releaseSession(sessionId, permits);
                throw err;
            });
    }

    availablePermits(): Promise<number> {
        return this.encodeInvokeOnRandomTarget(SemaphoreAvailablePermitsCodec, this.groupId, this.objectName)
            .then(SemaphoreAvailablePermitsCodec.decodeResponse);
    }

    drainPermits(): Promise<number> {
        const invocationUid = UuidUtil.generate();
        return this.doDrainPermits(invocationUid);
    }

    private doDrainPermits(invocationUid: UUID): Promise<number> {
        let sessionId: Long;
        const threadId = Long.fromNumber(this.nextThreadId());
        return this.acquireSession(DRAIN_SESSION_ACQ_COUNT)
            .then((id) => {
                sessionId = id;
                return this.requestDrain(sessionId, threadId, invocationUid);
            })
            .then((count) => {
                this.releaseSession(sessionId, DRAIN_SESSION_ACQ_COUNT - count);
                return count;
            })
            .catch((err) => {
                if (err instanceof SessionExpiredError) {
                    this.invalidateSession(sessionId);
                    return this.doDrainPermits(invocationUid);
                }
                this.releaseSession(sessionId, DRAIN_SESSION_ACQ_COUNT);
                throw err;
            });
    }

    reducePermits(reduction: number): Promise<void> {
        assertNonNegativeNumber(reduction);
        if (reduction === 0) {
            return Promise.resolve();
        }
        return this.doChangePermits(-reduction);
    }

    increasePermits(increase: number): Promise<void> {
        assertNonNegativeNumber(increase);
        if (increase === 0) {
            return Promise.resolve();
        }
        return this.doChangePermits(increase);
    }

    private doChangePermits(delta: number): Promise<void> {
        let sessionId: Long;
        const threadId = Long.fromNumber(this.nextThreadId());
        const invocationUid = UuidUtil.generate();
        return this.acquireSession()
            .then((id) => {
                sessionId = id;
                return this.requestChange(sessionId, threadId, invocationUid, delta);
            })
            .then(() => {
                this.releaseSession(sessionId);
            })
            .catch((err) => {
                if (err instanceof SessionExpiredError) {
                    this.invalidateSession(sessionId);
                    throw this.newIllegalStateError(err);
                }
                this.releaseSession(sessionId);
                throw err;
            });
    }

    private requestAcquire(sessionId: Long,
                           threadId: Long,
                           invocationUid: UUID,
                           permits: number,
                           timeout: number): Promise<boolean> {
        return this.encodeInvokeOnRandomTarget(
            SemaphoreAcquireCodec,
            this.groupId,
            this.objectName,
            sessionId,
            threadId,
            invocationUid,
            permits,
            Long.fromNumber(timeout)
        ).then(SemaphoreAcquireCodec.decodeResponse);
    }

    private requestRelease(sessionId: Long,
                           threadId: Long,
                           invocationUid: UUID,
                           permits: number): Promise<void> {
        return this.encodeInvokeOnRandomTarget(
            SemaphoreReleaseCodec,
            this.groupId,
            this.objectName,
            sessionId,
            threadId,
            invocationUid,
            permits
        ).then(() => {});
    }

    private requestDrain(sessionId: Long,
                         threadId: Long,
                         invocationUid: UUID): Promise<number> {
        return this.encodeInvokeOnRandomTarget(
            SemaphoreDrainCodec,
            this.groupId,
            this.objectName,
            sessionId,
            threadId,
            invocationUid
        ).then(SemaphoreDrainCodec.decodeResponse);
    }

    private requestChange(sessionId: Long,
                          threadId: Long,
                          invocationUid: UUID,
                          delta: number): Promise<void> {
        return this.encodeInvokeOnRandomTarget(
            SemaphoreChangeCodec,
            this.groupId,
            this.objectName,
            sessionId,
            threadId,
            invocationUid,
            delta
        ).then(() => {});
    }

    private newIllegalStateError(cause?: SessionExpiredError) {
        return new IllegalStateError('Semaphore[' + this.objectName + '] has no valid session!', cause);
    }
}
