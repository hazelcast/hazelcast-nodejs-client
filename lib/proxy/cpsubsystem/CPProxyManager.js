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
exports.CPProxyManager = exports.getObjectNameForProxy = exports.withoutDefaultGroupName = void 0;
const assert = require("assert");
const core_1 = require("../../core");
const AtomicLongProxy_1 = require("./AtomicLongProxy");
const AtomicRefProxy_1 = require("./AtomicRefProxy");
const CountDownLatchProxy_1 = require("./CountDownLatchProxy");
const FencedLockProxy_1 = require("./FencedLockProxy");
const SessionlessSemaphoreProxy_1 = require("./SessionlessSemaphoreProxy");
const SessionAwareSemaphoreProxy_1 = require("./SessionAwareSemaphoreProxy");
const CPGroupCreateCPGroupCodec_1 = require("../../codec/CPGroupCreateCPGroupCodec");
const SemaphoreGetSemaphoreTypeCodec_1 = require("../../codec/SemaphoreGetSemaphoreTypeCodec");
const Util_1 = require("../../util/Util");
const DEFAULT_GROUP_NAME = 'default';
/** @internal */
function withoutDefaultGroupName(name) {
    (0, Util_1.assertString)(name);
    name = name.trim();
    const i = name.indexOf('@');
    if (i === -1) {
        return name;
    }
    assert(name.indexOf('@', i + 1) === -1, 'Custom group name must be specified at most once');
    const groupName = name.slice(i + 1).trim();
    if (groupName === DEFAULT_GROUP_NAME) {
        return name.slice(0, i);
    }
    return name;
}
exports.withoutDefaultGroupName = withoutDefaultGroupName;
/** @internal */
function getObjectNameForProxy(name) {
    (0, Util_1.assertString)(name);
    const i = name.indexOf('@');
    if (i === -1) {
        return name;
    }
    assert(i < (name.length - 1), 'Custom CP group name cannot be empty string');
    const objectName = name.slice(0, i).trim();
    assert(objectName.length > 0, 'Object name cannot be empty string');
    return objectName;
}
exports.getObjectNameForProxy = getObjectNameForProxy;
/** @internal */
class CPProxyManager {
    constructor(invocationService, serializationService, cpSessionManager) {
        this.invocationService = invocationService;
        this.serializationService = serializationService;
        this.cpSessionManager = cpSessionManager;
        this.lockProxies = new Map();
    }
    getOrCreateProxy(proxyName, serviceName) {
        proxyName = withoutDefaultGroupName(proxyName);
        const objectName = getObjectNameForProxy(proxyName);
        return this.getGroupId(proxyName).then((groupId) => {
            if (serviceName === CPProxyManager.ATOMIC_LONG_SERVICE) {
                return new AtomicLongProxy_1.AtomicLongProxy(groupId, proxyName, objectName, this.invocationService, this.serializationService);
            }
            else if (serviceName === CPProxyManager.ATOMIC_REF_SERVICE) {
                return new AtomicRefProxy_1.AtomicRefProxy(groupId, proxyName, objectName, this.invocationService, this.serializationService);
            }
            else if (serviceName === CPProxyManager.LATCH_SERVICE) {
                return new CountDownLatchProxy_1.CountDownLatchProxy(groupId, proxyName, objectName, this.invocationService, this.serializationService);
            }
            else if (serviceName === CPProxyManager.LOCK_SERVICE) {
                return this.createFencedLock(groupId, proxyName, objectName);
            }
            else if (serviceName === CPProxyManager.SEMAPHORE_SERVICE) {
                return this.createSemaphore(groupId, proxyName, objectName);
            }
            throw new core_1.IllegalStateError('Unexpected service name: ' + serviceName);
        });
    }
    getGroupId(proxyName) {
        const clientMessage = CPGroupCreateCPGroupCodec_1.CPGroupCreateCPGroupCodec.encodeRequest(proxyName);
        return this.invocationService.invokeOnRandomTarget(clientMessage, CPGroupCreateCPGroupCodec_1.CPGroupCreateCPGroupCodec.decodeResponse);
    }
    createFencedLock(groupId, proxyName, objectName) {
        let proxy = this.lockProxies.get(proxyName);
        if (proxy !== undefined) {
            if (!groupId.equals(proxy.getGroupId())) {
                this.lockProxies.delete(proxyName);
            }
            else {
                return proxy;
            }
        }
        proxy = new FencedLockProxy_1.FencedLockProxy(groupId, proxyName, objectName, this.serializationService, this.invocationService, this.cpSessionManager);
        this.lockProxies.set(proxyName, proxy);
        return proxy;
    }
    createSemaphore(groupId, proxyName, objectName) {
        const clientMessage = SemaphoreGetSemaphoreTypeCodec_1.SemaphoreGetSemaphoreTypeCodec.encodeRequest(proxyName);
        return this.invocationService.invokeOnRandomTarget(clientMessage, SemaphoreGetSemaphoreTypeCodec_1.SemaphoreGetSemaphoreTypeCodec.decodeResponse)
            .then((jdkCompatible) => {
            return jdkCompatible
                ? new SessionlessSemaphoreProxy_1.SessionlessSemaphoreProxy(groupId, proxyName, objectName, this.invocationService, this.serializationService, this.cpSessionManager)
                : new SessionAwareSemaphoreProxy_1.SessionAwareSemaphoreProxy(groupId, proxyName, objectName, this.invocationService, this.serializationService, this.cpSessionManager);
        });
    }
}
exports.CPProxyManager = CPProxyManager;
CPProxyManager.ATOMIC_LONG_SERVICE = 'hz:raft:atomicLongService';
CPProxyManager.ATOMIC_REF_SERVICE = 'hz:raft:atomicRefService';
CPProxyManager.LATCH_SERVICE = 'hz:raft:countDownLatchService';
CPProxyManager.LOCK_SERVICE = 'hz:raft:lockService';
CPProxyManager.SEMAPHORE_SERVICE = 'hz:raft:semaphoreService';
//# sourceMappingURL=CPProxyManager.js.map