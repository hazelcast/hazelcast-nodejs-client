"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.alwaysFreshDetector = exports.StaleReadDetectorImpl = void 0;
/** @internal */
class StaleReadDetectorImpl {
    constructor(handler, partitionService) {
        this.repairingHandler = handler;
        this.partitionService = partitionService;
    }
    isStaleRead(key, record) {
        const metadata = this.getMetadataContainer(this.getPartitionId(record.key));
        return !record.hasSameUuid(metadata.getUuid()) || record.getInvalidationSequence().lessThan(metadata.getStaleSequence());
    }
    getMetadataContainer(partitionId) {
        return this.repairingHandler.getMetadataContainer(partitionId);
    }
    getPartitionId(key) {
        return this.partitionService.getPartitionId(key);
    }
}
exports.StaleReadDetectorImpl = StaleReadDetectorImpl;
class AlwaysFreshStaleReadDetectorImpl {
    isStaleRead(_key, _record) {
        return false;
    }
    getPartitionId(_key) {
        return 0;
    }
    getMetadataContainer(_partitionId) {
        return null;
    }
}
/** @internal */
exports.alwaysFreshDetector = new AlwaysFreshStaleReadDetectorImpl();
//# sourceMappingURL=StaleReadDetector.js.map