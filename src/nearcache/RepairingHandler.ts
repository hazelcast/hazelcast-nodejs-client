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

    initUuid(partitionIdUuidPairsList: [number, string][]): void {
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

    handle(key: Data, sourceUuid: string, partitionUuid: string, sequence: Long): void {
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

    handleBatch(keys: any[], sourceUuids: string[], partitionUuids: string[], sequences: Long[]): void {
        throw new Error('Not implemented');
    }

    checkOrRepairSequence(partitionId: number, nextSequence: Long): void {
        let metadata = this.getMetadataContainer(partitionId);
        let current = metadata.getSequence();
        if (current.greaterThanOrEqual(nextSequence)) {
            return;
        }
        let missed = nextSequence.subtract(current).subtract(1);
        if (missed.greaterThan(0)) {
            metadata.increaseMissedSequenceCount(missed);
        }
        metadata.setSequence(current);
    }

    checkOrRepairUuid(partitionId: number, newuuid: string): void {
        let metadata = this.getMetadataContainer(partitionId);
        let currentUuid = metadata.getUuid();
        if (currentUuid === newuuid) {
            return;
        }
        metadata.setUuid(newuuid);
        metadata.reset();
    }

    updateLastKnownStaleSequence(metadataContainer: MetadataContainer, partitionId: number): void {
        let lastStaleSequence = metadataContainer.getStaleSequence();
        let lastSequence = metadataContainer.getStaleSequence();
        if (lastStaleSequence < lastSequence) {
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
