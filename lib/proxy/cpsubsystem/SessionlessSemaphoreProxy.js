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
exports.SessionlessSemaphoreProxy = void 0;
const Long = require("long");
const BaseCPProxy_1 = require("./BaseCPProxy");
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
/** @internal */
class SessionlessSemaphoreProxy extends BaseCPProxy_1.BaseCPProxy {
    constructor(groupId, proxyName, objectName, invocationService, serializationService, cpSessionManager) {
        super(CPProxyManager_1.CPProxyManager.SEMAPHORE_SERVICE, groupId, proxyName, objectName, invocationService, serializationService);
        this.sessionManager = cpSessionManager;
    }
    init(permits) {
        (0, Util_1.assertNonNegativeNumber)(permits);
        return this.encodeInvokeOnRandomTarget(SemaphoreInitCodec_1.SemaphoreInitCodec, SemaphoreInitCodec_1.SemaphoreInitCodec.decodeResponse, this.groupId, this.objectName, permits);
    }
    acquire(permits = 1) {
        (0, Util_1.assertPositiveNumber)(permits);
        return this.doTryAcquire(permits, -1).then(() => { });
    }
    tryAcquire(permits = 1, timeout = 0) {
        (0, Util_1.assertPositiveNumber)(permits);
        (0, Util_1.assertNonNegativeNumber)(timeout);
        return this.doTryAcquire(permits, timeout);
    }
    doTryAcquire(permits, timeout) {
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.getClusterWideThreadId()
            .then((clusterWideThreadId) => this.encodeInvokeOnRandomTarget(SemaphoreAcquireCodec_1.SemaphoreAcquireCodec, SemaphoreAcquireCodec_1.SemaphoreAcquireCodec.decodeResponse, this.groupId, this.objectName, CPSessionManager_1.NO_SESSION_ID, clusterWideThreadId, invocationUid, permits, Long.fromNumber(timeout))).catch((err) => {
            if (err instanceof core_1.WaitKeyCancelledError) {
                throw new core_1.IllegalStateError('Semaphore[' + this.objectName
                    + '] not acquired because the acquire call on the CP group was cancelled.');
            }
            throw err;
        });
    }
    release(permits = 1) {
        (0, Util_1.assertPositiveNumber)(permits);
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.getClusterWideThreadId()
            .then((clusterWideThreadId) => this.encodeInvokeOnRandomTarget(SemaphoreReleaseCodec_1.SemaphoreReleaseCodec, () => { }, this.groupId, this.objectName, CPSessionManager_1.NO_SESSION_ID, clusterWideThreadId, invocationUid, permits));
    }
    availablePermits() {
        return this.encodeInvokeOnRandomTarget(SemaphoreAvailablePermitsCodec_1.SemaphoreAvailablePermitsCodec, SemaphoreAvailablePermitsCodec_1.SemaphoreAvailablePermitsCodec.decodeResponse, this.groupId, this.objectName);
    }
    drainPermits() {
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.getClusterWideThreadId()
            .then((clusterWideThreadId) => this.encodeInvokeOnRandomTarget(SemaphoreDrainCodec_1.SemaphoreDrainCodec, SemaphoreDrainCodec_1.SemaphoreDrainCodec.decodeResponse, this.groupId, this.objectName, CPSessionManager_1.NO_SESSION_ID, clusterWideThreadId, invocationUid));
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
        const invocationUid = UuidUtil_1.UuidUtil.generate();
        return this.getClusterWideThreadId()
            .then((clusterWideThreadId) => this.encodeInvokeOnRandomTarget(SemaphoreChangeCodec_1.SemaphoreChangeCodec, () => { }, this.groupId, this.objectName, CPSessionManager_1.NO_SESSION_ID, clusterWideThreadId, invocationUid, delta));
    }
    getClusterWideThreadId() {
        return this.sessionManager.createUniqueThreadId(this.groupId);
    }
}
exports.SessionlessSemaphoreProxy = SessionlessSemaphoreProxy;
//# sourceMappingURL=SessionlessSemaphoreProxy.js.map