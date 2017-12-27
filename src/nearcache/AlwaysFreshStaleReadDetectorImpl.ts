import {StaleReadDetector} from './StaleReadDetector';
import {MetadataContainer} from './MetadataContainer';
import {DataRecord} from './DataRecord';

export class AlwaysFreshStaleReadDetector implements StaleReadDetector {
    isStaleRead(key: any, record: DataRecord): boolean {
        return false;
    }

    getPartitionId(key: any): number {
        return 0;
    }

    getMetadataContainer(partitionId: number): MetadataContainer {
        return null;
    }
}

const INSTANCE = new AlwaysFreshStaleReadDetector();

export {INSTANCE};
