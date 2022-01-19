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

import {BaseProxy} from './BaseProxy';
import {ClientMessage} from '../protocol/ClientMessage';
import {ProxyManager} from './ProxyManager';
import {PartitionService} from '../PartitionService';
import {InvocationService} from '../invocation/InvocationService';
import {SerializationService} from '../serialization/SerializationService';
import {ConnectionRegistry} from '../network/ConnectionRegistry';
import {ListenerService} from '../listener/ListenerService';
import {ClusterService} from '../invocation/ClusterService';
import {SchemaService} from '../serialization/compact/SchemaService';

/** @internal */
export class PartitionSpecificProxy extends BaseProxy {

    private readonly partitionId: number;

    constructor(
        serviceName: string,
        name: string,
        proxyManager: ProxyManager,
        partitionService: PartitionService,
        invocationService: InvocationService,
        serializationService: SerializationService,
        listenerService: ListenerService,
        clusterService: ClusterService,
        connectionRegistry: ConnectionRegistry,
        schemaService: SchemaService
    ) {
        super(
            serviceName,
            name,
            proxyManager,
            partitionService,
            invocationService,
            serializationService,
            listenerService,
            clusterService,
            connectionRegistry,
            schemaService
        );
        this.partitionId = this.partitionService.getPartitionId(this.getPartitionKey());
    }

    protected encodeInvoke(codec: any, ...codecArguments: any[]): Promise<ClientMessage> {
        return this.encodeInvokeOnPartition(codec, this.partitionId, x => x, ...codecArguments);
    }
}
