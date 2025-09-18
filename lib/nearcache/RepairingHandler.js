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
exports.RepairingHandler = void 0;
const MetadataContainer_1 = require("./MetadataContainer");
/** @internal */
class RepairingHandler {
    constructor(name, partitionService, nearCache, localUuid) {
        this.nearCache = nearCache;
        this.name = name;
        this.partitionService = partitionService;
        this.localUuid = localUuid;
        this.containers = [];
        for (let i = 0; i < this.partitionService.getPartitionCount(); i++) {
            this.containers[i] = new MetadataContainer_1.MetadataContainer();
        }
    }
    initUuid(partitionIdUuidPairsList) {
        for (const item of partitionIdUuidPairsList) {
            const partitionId = item[0];
            const partitionUuid = item[1];
            this.getMetadataContainer(partitionId).setUuid(partitionUuid);
        }
    }
    initSequence(partitionIdSequencePairsList) {
        const list = partitionIdSequencePairsList[1];
        for (const item of list) {
            const partitionId = item[0];
            const partitionSequence = item[1];
            this.getMetadataContainer(partitionId).setSequence(partitionSequence);
        }
    }
    handle(key, sourceUuid, partitionUuid, sequence) {
        // apply invalidation if it's not originated by local member/client (because local
        // Near Caches are invalidated immediately there is no need to invalidate them twice)
        if (!this.localUuid.equals(sourceUuid)) {
            if (key == null) {
                this.nearCache.clear();
            }
            else {
                this.nearCache.invalidate(key);
            }
        }
        const partitionId = this.getPartitionIdOrDefault(key);
        this.checkOrRepairSequence(partitionId, sequence);
        this.checkOrRepairUuid(partitionId, partitionUuid);
    }
    handleBatch(keys, sourceUuids, partitionUuids, sequences) {
        for (let i = 0; i < keys.length; i++) {
            this.handle(keys[i], sourceUuids[i], partitionUuids[i], sequences[i]);
        }
    }
    checkOrRepairSequence(partitionId, nextSequence, viaAntiEntropy = false) {
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
    checkOrRepairUuid(partitionId, newuuid) {
        const metadata = this.getMetadataContainer(partitionId);
        const currentUuid = metadata.getUuid();
        if (currentUuid != null && currentUuid.equals(newuuid)) {
            return;
        }
        metadata.setUuid(newuuid);
        metadata.reset();
    }
    updateLastKnownStaleSequence(metadataContainer) {
        const lastStaleSequence = metadataContainer.getStaleSequence();
        const lastSequence = metadataContainer.getSequence();
        if (lastStaleSequence.lessThan(lastSequence)) {
            metadataContainer.setStaleSequence(lastSequence);
        }
    }
    getMetadataContainer(partitionId) {
        return this.containers[partitionId];
    }
    getName() {
        return this.name;
    }
    getPartitionIdOrDefault(key) {
        if (key != null) {
            return this.partitionService.getPartitionId(key);
        }
        else {
            return this.partitionService.getPartitionId(this.name);
        }
    }
}
exports.RepairingHandler = RepairingHandler;
//# sourceMappingURL=RepairingHandler.js.map