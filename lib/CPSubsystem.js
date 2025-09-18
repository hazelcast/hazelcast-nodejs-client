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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPSubsystemImpl = void 0;
const CPProxyManager_1 = require("./proxy/cpsubsystem/CPProxyManager");
const CPSessionManager_1 = require("./proxy/cpsubsystem/CPSessionManager");
/**
 * Creates CP proxies.
 * @internal
 */
class CPSubsystemImpl {
    constructor(logger, clientName, invocationService, serializationService) {
        this.cpSessionManager = new CPSessionManager_1.CPSessionManager(logger, clientName, invocationService);
        this.cpProxyManager = new CPProxyManager_1.CPProxyManager(invocationService, serializationService, this.cpSessionManager);
    }
    getAtomicLong(name) {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager_1.CPProxyManager.ATOMIC_LONG_SERVICE);
    }
    getAtomicReference(name) {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager_1.CPProxyManager.ATOMIC_REF_SERVICE);
    }
    getCountDownLatch(name) {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager_1.CPProxyManager.LATCH_SERVICE);
    }
    getLock(name) {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager_1.CPProxyManager.LOCK_SERVICE);
    }
    getSemaphore(name) {
        return this.cpProxyManager.getOrCreateProxy(name, CPProxyManager_1.CPProxyManager.SEMAPHORE_SERVICE);
    }
    getCPSessionManager() {
        return this.cpSessionManager;
    }
    shutdown() {
        return this.cpSessionManager.shutdown();
    }
}
exports.CPSubsystemImpl = CPSubsystemImpl;
//# sourceMappingURL=CPSubsystem.js.map