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

import * as Promise from 'bluebird';
import {BuildInfo} from '../BuildInfo';
import {HazelcastClient} from '../HazelcastClient';
import {Data} from '../serialization/Data';
import {ClientMessage} from '../protocol/ClientMessage';
import {UUID} from '../core/UUID';

/**
 * Common super class for any proxy.
 * @internal
 */
export abstract class BaseProxy {

    protected client: HazelcastClient;
    protected readonly name: string;
    protected readonly serviceName: string;

    constructor(client: HazelcastClient, serviceName: string, name: string) {
        this.client = client;
        this.name = name;
        this.serviceName = serviceName;
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
        return this.client.getProxyManager().destroyProxy(this.name, this.serviceName).then(() => {
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
     * @param codec
     * @param partitionKey
     * @param codecArguments
     * @returns
     */
    protected encodeInvokeOnKey(codec: any, partitionKey: any, ...codecArguments: any[]): Promise<ClientMessage> {
        const partitionId: number = this.client.getPartitionService().getPartitionId(partitionKey);
        return this.encodeInvokeOnPartition(codec, partitionId, ...codecArguments);
    }

    /**
     * Encodes a request from a codec and invokes it on any node.
     * @param codec
     * @param codecArguments
     * @returns
     */
    protected encodeInvokeOnRandomTarget(codec: any, ...codecArguments: any[]): Promise<ClientMessage> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.client.getInvocationService().invokeOnRandomTarget(clientMessage);
    }

    protected encodeInvokeOnTarget(codec: any, target: UUID, ...codecArguments: any[]): Promise<ClientMessage> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return  this.client.getInvocationService().invokeOnTarget(clientMessage, target);
    }

    /**
     * Encodes a request from a codec and invokes it on owner node of given partition.
     * @param codec
     * @param partitionId
     * @param codecArguments
     * @returns
     */
    protected encodeInvokeOnPartition(codec: any, partitionId: number, ...codecArguments: any[]): Promise<ClientMessage> {
        const clientMessage = codec.encodeRequest(this.name, ...codecArguments);
        return this.client.getInvocationService().invokeOnPartition(clientMessage, partitionId);
    }

    /**
     * Serializes an object according to serialization settings of the client.
     * @param object
     * @returns
     */
    protected toData(object: any): Data {
        return this.client.getSerializationService().toData(object);
    }

    /**
     * De-serializes an object from binary form according to serialization settings of the client.
     * @param data
     * @returns {any}
     */
    protected toObject(data: Data): any {
        return this.client.getSerializationService().toObject(data);
    }

    protected getConnectedServerVersion(): number {
        const activeConnections = this.client.getConnectionManager().getActiveConnections();
        for (const address in activeConnections) {
            return activeConnections[address].getConnectedServerVersion();
        }
        return BuildInfo.UNKNOWN_VERSION_ID;
    }
}
