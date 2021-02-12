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

import {MapFetchNearCacheInvalidationMetadataCodec} from '../codec/MapFetchNearCacheInvalidationMetadataCodec';
import {dataMemberSelector} from '../core/MemberSelector';
import {UUID} from '../core/UUID';
import {Invocation, InvocationService} from '../invocation/InvocationService';
import {RepairingHandler} from './RepairingHandler';
import {ILogger} from '../logging/ILogger';
import {ClientMessage} from '../protocol/ClientMessage';
import {ClusterService} from '../invocation/ClusterService';
import {ClientConnectionManager} from '../network/ClientConnectionManager';

/** @internal */
export class MetadataFetcher {

    private readonly logger: ILogger;
    private readonly invocationService: InvocationService;
    private readonly clusterService: ClusterService;
    private readonly connectionManager: ClientConnectionManager;

    constructor(
        logger: ILogger,
        invocationService: InvocationService,
        clusterService: ClusterService,
        connectionManager: ClientConnectionManager
    ) {
        this.invocationService = invocationService;
        this.logger = logger;
        this.clusterService = clusterService;
        this.connectionManager = connectionManager;
    }

    initHandler(handler: RepairingHandler): Promise<void> {
        const scanPromises = this.scanMembers([handler.getName()]);
        return Promise.all(scanPromises).then((responses: ClientMessage[]) => {
            responses.forEach((response) => {
                const metadata = MapFetchNearCacheInvalidationMetadataCodec.decodeResponse(response);
                handler.initUuid(metadata.partitionUuidList);
                handler.initSequence(metadata.namePartitionSequenceList[0]);
            });
        });
    }

    fetchMetadata(handlers: Map<string, RepairingHandler>): Promise<void> {
        const objectNames = this.getObjectNames(handlers);
        const promises = this.scanMembers(objectNames);
        return Promise.all(promises).then((clientMessages: ClientMessage[]) => {
            clientMessages.forEach((response) => {
                this.processResponse(response, handlers);
            });
        });
    }

    protected processResponse(responseMessage: ClientMessage, handlers: Map<string, RepairingHandler>): void {
        const metadata = MapFetchNearCacheInvalidationMetadataCodec.decodeResponse(responseMessage);
        handlers.forEach((handler: RepairingHandler) => {
            try {
                this.repairUuids(handler, metadata.partitionUuidList);
                this.repairSequences(handler, metadata.namePartitionSequenceList);
            } catch (e) {
                this.logger.warn('MetadataFetcher', 'Can not get invalidation metadata ' + e.message);
            }
        });
    }

    protected repairUuids(handler: RepairingHandler, partitionIdUuidList: Array<[number, UUID]>): void {
        partitionIdUuidList.forEach((entry: [number, UUID]) => {
            handler.checkOrRepairUuid(entry[0], entry[1]);
        });
    }

    protected repairSequences(handler: RepairingHandler, partitionIdSequenceList: Array<[string, Array<[number, Long]>]>): void {
        partitionIdSequenceList.forEach((partitionIdSeq: [string, Array<[number, Long]>]) => {
            const pairs = partitionIdSeq[1];
            pairs.forEach((pair: [number, Long]) => {
                handler.checkOrRepairSequence(pair[0], pair[1], true);
            });
        });
    }

    protected scanMembers(objectNames: string[]): Array<Promise<ClientMessage>> {
        const members = this.clusterService.getMembers(dataMemberSelector);
        const promises: Array<Promise<any>> = [];
        members.forEach((member) => {
            const request = MapFetchNearCacheInvalidationMetadataCodec.encodeRequest(objectNames, member.uuid);
            const promise = this.invocationService.invoke(
                new Invocation(this.invocationService, request),
                this.connectionManager
            );
            promises.push(promise);
        });
        return promises;
    }

    private getObjectNames(handlers: Map<string, RepairingHandler>): string[] {
        const names: string[] = [];
        handlers.forEach((handler) => {
            names.push(handler.getName());
        });
        return names;
    }
}
