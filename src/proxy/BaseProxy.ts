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
import {ClientConfig} from "../config";
import {ILogger} from "../logging";
import {ProxyManager} from "./ProxyManager";
import {PartitionService} from "../PartitionService";
import {InvocationService} from "../invocation/InvocationService";
import {SerializationService} from "../serialization/SerializationService";
import {ClientConnectionManager} from "../network/ClientConnectionManager";
import {ListenerService} from "../listener/ListenerService";
import {ClusterService} from "../invocation/ClusterService";


/**
 * Common super class for any proxy.
 * @internal
 */
export abstract class BaseProxy {

    protected readonly name: string;
    protected readonly serviceName: string;
    protected readonly proxyManager: ProxyManager;
    protected readonly partitionService: PartitionService;
    protected readonly invocationService: InvocationService;
    protected readonly serializationService: SerializationService;
    protected readonly connectionManager: ClientConnectionManager;
    protected readonly listenerService: ListenerService;
    protected readonly clusterService: ClusterService;
    protected readonly clientConfig: ClientConfig;
    protected readonly logger: ILogger;

    constructor(
        serviceName: string,
        name: string,
        logger: ILogger,
        clientConfig: ClientConfig,
        proxyManager: ProxyManager,
        partitionService: PartitionService,
        invocationService: InvocationService,
        serializationService: SerializationService,
        connectionManager: ClientConnectionManager,
        listenerService: ListenerService,
        clusterService: ClusterService
    ) {
        this.name = name;
        this.serviceName = serviceName;
        this.proxyManager = proxyManager;
        this.partitionService = partitionService;
        this.invocationService = invocationService;
        this.serializationService = serializationService;
        this.connectionManager = connectionManager;
        this.listenerService = listenerService;
        this.clusterService = clusterService
        this.clientConfig = clientConfig;
        this.logger = logger;
    }

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

    protected postDestroy(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Encodes a request from a codec and invokes it on owner node of given key.
     */
    protected encodeInvokeOnKey(codec: any, partitionKey: any, ...codecArguments: any[]): Promise<ClientMessage> {
        const partitionId: number = this.partitionService.getPartitionId(partitionKey);
        return this.encodeInvokeOnPartition(codec, partitionId, ...codecArguments);
    }

    /**
     * Encodes a request from a codec and invokes it on owner node of given key.
     * This method also overrides invocation timeout.
     */
    protected encodeInvokeOnKeyWithTimeout(timeoutMillis: number,
                                           codec: any,
                                           partitionKey: any,
                                           ...codecArguments: any[]): Promise<ClientMessage> {
        const partitionId: number = this.partitionService.getPartitionId(partitionKey);
        return this.encodeInvokeOnPartitionWithTimeout(timeoutMillis, codec, partitionId, ...codecArguments);
    }

    /**
     * Encodes a request from a codec and invokes it on any node.
     */
    protected encodeInvokeOnRandomTarget(codec: any, ...codecArguments: any[]): Promise<ClientMessage> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnRandomTarget(clientMessage, this.connectionManager);
    }

    protected encodeInvokeOnTarget(codec: any, target: UUID, ...codecArguments: any[]): Promise<ClientMessage> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnTarget(clientMessage, target, this.connectionManager);
    }

    /**
     * Encodes a request from a codec and invokes it on owner node of given partition.
     */
    protected encodeInvokeOnPartition(codec: any, partitionId: number, ...codecArguments: any[]): Promise<ClientMessage> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnPartition(clientMessage, partitionId, this.connectionManager);
    }

    /**
     * Encodes a request from a codec and invokes it on owner node of given partition.
     * This method also overrides invocation timeout.
     */
    protected encodeInvokeOnPartitionWithTimeout(timeoutMillis: number,
                                                 codec: any,
                                                 partitionId: number,
                                                 ...codecArguments: any[]): Promise<ClientMessage> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.invocationService.invokeOnPartition(
            clientMessage,
            partitionId,
            this.connectionManager,
            timeoutMillis
        );
    }

    /**
     * Serializes an object according to serialization settings of the client.
     */
    protected toData(object: any): Data {
        return this.serializationService.toData(object);
    }

    /**
     * De-serializes an object from binary form according to serialization settings of the client.
     */
    protected toObject(data: Data): any {
        return this.serializationService.toObject(data);
    }

    protected getConnectedServerVersion(): number {
        const activeConnections = this.connectionManager.getActiveConnections();
        for (const address in activeConnections) {
            return activeConnections[address].getConnectedServerVersion();
        }
        return BuildInfo.UNKNOWN_VERSION_ID;
    }
}
