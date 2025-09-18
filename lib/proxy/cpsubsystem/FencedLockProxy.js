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
exports.FencedLockProxy = void 0;
const assert = require("assert");
const Long = require("long");
const CPSessionAwareProxy_1 = require("./CPSessionAwareProxy");
const CPProxyManager_1 = require("./CPProxyManager");
const CPSessionManager_1 = require("./CPSessionManager");
const FencedLockLockCodec_1 = require("../../codec/FencedLockLockCodec");
const FencedLockTryLockCodec_1 = require("../../codec/FencedLockTryLockCodec");
const FencedLockUnlockCodec_1 = require("../../codec/FencedLockUnlockCodec");
const FencedLockGetLockOwnershipCodec_1 = require("../../codec/FencedLockGetLockOwnershipCodec");
const Util_1 = require("../../util/Util");
const UuidUtil_1 = require("../../util/UuidUtil");
const core_1 = require("../../core");
const fenceThreadIdSymbol = Symbol('FenceThreadIdSymbol');
const INVALID_FENCE = Long.fromNumber(0);
function isValidFence(fence) {
    return fence.greaterThan(INVALID_FENCE);
}
/** @internal */
class FencedLockProxy extends CPSessionAwareProxy_1.CPSessionAwareProxy {
    constructor(groupId, proxyName, objectName, serializationService, invocationService, cpSessionManager) {
        super(CPProxyManager_1.CPProxyManager.LOCK_SERVICE, groupId, proxyName, objectName, invocationService, serializationService, cpSessionManager);
        // "thread id" -> id of the session that has acquired the lock
        this.lockedSessionIds = new Map();
    }
    destroy() {
        return super.destroy()
            .then(() => this.lockedSessionIds.clear());
    }
    lock() {
        const threadId = this.nextThreadId();
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.doLock(threadId, invocationUid);
    }
    doLock(threadId, invocationUid) {
        let sessionId;
        return this.acquireSession()
            .then((id) => {
            sessionId = id;
            return this.requestLock(sessionId, Long.fromNumber(threadId), invocationUid);
        })
            .then((fence) => {
            assert(isValidFence(fence), 'FencedLock somehow hit reentrant lock limit');
            this.lockedSessionIds.set(threadId, sessionId);
            fence[fenceThreadIdSymbol] = threadId;
            return fence;
        })
            .catch((err) => {
            if (err instanceof core_1.SessionExpiredError) {
                this.invalidateSession(sessionId);
                return this.doLock(threadId, invocationUid);
            }
            this.releaseSession(sessionId);
            if (err instanceof core_1.WaitKeyCancelledError) {
                throw new core_1.IllegalMonitorStateError('Lock[' + this.objectName
                    + '] not acquired because the lock call on the CP group was cancelled.');
            }
            throw err;
        });
    }
    tryLock(timeout = 0) {
        (0, Util_1.assertNonNegativeNumber)(timeout);
        const threadId = this.nextThreadId();
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.doTryLock(timeout, threadId, invocationUid);
    }
    doTryLock(timeout, threadId, invocationUid) {
        const start = Date.now();
        let sessionId;
        return this.acquireSession()
            .then((id) => {
            sessionId = id;
            return this.requestTryLock(sessionId, Long.fromNumber(threadId), invocationUid, timeout);
        })
            .then((fence) => {
            if (isValidFence(fence)) {
                this.lockedSessionIds.set(threadId, sessionId);
                fence[fenceThreadIdSymbol] = threadId;
                return fence;
            }
            this.releaseSession(sessionId);
            return undefined;
        })
            .catch((err) => {
            if (err instanceof core_1.SessionExpiredError) {
                this.invalidateSession(sessionId);
                timeout -= Date.now() - start;
                if (timeout < 0) {
                    return undefined;
                }
                return this.doTryLock(timeout, threadId, invocationUid);
            }
            this.releaseSession(sessionId);
            if (err instanceof core_1.WaitKeyCancelledError) {
                return undefined;
            }
            throw err;
        });
    }
    unlock(token) {
        const threadId = FencedLockProxy.extractThreadId(token);
        const sessionId = this.getSessionId();
        // the order of the following checks is important
        const lockedSessionId = this.lockedSessionIds.get(threadId);
        if (lockedSessionId !== undefined && !lockedSessionId.equals(sessionId)) {
            this.lockedSessionIds.delete(threadId);
            return Promise.reject(this.newLockOwnershipLostError(lockedSessionId));
        }
        if (CPSessionManager_1.NO_SESSION_ID.equals(sessionId)) {
            this.lockedSessionIds.delete(threadId);
            return Promise.reject(new core_1.IllegalMonitorStateError('Client is not owner of the Lock[' + this.proxyName + '].'));
        }
        return this.requestUnlock(sessionId, Long.fromNumber(threadId), UuidUtil_1.UuidUtil.generate())
            .then(() => {
            this.lockedSessionIds.delete(threadId);
            this.releaseSession(sessionId);
        })
            .catch((err) => {
            if (err instanceof core_1.SessionExpiredError) {
                this.lockedSessionIds.delete(threadId);
                this.invalidateSession(sessionId);
                throw this.newLockOwnershipLostError(sessionId);
            }
            if (err instanceof core_1.IllegalMonitorStateError) {
                this.lockedSessionIds.delete(threadId);
            }
            throw err;
        });
    }
    isLocked() {
        return this.requestLockOwnershipState().then((state) => {
            const locked = isValidFence(state.fence);
            return locked;
        });
    }
    requestLock(sessionId, threadId, invocationUid) {
        return this.encodeInvokeOnRandomTarget(FencedLockLockCodec_1.FencedLockLockCodec, FencedLockLockCodec_1.FencedLockLockCodec.decodeResponse, this.groupId, this.objectName, sessionId, threadId, invocationUid);
    }
    requestTryLock(sessionId, threadId, invocationUid, timeout) {
        return this.encodeInvokeOnRandomTarget(FencedLockTryLockCodec_1.FencedLockTryLockCodec, FencedLockTryLockCodec_1.FencedLockTryLockCodec.decodeResponse, this.groupId, this.objectName, sessionId, threadId, invocationUid, timeout);
    }
    requestUnlock(sessionId, threadId, invocationUid) {
        return this.encodeInvokeOnRandomTarget(FencedLockUnlockCodec_1.FencedLockUnlockCodec, FencedLockUnlockCodec_1.FencedLockUnlockCodec.decodeResponse, this.groupId, this.objectName, sessionId, threadId, invocationUid);
    }
    requestLockOwnershipState() {
        return this.encodeInvokeOnRandomTarget(FencedLockGetLockOwnershipCodec_1.FencedLockGetLockOwnershipCodec, FencedLockGetLockOwnershipCodec_1.FencedLockGetLockOwnershipCodec.decodeResponse, this.groupId, this.objectName);
    }
    static extractThreadId(fence) {
        if (!Long.isLong(fence)) {
            throw new TypeError('Fencing token should be of type Long');
        }
        const threadId = fence[fenceThreadIdSymbol];
        if (threadId === undefined) {
            throw new TypeError('Invalid fencing token provided');
        }
        return threadId;
    }
    newLockOwnershipLostError(sessionId) {
        return new core_1.LockOwnershipLostError('Client is not owner of the Lock[' + this.proxyName
            + '] because its Session[' + sessionId.toString() + '] was closed by server!');
    }
}
exports.FencedLockProxy = FencedLockProxy;
//# sourceMappingURL=FencedLockProxy.js.map