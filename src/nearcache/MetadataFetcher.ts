/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import * as Promise from 'bluebird';
import {MapFetchNearCacheInvalidationMetadataCodec} from '../codec/MapFetchNearCacheInvalidationMetadataCodec';
import {MemberSelectors} from '../core/MemberSelectors';
import {UUID} from '../core/UUID';
import HazelcastClient from '../HazelcastClient';
import {Invocation} from '../invocation/InvocationService';
import {PartitionService} from '../PartitionService';
import {RepairingHandler} from './RepairingHandler';
import {ILogger} from '../logging/ILogger';
import {ClientMessage} from '../ClientMessage';

export class MetadataFetcher {

    private client: HazelcastClient;
    private partitionService: PartitionService;
    private logger: ILogger;

    constructor(client: HazelcastClient) {
        this.logger = client.getLoggingService().getLogger();
        this.client = client;
        this.partitionService = this.client.getPartitionService();
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
        return Promise.each(promises, (clientMessage: ClientMessage) => {
            this.processResponse(clientMessage, handlers);
        }).return();
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
        const members = this.client.getClusterService().getMembers(MemberSelectors.DATA_MEMBER_SELECTOR);
        const promises: Array<Promise<any>> = [];
        members.forEach((member) => {
            const request = MapFetchNearCacheInvalidationMetadataCodec.encodeRequest(objectNames, member.address);
            const promise = this.client.getInvocationService().invoke(new Invocation(this.client, request));
            promises.push(promise);
        });
        return promises;
    }

    private getObjectNames(handlers: Map<string, RepairingHandler>): string[] {
        const names: string[] = [];
        handlers.forEach((handler: RepairingHandler) => {
            names.push(handler.getName());
        });
        return names;
    }
}
