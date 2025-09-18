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
exports.ProxyManager = exports.NAMESPACE_SEPARATOR = void 0;
const ClientCreateProxyCodec_1 = require("../codec/ClientCreateProxyCodec");
const ClientDestroyProxyCodec_1 = require("../codec/ClientDestroyProxyCodec");
const InvocationService_1 = require("../invocation/InvocationService");
const FlakeIdGeneratorProxy_1 = require("./flakeid/FlakeIdGeneratorProxy");
const ListProxy_1 = require("./ListProxy");
const MapProxy_1 = require("./MapProxy");
const MultiMapProxy_1 = require("./MultiMapProxy");
const PNCounterProxy_1 = require("./PNCounterProxy");
const QueueProxy_1 = require("./QueueProxy");
const ReplicatedMapProxy_1 = require("./ReplicatedMapProxy");
const RingbufferProxy_1 = require("./ringbuffer/RingbufferProxy");
const SetProxy_1 = require("./SetProxy");
const ReliableTopicProxy_1 = require("./topic/ReliableTopicProxy");
const Util_1 = require("../util/Util");
const ClientCreateProxiesCodec_1 = require("../codec/ClientCreateProxiesCodec");
const NearCachedMapProxy_1 = require("./NearCachedMapProxy");
/** @internal */
exports.NAMESPACE_SEPARATOR = '/';
const RINGBUFFER_PREFIX = '_hz_rb_';
/**
 * Returns distributed objects in the cluster. Also creates and destroys proxies both locally and remotely
 * @internal
 */
class ProxyManager {
    constructor(clientConfig, logger, invocationService, listenerService, partitionService, serializationService, nearCacheManager, getRepairingTask, clusterService, lockReferenceIdGenerator, connectionRegistry, schemaService) {
        this.clientConfig = clientConfig;
        this.logger = logger;
        this.invocationService = invocationService;
        this.listenerService = listenerService;
        this.partitionService = partitionService;
        this.serializationService = serializationService;
        this.nearCacheManager = nearCacheManager;
        this.getRepairingTask = getRepairingTask;
        this.clusterService = clusterService;
        this.lockReferenceIdGenerator = lockReferenceIdGenerator;
        this.connectionRegistry = connectionRegistry;
        this.schemaService = schemaService;
        this.service = {};
        this.proxies = new Map();
    }
    init() {
        this.service[ProxyManager.MAP_SERVICE] = MapProxy_1.MapProxy;
        this.service[ProxyManager.SET_SERVICE] = SetProxy_1.SetProxy;
        this.service[ProxyManager.QUEUE_SERVICE] = QueueProxy_1.QueueProxy;
        this.service[ProxyManager.LIST_SERVICE] = ListProxy_1.ListProxy;
        this.service[ProxyManager.MULTIMAP_SERVICE] = MultiMapProxy_1.MultiMapProxy;
        this.service[ProxyManager.RINGBUFFER_SERVICE] = RingbufferProxy_1.RingbufferProxy;
        this.service[ProxyManager.REPLICATEDMAP_SERVICE] = ReplicatedMapProxy_1.ReplicatedMapProxy;
        this.service[ProxyManager.FLAKEID_SERVICE] = FlakeIdGeneratorProxy_1.FlakeIdGeneratorProxy;
        this.service[ProxyManager.PNCOUNTER_SERVICE] = PNCounterProxy_1.PNCounterProxy;
        this.service[ProxyManager.RELIABLETOPIC_SERVICE] = ReliableTopicProxy_1.ReliableTopicProxy;
    }
    getOrCreateProxy(name, serviceName, createAtServer = true) {
        const fullName = serviceName + exports.NAMESPACE_SEPARATOR + name;
        if (this.proxies.has(fullName)) {
            return this.proxies.get(fullName);
        }
        const deferred = (0, Util_1.deferredPromise)();
        this.proxies.set(fullName, deferred.promise);
        let createProxyPromise;
        if (createAtServer) {
            createProxyPromise = this.createProxy(name, serviceName, () => {
                return this.initializeLocalProxy(name, serviceName, createAtServer);
            });
        }
        else {
            createProxyPromise = this.initializeLocalProxy(name, serviceName, createAtServer);
        }
        createProxyPromise
            .then((localProxy) => {
            deferred.resolve(localProxy);
        })
            .catch((error) => {
            this.proxies.delete(fullName);
            deferred.reject(error);
        });
        return deferred.promise;
    }
    createDistributedObjectsOnCluster() {
        const proxyEntries = new Array(this.proxies.size);
        let index = 0;
        this.proxies.forEach((_, namespace) => {
            const separatorIndex = namespace.indexOf(exports.NAMESPACE_SEPARATOR);
            const serviceName = namespace.substring(0, separatorIndex);
            const name = namespace.substring(separatorIndex + 1);
            proxyEntries[index++] = [name, serviceName];
        });
        if (proxyEntries.length === 0) {
            return Promise.resolve();
        }
        const request = ClientCreateProxiesCodec_1.ClientCreateProxiesCodec.encodeRequest(proxyEntries);
        request.setPartitionId(-1);
        const invocation = new InvocationService_1.Invocation(this.invocationService, request);
        return this.invocationService.invokeUrgent(invocation).then(() => { });
    }
    getDistributedObjects() {
        const promises = new Array(this.proxies.size);
        let index = 0;
        this.proxies.forEach((proxy) => {
            promises[index++] = proxy;
        });
        return Promise.all(promises);
    }
    destroyProxy(name, serviceName) {
        this.proxies.delete(serviceName + exports.NAMESPACE_SEPARATOR + name);
        const clientMessage = ClientDestroyProxyCodec_1.ClientDestroyProxyCodec.encodeRequest(name, serviceName);
        clientMessage.setPartitionId(-1);
        return this.invocationService.invokeOnRandomTarget(clientMessage, () => { });
    }
    destroyProxyLocally(namespace) {
        const proxy = this.proxies.get(namespace);
        if (proxy != null) {
            this.proxies.delete(namespace);
            return proxy.then((distributedObject) => {
                return distributedObject.destroyLocally();
            });
        }
        return Promise.resolve();
    }
    destroy() {
        this.proxies.clear();
    }
    createProxy(name, serviceName, handler) {
        const request = ClientCreateProxyCodec_1.ClientCreateProxyCodec.encodeRequest(name, serviceName);
        return this.invocationService.invokeOnRandomTarget(request, handler);
    }
    initializeLocalProxy(name, serviceName, createAtServer) {
        let localProxy;
        const config = this.clientConfig;
        if (serviceName === ProxyManager.MAP_SERVICE && config.getNearCacheConfig(name)) {
            localProxy = new NearCachedMapProxy_1.NearCachedMapProxy(serviceName, name, this.logger, this, this.partitionService, this.invocationService, this.serializationService, this.nearCacheManager, this.getRepairingTask, this.listenerService, this.clusterService, this.connectionRegistry, this.schemaService);
        }
        else if (serviceName === ProxyManager.MULTIMAP_SERVICE) {
            localProxy = new MultiMapProxy_1.MultiMapProxy(serviceName, name, this, this.partitionService, this.invocationService, this.serializationService, this.listenerService, this.clusterService, this.lockReferenceIdGenerator, this.connectionRegistry, this.schemaService);
        }
        else if (serviceName === ProxyManager.RELIABLETOPIC_SERVICE) {
            localProxy = new ReliableTopicProxy_1.ReliableTopicProxy(serviceName, name, this.logger, this.clientConfig, this, this.partitionService, this.invocationService, this.serializationService, this.listenerService, this.clusterService, this.connectionRegistry, this.schemaService);
        }
        else if (serviceName === ProxyManager.FLAKEID_SERVICE) {
            localProxy = new FlakeIdGeneratorProxy_1.FlakeIdGeneratorProxy(serviceName, name, this.clientConfig, this, this.partitionService, this.invocationService, this.serializationService, this.listenerService, this.clusterService, this.connectionRegistry, this.schemaService);
        }
        else {
            // This call may throw ClientOfflineError for partition specific proxies with async start
            localProxy = new this.service[serviceName](serviceName, name, this, this.partitionService, this.invocationService, this.serializationService, this.listenerService, this.clusterService, this.connectionRegistry, this.schemaService);
        }
        if (serviceName === ProxyManager.RELIABLETOPIC_SERVICE) {
            return this.getOrCreateProxy(RINGBUFFER_PREFIX + name, ProxyManager.RINGBUFFER_SERVICE, createAtServer)
                .then((ringbuffer) => {
                localProxy.setRingbuffer(ringbuffer);
                return localProxy;
            });
        }
        else {
            return Promise.resolve(localProxy);
        }
    }
}
exports.ProxyManager = ProxyManager;
ProxyManager.MAP_SERVICE = 'hz:impl:mapService';
ProxyManager.SET_SERVICE = 'hz:impl:setService';
ProxyManager.LOCK_SERVICE = 'hz:impl:lockService';
ProxyManager.QUEUE_SERVICE = 'hz:impl:queueService';
ProxyManager.LIST_SERVICE = 'hz:impl:listService';
ProxyManager.MULTIMAP_SERVICE = 'hz:impl:multiMapService';
ProxyManager.RINGBUFFER_SERVICE = 'hz:impl:ringbufferService';
ProxyManager.REPLICATEDMAP_SERVICE = 'hz:impl:replicatedMapService';
ProxyManager.FLAKEID_SERVICE = 'hz:impl:flakeIdGeneratorService';
ProxyManager.PNCOUNTER_SERVICE = 'hz:impl:PNCounterService';
ProxyManager.RELIABLETOPIC_SERVICE = 'hz:impl:reliableTopicService';
//# sourceMappingURL=ProxyManager.js.map