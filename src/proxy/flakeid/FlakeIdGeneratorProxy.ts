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

import * as Long from 'long';
import {FlakeIdGeneratorNewIdBatchCodec} from '../../codec/FlakeIdGeneratorNewIdBatchCodec';
import {FlakeIdGeneratorConfigImpl} from '../../config/FlakeIdGeneratorConfig';
import {BaseProxy} from '../BaseProxy';
import {AutoBatcher, Batch} from './AutoBatcher';
import {FlakeIdGenerator} from '../FlakeIdGenerator';
import {ClientConfig, ClientConfigImpl} from '../../config/Config';
import {ProxyManager} from '../ProxyManager';
import {PartitionService} from '../../PartitionService';
import {InvocationService} from '../../invocation/InvocationService';
import {SerializationService} from '../../serialization/SerializationService';
import {ConnectionRegistry} from '../../network/ConnectionRegistry';
import {ListenerService} from '../../listener/ListenerService';
import {ClusterService} from '../../invocation/ClusterService';

/** @internal */
export class FlakeIdGeneratorProxy extends BaseProxy implements FlakeIdGenerator {

    private autoBatcher: AutoBatcher;
    private config: FlakeIdGeneratorConfigImpl;

    constructor(
        serviceName: string,
        name: string,
        clientConfig: ClientConfig,
        proxyManager: ProxyManager,
        partitionService: PartitionService,
        invocationService: InvocationService,
        serializationService: SerializationService,
        listenerService: ListenerService,
        clusterService: ClusterService,
        connectionRegistry: ConnectionRegistry
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
            connectionRegistry
        );
        this.config = (clientConfig as ClientConfigImpl).getFlakeIdGeneratorConfig(name);
        this.autoBatcher = new AutoBatcher(() => {
            return this.encodeInvokeOnRandomTarget(FlakeIdGeneratorNewIdBatchCodec, (clientMessage) => {
                const response = FlakeIdGeneratorNewIdBatchCodec.decodeResponse(clientMessage);
                return new Batch(this.config.prefetchValidityMillis, response.base, response.increment, response.batchSize);
            }, this.config.prefetchCount);
        });
    }

    newId(): Promise<Long> {
        return this.autoBatcher.nextId();
    }
}
