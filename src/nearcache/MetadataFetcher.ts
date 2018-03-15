/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {RepairingHandler} from './RepairingHandler';
import HazelcastClient from '../HazelcastClient';
import {PartitionService} from '../PartitionService';
import {MapFetchNearCacheInvalidationMetadataCodec} from '../codec/MapFetchNearCacheInvalidationMetadataCodec';
import {Invocation} from '../invocation/InvocationService';
import * as Promise from '../PromiseWrapper';
import ClientMessage = require('../ClientMessage');
import {LoggingService} from '../logging/LoggingService';
import {UUID} from '../core/UUID';
import {MemberSelectors} from '../core/MemberSelectors';

export class MetadataFetcher {

    private client: HazelcastClient;
    private partitionService: PartitionService;
    private logger: LoggingService = LoggingService.getLoggingService();

    constructor(client: HazelcastClient) {
        this.client = client;
        this.partitionService = this.client.getPartitionService();
    }

    initHandler(handler: RepairingHandler): Promise<void> {
        let scanPromise = this.scanMembers([handler.getName()])[0];
        return scanPromise.then((response: ClientMessage) => {
            let metadata = MapFetchNearCacheInvalidationMetadataCodec.decodeResponse(response);
            handler.initUuid(metadata.partitionUuidList);
            handler.initSequence(metadata.namePartitionSequenceList[0]);
        });
    }

    fetchMetadata(handlers: Map<string, RepairingHandler>): Promise<void> {
        let objectNames = this.getObjectNames(handlers);
        let promises = this.scanMembers(objectNames);
        return Promise.each(promises, (clientMessage: ClientMessage) => {
            this.processResponse(clientMessage, handlers);
        }).return();
    }

    private getObjectNames(handlers: Map<string, RepairingHandler>): string[] {
        let names: string[] = [];
        handlers.forEach((handler: RepairingHandler) => {
            names.push(handler.getName());
        });
        return names;
    }

    protected processResponse(responseMessage: ClientMessage, handlers: Map<string, RepairingHandler>): void {
        let metadata = MapFetchNearCacheInvalidationMetadataCodec.decodeResponse(responseMessage);
        handlers.forEach((handler: RepairingHandler) => {
            try {
                this.repairUuids(handler, metadata.partitionUuidList);
                this.repairSequences(handler, metadata.namePartitionSequenceList);
            } catch (e) {
                this.logger.warn('MetadataFetcher', 'Can not get invalidation metadata ' + e.message);
            }
        });
    }

    protected repairUuids(handler: RepairingHandler, partitionIdUuidList: [number, UUID][]): void {
        partitionIdUuidList.forEach((entry: [number, UUID]) => {
            handler.checkOrRepairUuid(entry[0], entry[1]);
        });
    }

    protected repairSequences(handler: RepairingHandler, partitionIdSequenceList: [string, [number, Long][]][]): void {
        partitionIdSequenceList.forEach((partitionIdSeq: [string, [number, Long][]]) => {
            let pairs = partitionIdSeq[1];
            pairs.forEach((pair: [number, Long]) => {
                handler.checkOrRepairSequence(pair[0], pair[1], true);
            });
        });
    }

    protected scanMembers(objectNames: string[]): Promise<ClientMessage>[] {
        let members = this.client.getClusterService().getMembers(MemberSelectors.DATA_MEMBER_SELECTOR);
        let promises: Promise<any>[] = [];
        members.forEach((member) => {
            let request = MapFetchNearCacheInvalidationMetadataCodec.encodeRequest(objectNames, member.address);
            let promise = this.client.getInvocationService().invoke(new Invocation(this.client, request));
            promises.push(promise);
        });
        return promises;
    }

}
