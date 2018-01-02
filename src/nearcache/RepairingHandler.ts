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

import {NearCache} from './NearCache';
import {MetadataContainer} from './MetadataContainer';
import {PartitionService} from '../PartitionService';
import {Data} from '../serialization/Data';
import * as Long from 'long';
import {UUID} from '../core/UUID';

export class RepairingHandler {

    private readonly nearCache: NearCache;
    private readonly partitionCount: number;
    private readonly partitionService: PartitionService;
    private readonly localUuid: string;
    private readonly name: string;
    private containers: MetadataContainer[];

    constructor(name: string, partitionService: PartitionService, nearCache: NearCache, localUuid: string) {
        this.nearCache = nearCache;
        this.name = name;
        this.partitionService = partitionService;
        this.partitionCount = this.partitionService.getPartitionCount();
        this.localUuid = localUuid;
        this.containers = [];
        for (let i = 0; i < this.partitionCount; i++) {
            this.containers[i] = new MetadataContainer();
        }
    }

    initUuid(partitionIdUuidPairsList: [number, UUID][]): void {
        for (let i = 0; i < partitionIdUuidPairsList.length; i++) {
            let item = partitionIdUuidPairsList[i];
            let partitionId = item[0];
            let partitionUuid = item[1];
            this.getMetadataContainer(partitionId).setUuid(partitionUuid);
        }

    }

    initSequence(partitionIdSequencePairsList: [string, [number, Long][]]): void {
        let list = partitionIdSequencePairsList[1];
        for (let i = 0; i < list.length; i++) {
            let item = list[i];
            let partitionId = item[0];
            let partitionSequence = item[1];
            this.getMetadataContainer(partitionId).setSequence(partitionSequence);
        }
    }

    handle(key: Data, sourceUuid: string, partitionUuid: UUID, sequence: Long): void {
        if (this.localUuid !== sourceUuid) {
            if (key == null) {
                this.nearCache.clear();
            } else {
                this.nearCache.invalidate(key);
            }
        }
        let partitionId = this.getPartitionIdOrDefault(key);
        this.checkOrRepairSequence(partitionId, sequence);
        this.checkOrRepairUuid(partitionId, partitionUuid);
    }

    handleBatch(keys: any[], sourceUuids: string[], partitionUuids: UUID[], sequences: Long[]): void {
        for (var i = 0; i < keys.length; i++) {
            this.handle(keys[i], sourceUuids[i], partitionUuids[i], sequences[i]);
        }
    }

    checkOrRepairSequence(partitionId: number, nextSequence: Long, viaAntiEntropy: boolean = false): void {
        let metadata = this.getMetadataContainer(partitionId);
        let current = metadata.getSequence();
        if (current.greaterThanOrEqual(nextSequence)) {
            return;
        }
        metadata.setSequence(nextSequence);
        let missed = nextSequence.subtract(current);
        if (!viaAntiEntropy) {
            missed = missed.subtract(1);
        }
        if (missed.greaterThan(0)) {
            metadata.increaseMissedSequenceCount(missed);
        }
    }

    checkOrRepairUuid(partitionId: number, newuuid: UUID): void {
        let metadata = this.getMetadataContainer(partitionId);
        let currentUuid = metadata.getUuid();
        if (currentUuid != null && currentUuid.equals(newuuid)) {
            return;
        }
        metadata.setUuid(newuuid);
        metadata.reset();
    }

    updateLastKnownStaleSequence(metadataContainer: MetadataContainer): void {
        let lastStaleSequence = metadataContainer.getStaleSequence();
        let lastSequence = metadataContainer.getSequence();
        if (lastStaleSequence.lessThan(lastSequence)) {
            metadataContainer.setStaleSequence(lastSequence);
        }
    }

    getMetadataContainer(partitionId: number): MetadataContainer {
        return this.containers[partitionId];
    }

    getName(): string {
        return this.name;
    }

    private getPartitionIdOrDefault(key: Data) {
        if (key != null) {
            return this.partitionService.getPartitionId(key);
        } else {
            return this.partitionService.getPartitionId(this.name);
        }
    }
}
