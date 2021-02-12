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
import {ILogger} from '../logging';
import {ClientConfig} from '../config';
import {ProxyManager} from './ProxyManager';
import {PartitionService} from '../PartitionService';
import {InvocationService} from '../invocation/InvocationService';
import {SerializationService} from '../serialization/SerializationService';
import {ClientConnectionManager} from '../network/ClientConnectionManager';
import {ListenerService} from '../listener/ListenerService';
import {ClusterService} from '../invocation/ClusterService';

/** @internal */
export class PartitionSpecificProxy extends BaseProxy {

    private partitionId: number;

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
        super(
            serviceName,
            name,
            logger,
            clientConfig,
            proxyManager,
            partitionService,
            invocationService,
            serializationService,
            connectionManager,
            listenerService,
            clusterService
        );
        this.partitionId = this.partitionService.getPartitionId(this.getPartitionKey());
    }

    protected encodeInvoke(codec: any, ...codecArguments: any[]): Promise<ClientMessage> {
        return this.encodeInvokeOnPartition(codec, this.partitionId, ...codecArguments);
    }
}
