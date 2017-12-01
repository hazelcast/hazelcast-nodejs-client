import {NearCache} from './NearCache';
import {MetadataContainer} from './MetadataContainer';
import {PartitionService} from '../PartitionService';
import {Data} from '../serialization/Data';

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

    handle(key: Data, sourceUuid: string, partitionUuid: string, sequence: number): void {
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

    handleBatch(keys: any[], sourceUuids: string[], partitionUuids: string[], sequences: number[]): void {
        throw new Error('Not implemented');
    }

    checkOrRepairSequence(partitionId: number, nextSequence: number): void {
        let metadata = this.getMetadataContainer(partitionId);
        let current = metadata.getSequence();
        if (current >= nextSequence) {
            return;
        }
        let missed = nextSequence - current - 1;
        if (missed > 0) {
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

    private getPartitionIdOrDefault(key: Data) {
        if (key != null) {
            return this.partitionService.getPartitionId(key);
        } else {
            return this.partitionService.getPartitionId(this.name);
        }
    }
}
