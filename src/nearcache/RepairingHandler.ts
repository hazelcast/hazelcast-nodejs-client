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

import * as Long from 'long';
import {UUID} from '../core/UUID';
import {PartitionService} from '../PartitionService';
import {Data} from '../serialization/Data';
import {MetadataContainer} from './MetadataContainer';
import {NearCache} from './NearCache';

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

    initUuid(partitionIdUuidPairsList: Array<[number, UUID]>): void {
        for (const item of partitionIdUuidPairsList) {
            const partitionId = item[0];
            const partitionUuid = item[1];
            this.getMetadataContainer(partitionId).setUuid(partitionUuid);
        }

    }

    initSequence(partitionIdSequencePairsList: [string, Array<[number, Long]>]): void {
        const list = partitionIdSequencePairsList[1];
        for (const item of list) {
            const partitionId = item[0];
            const partitionSequence = item[1];
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
        const partitionId = this.getPartitionIdOrDefault(key);
        this.checkOrRepairSequence(partitionId, sequence);
        this.checkOrRepairUuid(partitionId, partitionUuid);
    }

    handleBatch(keys: any[], sourceUuids: string[], partitionUuids: UUID[], sequences: Long[]): void {
        for (let i = 0; i < keys.length; i++) {
            this.handle(keys[i], sourceUuids[i], partitionUuids[i], sequences[i]);
        }
    }

    checkOrRepairSequence(partitionId: number, nextSequence: Long, viaAntiEntropy: boolean = false): void {
        const metadata = this.getMetadataContainer(partitionId);
        const current = metadata.getSequence();
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
        const metadata = this.getMetadataContainer(partitionId);
        const currentUuid = metadata.getUuid();
        if (currentUuid != null && currentUuid.equals(newuuid)) {
            return;
        }

        metadata.setUuid(newuuid);
        metadata.reset();
    }

    updateLastKnownStaleSequence(metadataContainer: MetadataContainer): void {
        const lastStaleSequence = metadataContainer.getStaleSequence();
        const lastSequence = metadataContainer.getSequence();
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

    private getPartitionIdOrDefault(key: Data): number {
        if (key != null) {
            return this.partitionService.getPartitionId(key);
        } else {
            return this.partitionService.getPartitionId(this.name);
        }
    }
}
