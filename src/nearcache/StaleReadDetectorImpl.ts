import {StaleReadDetector} from './StaleReadDetector';
import {DataRecord} from './DataRecord';
import {MetadataContainer} from './MetadataContainer';
import {RepairingHandler} from './RepairingHandler';
import {PartitionService} from '../PartitionService';

export class StaleReadDetectorImpl implements StaleReadDetector {

    private readonly repairingHandler: RepairingHandler;
    private readonly partitionService: PartitionService;

    constructor(handler: RepairingHandler, partitionService: PartitionService) {
        this.repairingHandler = handler;
        this.partitionService = partitionService;
    }

    isStaleRead(key: any, record: DataRecord): boolean {
        let metadata = this.getMetadataContainer(this.getPartitionId(record.key));
        return !record.hasSameUuid(metadata.getUuid()) || record.getInvalidationSequence().lessThan(metadata.getStaleSequence());
    }

    getMetadataContainer(partitionId: number): MetadataContainer {
        return this.repairingHandler.getMetadataContainer(partitionId);
    }

    getPartitionId(key: any): number {
        return this.partitionService.getPartitionId(key);
    }
}
