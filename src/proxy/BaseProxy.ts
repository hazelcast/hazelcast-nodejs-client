/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import {BuildInfo} from '../BuildInfo';
import {Data} from '../serialization/Data';
import {ClientMessage} from '../protocol/ClientMessage';
import {UUID} from '../core/UUID';
import {ProxyManager} from './ProxyManager';
import {PartitionService} from '../PartitionService';
import {InvocationService} from '../invocation/InvocationService';
import {SerializationService} from '../serialization/SerializationService';
import {ConnectionRegistry} from '../network/ConnectionRegistry';
import {ListenerService} from '../listener/ListenerService';
import {ClusterService} from '../invocation/ClusterService';
import {SchemaService} from '../serialization/compact/SchemaService';
import {Schema} from '../serialization/compact/Schema';

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
export abstract class BaseProxy {

    constructor(
        protected readonly serviceName: string,
        protected readonly name: string,
        protected readonly proxyManager: ProxyManager,
        protected readonly partitionService: PartitionService,
        protected readonly invocationService: InvocationService,
        protected readonly serializationService: SerializationService,
        protected readonly listenerService: ListenerService,
        protected readonly clusterService: ClusterService,
        protected readonly connectionRegistry: ConnectionRegistry,
        protected readonly schemaService: SchemaService
    ) {}

    getPartitionKey(): string {
        return this.name;
    }

    getName(): string {
        return this.name;
    }

    getServiceName(): string {
        return this.serviceName;
    }

    destroy(): Promise<void> {
        return this.proxyManager.destroyProxy(this.name, this.serviceName).then(() => {
            return this.postDestroy();
        });
    }

    destroyLocally(): Promise<void> {
        return this.postDestroy();
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    protected registerSchema(schema: Schema, clazz: Function | undefined): Promise<void> {
        return this.invocationService.registerSchema(schema, clazz);
    }

    protected postDestroy(): Promise<void> {
        return Promise.resolve();
    }

    protected serializeList(items: any[]): Data[] {
        return items.map((item: any) => {
            return this.toData(item);
        });
    }

    protected deserializeList(items: Data[]): any[] {
        return items.map((item: Data) => {
            return this.toObject(item);
        });
    }

    protected deserializeEntryList<K, V>(entrySet: Array<[Data, Data]>): Array<[K, V]> {
        const deserializedList: Array<[K, V]> = new Array(entrySet.length);
        for (let i = 0; i < entrySet.length; i++) {
            deserializedList[i] = [this.toObject(entrySet[i][0]), this.toObject(entrySet[i][1])];
        }
        return deserializedList;
    }

    /**
     * Encodes a request from a codec and invokes it on owner node of given key.
     */
    protected encodeInvokeOnKey<V>(
        codec: any, partitionKey: any, handler: (clientMessage: ClientMessage) => V, ...codecArguments: any[]
    ): Promise<V> {
        const partitionId: number = this.partitionService.getPartitionId(partitionKey);
        return this.encodeInvokeOnPartition(codec, partitionId, handler, ...codecArguments);
    }

    /**
     * Encodes a request from a codec and invokes it on owner node of given key.
     * This method also overrides invocation timeout.
     */
    protected encodeInvokeOnKeyWithTimeout<V>(timeoutMillis: number,
                                           codec: any,
                                           partitionKey: any,
                                           handler: (clientMessage: ClientMessage) => V,
                                           ...codecArguments: any[]): Promise<V> {
        const partitionId: number = this.partitionService.getPartitionId(partitionKey);
        return this.encodeInvokeOnPartitionWithTimeout(timeoutMillis, codec, partitionId, handler, ...codecArguments);
    }

    /**
     * Encodes a request from a codec and invokes it on any node.
     */
    protected encodeInvokeOnRandomTarget<V>(
        codec: any, handler: (clientMessage: ClientMessage) => V,  ...codecArguments: any[]
    ): Promise<V> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnRandomTarget(clientMessage, handler);
    }

    protected encodeInvokeOnTarget<V>(
        codec: any, target: UUID, handler: (clientMessage: ClientMessage) => V, ...codecArguments: any[]
    ): Promise<V> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnTarget(clientMessage, target, handler);
    }

    /**
     * Encodes a request from a codec and invokes it on owner node of given partition.
     */
    protected encodeInvokeOnPartition<V>(
        codec: any, partitionId: number, handler: (clientMessage: ClientMessage) => V, ...codecArguments: any[]
    ): Promise<V> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnPartition(clientMessage, partitionId, handler);
    }

    /**
     * Encodes a request from a codec and invokes it on owner node of given partition.
     * This method also overrides invocation timeout.
     */
    protected encodeInvokeOnPartitionWithTimeout<V>(timeoutMillis: number,
                                                 codec: any,
                                                 partitionId: number,
                                                 handler: (clientMessage: ClientMessage) => V,
                                                 ...codecArguments: any[]): Promise<V> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnPartition(clientMessage, partitionId, handler, timeoutMillis);
    }

    /**
     * Serializes an object according to serialization settings of the client.
     */
    protected toData(object: any, partitioningStrategy?: any): Data {
        return this.serializationService.toData(object, partitioningStrategy);
    }

    /**
     * De-serializes an object from binary form according to serialization settings of the client.
     */
    protected toObject(data: Data): any {
        return this.serializationService.toObject(data);
    }

    protected getConnectedServerVersion(): number {
        const activeConnections = this.connectionRegistry.getConnections();
        if (activeConnections.length === 0) {
            return BuildInfo.UNKNOWN_VERSION_ID;
        } else {
            return activeConnections[0].getConnectedServerVersion();
        }
    }
}
