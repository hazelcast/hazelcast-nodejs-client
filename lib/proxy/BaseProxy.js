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
exports.BaseProxy = void 0;
const BuildInfo_1 = require("../BuildInfo");
/**
 * Common super class for any proxy.
 * @internal
 *
 * You will see a lot of try/catch blocks around {@link toData} in proxy methods. This is called controlled serialization
 * and needed due to compact serialization. While serializing a compact object we need to be sure that its schema
 * is replicated to cluster for data integrity. If not, we throw {@link SchemaNotReplicatedError}. Therefore, we
 * check if toData calls throw the error and if so, we register the schema to the cluster and then retry the proxy api call.
 * We need try/catch blocks everywhere to avoid performance penalty of returning Promise.resolve(data) instead
 * of data.
 */
class BaseProxy {
    constructor(serviceName, name, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, connectionRegistry, schemaService) {
        this.serviceName = serviceName;
        this.name = name;
        this.proxyManager = proxyManager;
        this.partitionService = partitionService;
        this.invocationService = invocationService;
        this.serializationService = serializationService;
        this.listenerService = listenerService;
        this.clusterService = clusterService;
        this.connectionRegistry = connectionRegistry;
        this.schemaService = schemaService;
    }
    getPartitionKey() {
        return this.name;
    }
    getName() {
        return this.name;
    }
    getServiceName() {
        return this.serviceName;
    }
    destroy() {
        return this.proxyManager.destroyProxy(this.name, this.serviceName).then(() => {
            return this.postDestroy();
        });
    }
    destroyLocally() {
        return this.postDestroy();
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    registerSchema(schema, clazz) {
        return this.invocationService.registerSchema(schema, clazz);
    }
    postDestroy() {
        return Promise.resolve();
    }
    serializeList(items) {
        return items.map((item) => {
            return this.toData(item);
        });
    }
    deserializeList(items) {
        return items.map((item) => {
            return this.toObject(item);
        });
    }
    deserializeEntryList(entrySet) {
        return entrySet.map((entry) => {
            return [this.toObject(entry[0]), this.toObject(entry[1])];
        });
    }
    /**
     * Encodes a request from a codec and invokes it on owner node of given key.
     */
    encodeInvokeOnKey(codec, partitionKey, handler, ...codecArguments) {
        const partitionId = this.partitionService.getPartitionId(partitionKey);
        return this.encodeInvokeOnPartition(codec, partitionId, handler, ...codecArguments);
    }
    /**
     * Encodes a request from a codec and invokes it on owner node of given key.
     * This method also overrides invocation timeout.
     */
    encodeInvokeOnKeyWithTimeout(timeoutMillis, codec, partitionKey, handler, ...codecArguments) {
        const partitionId = this.partitionService.getPartitionId(partitionKey);
        return this.encodeInvokeOnPartitionWithTimeout(timeoutMillis, codec, partitionId, handler, ...codecArguments);
    }
    /**
     * Encodes a request from a codec and invokes it on any node.
     */
    encodeInvokeOnRandomTarget(codec, handler, ...codecArguments) {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnRandomTarget(clientMessage, handler);
    }
    encodeInvokeOnTarget(codec, target, handler, ...codecArguments) {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnTarget(clientMessage, target, handler);
    }
    /**
     * Encodes a request from a codec and invokes it on owner node of given partition.
     */
    encodeInvokeOnPartition(codec, partitionId, handler, ...codecArguments) {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnPartition(clientMessage, partitionId, handler);
    }
    /**
     * Encodes a request from a codec and invokes it on owner node of given partition.
     * This method also overrides invocation timeout.
     */
    encodeInvokeOnPartitionWithTimeout(timeoutMillis, codec, partitionId, handler, ...codecArguments) {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnPartition(clientMessage, partitionId, handler, timeoutMillis);
    }
    /**
     * Serializes an object according to serialization settings of the client.
     */
    toData(object, partitioningStrategy) {
        return this.serializationService.toData(object, partitioningStrategy);
    }
    /**
     * De-serializes an object from binary form according to serialization settings of the client.
     */
    toObject(data) {
        return this.serializationService.toObject(data);
    }
    getConnectedServerVersion() {
        const activeConnections = this.connectionRegistry.getConnections();
        if (activeConnections.length === 0) {
            return BuildInfo_1.BuildInfo.UNKNOWN_VERSION_ID;
        }
        else {
            return activeConnections[0].getConnectedServerVersion();
        }
    }
}
exports.BaseProxy = BaseProxy;
//# sourceMappingURL=BaseProxy.js.map