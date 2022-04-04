/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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

import {DataRecord} from './DataRecord';
import {MetadataContainer} from './MetadataContainer';
import {RepairingHandler} from './RepairingHandler';
import {PartitionServiceImpl} from '../PartitionService';

/** @internal */
export interface StaleReadDetector {
    isStaleRead(key: any, record: DataRecord): boolean;

    getPartitionId(key: any): number;

    getMetadataContainer(partitionId: number): MetadataContainer;
}

/** @internal */
export class StaleReadDetectorImpl implements StaleReadDetector {

    private readonly repairingHandler: RepairingHandler;
    private readonly partitionService: PartitionServiceImpl;

    constructor(handler: RepairingHandler, partitionService: PartitionServiceImpl) {
        this.repairingHandler = handler;
        this.partitionService = partitionService;
    }

    isStaleRead(key: any, record: DataRecord): boolean {
        const metadata = this.getMetadataContainer(this.getPartitionId(record.key));
        return !record.hasSameUuid(metadata.getUuid()) || record.getInvalidationSequence().lessThan(metadata.getStaleSequence());
    }

    getMetadataContainer(partitionId: number): MetadataContainer {
        return this.repairingHandler.getMetadataContainer(partitionId);
    }

    getPartitionId(key: any): number {
        return this.partitionService.getPartitionId(key);
    }
}

class AlwaysFreshStaleReadDetectorImpl implements StaleReadDetector {
    isStaleRead(_key: any, _record: DataRecord): boolean {
        return false;
    }

    getPartitionId(_key: any): number {
        return 0;
    }

    getMetadataContainer(_partitionId: number): MetadataContainer {
        return null;
    }
}

/** @internal */
export const alwaysFreshDetector = new AlwaysFreshStaleReadDetectorImpl();
