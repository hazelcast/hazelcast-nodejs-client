/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {PartitionService} from '../PartitionService';
import {DataRecord} from './DataRecord';
import {MetadataContainer} from './MetadataContainer';
import {RepairingHandler} from './RepairingHandler';
import {StaleReadDetector} from './StaleReadDetector';

export class StaleReadDetectorImpl implements StaleReadDetector {

    private readonly repairingHandler: RepairingHandler;
    private readonly partitionService: PartitionService;

    constructor(handler: RepairingHandler, partitionService: PartitionService) {
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
