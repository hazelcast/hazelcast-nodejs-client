import {DataRecord} from './DataRecord';
import {MetadataContainer} from './MetadataContainer';

export interface StaleReadDetector {
    isStaleRead(key: any, record: DataRecord): boolean;

    getPartitionId(key: any): number;

    getMetadataContainer(partitionId: number): MetadataContainer;
}
