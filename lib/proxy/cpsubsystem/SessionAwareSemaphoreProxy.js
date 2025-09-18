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
exports.SessionAwareSemaphoreProxy = void 0;
const Long = require("long");
const CPSessionAwareProxy_1 = require("./CPSessionAwareProxy");
const CPProxyManager_1 = require("./CPProxyManager");
const CPSessionManager_1 = require("./CPSessionManager");
const Util_1 = require("../../util/Util");
const UuidUtil_1 = require("../../util/UuidUtil");
const SemaphoreInitCodec_1 = require("../../codec/SemaphoreInitCodec");
const SemaphoreAcquireCodec_1 = require("../../codec/SemaphoreAcquireCodec");
const SemaphoreAvailablePermitsCodec_1 = require("../../codec/SemaphoreAvailablePermitsCodec");
const SemaphoreDrainCodec_1 = require("../../codec/SemaphoreDrainCodec");
const SemaphoreChangeCodec_1 = require("../../codec/SemaphoreChangeCodec");
const SemaphoreReleaseCodec_1 = require("../../codec/SemaphoreReleaseCodec");
const core_1 = require("../../core");
/**
 * Since a proxy does not know how many permits will be drained on
 * the Raft group, it uses this constant to increment its local session
 * acquire count. Then, it adjusts the local session acquire count after
 * the drain response is returned.
 */
const DRAIN_SESSION_ACQ_COUNT = 1024;
/** @internal */
class SessionAwareSemaphoreProxy extends CPSessionAwareProxy_1.CPSessionAwareProxy {
    constructor(groupId, proxyName, objectName, invocationService, serializationService, cpSessionManager) {
        super(CPProxyManager_1.CPProxyManager.SEMAPHORE_SERVICE, groupId, proxyName, objectName, invocationService, serializationService, cpSessionManager);
    }
    init(permits) {
        (0, Util_1.assertNonNegativeNumber)(permits);
        return this.encodeInvokeOnRandomTarget(SemaphoreInitCodec_1.SemaphoreInitCodec, SemaphoreInitCodec_1.SemaphoreInitCodec.decodeResponse, this.groupId, this.objectName, permits);
    }
    acquire(permits = 1) {
        (0, Util_1.assertPositiveNumber)(permits);
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.doAcquire(permits, invocationUid);
    }
    doAcquire(permits, invocationUid) {
        let sessionId;
        const threadId = Long.fromNumber(this.nextThreadId());
        return this.acquireSession(permits)
            .then((id) => {
            sessionId = id;
            return this.requestAcquire(sessionId, threadId, invocationUid, permits, -1);
        })
            .catch((err) => {
            if (err instanceof core_1.SessionExpiredError) {
                this.invalidateSession(sessionId);
                return this.doAcquire(permits, invocationUid);
            }
            this.releaseSession(sessionId, permits);
            if (err instanceof core_1.WaitKeyCancelledError) {
                throw new core_1.IllegalStateError('Semaphore[' + this.objectName
                    + '] not acquired because the acquire call on the CP group was cancelled.');
            }
            throw err;
        })
            .then(() => { });
    }
    tryAcquire(permits = 1, timeout = 0) {
        (0, Util_1.assertPositiveNumber)(permits);
        (0, Util_1.assertNonNegativeNumber)(timeout);
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.doTryAcquire(permits, timeout, invocationUid);
    }
    doTryAcquire(permits, timeout, invocationUid) {
        const start = Date.now();
        let sessionId;
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
            if (err instanceof core_1.SessionExpiredError) {
                this.invalidateSession(sessionId);
                timeout -= Date.now() - start;
                if (timeout < 0) {
                    return false;
                }
                return this.doTryAcquire(permits, timeout, invocationUid);
            }
            this.releaseSession(sessionId, permits);
            if (err instanceof core_1.WaitKeyCancelledError) {
                return false;
            }
            throw err;
        });
    }
    release(permits = 1) {
        (0, Util_1.assertPositiveNumber)(permits);
        const sessionId = this.getSessionId();
        if (CPSessionManager_1.NO_SESSION_ID.equals(sessionId)) {
            return Promise.reject(this.newIllegalStateError());
        }
        const threadId = Long.fromNumber(this.nextThreadId());
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.requestRelease(sessionId, threadId, invocationUid, permits)
            .then(() => {
            this.releaseSession(sessionId, permits);
        })
            .catch((err) => {
            if (err instanceof core_1.SessionExpiredError) {
                this.invalidateSession(sessionId);
                throw this.newIllegalStateError(err);
            }
            this.releaseSession(sessionId, permits);
            throw err;
        });
    }
    availablePermits() {
        return this.encodeInvokeOnRandomTarget(SemaphoreAvailablePermitsCodec_1.SemaphoreAvailablePermitsCodec, SemaphoreAvailablePermitsCodec_1.SemaphoreAvailablePermitsCodec.decodeResponse, this.groupId, this.objectName);
    }
    drainPermits() {
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.doDrainPermits(invocationUid);
    }
    doDrainPermits(invocationUid) {
        let sessionId;
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
            if (err instanceof core_1.SessionExpiredError) {
                this.invalidateSession(sessionId);
                return this.doDrainPermits(invocationUid);
            }
            this.releaseSession(sessionId, DRAIN_SESSION_ACQ_COUNT);
            throw err;
        });
    }
    reducePermits(reduction) {
        (0, Util_1.assertNonNegativeNumber)(reduction);
        if (reduction === 0) {
            return Promise.resolve();
        }
        return this.doChangePermits(-reduction);
    }
    increasePermits(increase) {
        (0, Util_1.assertNonNegativeNumber)(increase);
        if (increase === 0) {
            return Promise.resolve();
        }
        return this.doChangePermits(increase);
    }
    doChangePermits(delta) {
        let sessionId;
        const threadId = Long.fromNumber(this.nextThreadId());
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.acquireSession()
            .then((id) => {
            sessionId = id;
            return this.requestChange(sessionId, threadId, invocationUid, delta);
        })
            .then(() => {
            this.releaseSession(sessionId);
        })
            .catch((err) => {
            if (err instanceof core_1.SessionExpiredError) {
                this.invalidateSession(sessionId);
                throw this.newIllegalStateError(err);
            }
            this.releaseSession(sessionId);
            throw err;
        });
    }
    requestAcquire(sessionId, threadId, invocationUid, permits, timeout) {
        return this.encodeInvokeOnRandomTarget(SemaphoreAcquireCodec_1.SemaphoreAcquireCodec, SemaphoreAcquireCodec_1.SemaphoreAcquireCodec.decodeResponse, this.groupId, this.objectName, sessionId, threadId, invocationUid, permits, Long.fromNumber(timeout));
    }
    requestRelease(sessionId, threadId, invocationUid, permits) {
        return this.encodeInvokeOnRandomTarget(SemaphoreReleaseCodec_1.SemaphoreReleaseCodec, () => { }, this.groupId, this.objectName, sessionId, threadId, invocationUid, permits);
    }
    requestDrain(sessionId, threadId, invocationUid) {
        return this.encodeInvokeOnRandomTarget(SemaphoreDrainCodec_1.SemaphoreDrainCodec, SemaphoreDrainCodec_1.SemaphoreDrainCodec.decodeResponse, this.groupId, this.objectName, sessionId, threadId, invocationUid);
    }
    requestChange(sessionId, threadId, invocationUid, delta) {
        return this.encodeInvokeOnRandomTarget(SemaphoreChangeCodec_1.SemaphoreChangeCodec, () => { }, this.groupId, this.objectName, sessionId, threadId, invocationUid, delta);
    }
    newIllegalStateError(cause) {
        return new core_1.IllegalStateError('Semaphore[' + this.objectName + '] has no valid session!', cause);
    }
}
exports.SessionAwareSemaphoreProxy = SessionAwareSemaphoreProxy;
//# sourceMappingURL=SessionAwareSemaphoreProxy.js.map