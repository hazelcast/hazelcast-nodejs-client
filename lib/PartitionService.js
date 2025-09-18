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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartitionServiceImpl = void 0;
const core_1 = require("./core");
class PartitionTable {
    constructor() {
        this.partitionStateVersion = -1;
        this.partitions = new Map();
    }
}
/** @internal */
class PartitionServiceImpl {
    constructor(logger, serializationService) {
        this.logger = logger;
        this.serializationService = serializationService;
        this.partitionTable = new PartitionTable();
        this.partitionCount = 0;
    }
    reset() {
        this.partitionTable = new PartitionTable();
    }
    /**
     * The partitions can be empty on the response, client will not apply the empty partition table.
     */
    handlePartitionViewEvent(connection, partitions, partitionStateVersion) {
        this.logger.debug('PartitionService', 'Handling new partition table with partitionStateVersion: ' + partitionStateVersion);
        if (!this.shouldBeApplied(connection, partitions, partitionStateVersion, this.partitionTable)) {
            return;
        }
        const newPartitions = PartitionServiceImpl.convertToMap(partitions);
        this.partitionTable.connection = connection;
        this.partitionTable.partitionStateVersion = partitionStateVersion;
        this.partitionTable.partitions = newPartitions;
    }
    getPartitionOwner(partitionId) {
        return this.getPartitions().get(partitionId);
    }
    getPartitionId(key) {
        if (this.partitionCount === 0) {
            // Partition count can not be zero for the sync mode.
            // On the sync mode, we are waiting for the first connection to be established.
            // We are initializing the partition count with the value coming from the server with authentication.
            // This exception is used only for async mode client.
            throw new core_1.ClientOfflineError();
        }
        let partitionHash;
        if (typeof key === 'object' && 'getPartitionHash' in key) {
            partitionHash = key.getPartitionHash();
        }
        else {
            try {
                partitionHash = this.serializationService.toData(key).getPartitionHash();
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    throw new core_1.HazelcastSerializationError('Cannot compute partition id of compact objects whose schema is not replicated in the cluster. ' +
                        'To replicate its schema to the cluster, you can use this object in any async operation where ' +
                        'it is serialized.', e);
                }
            }
        }
        return Math.abs(partitionHash) % this.partitionCount;
    }
    getPartitionCount() {
        return this.partitionCount;
    }
    /**
     * @param newPartitionCount
     * @return true if partition count can be set for the first time, or it is equal to
     * one that is already available, returns false otherwise
     */
    checkAndSetPartitionCount(newPartitionCount) {
        if (this.partitionCount === 0) {
            this.partitionCount = newPartitionCount;
            return true;
        }
        return this.partitionCount === newPartitionCount;
    }
    static convertToMap(partitions) {
        const newPartitions = new Map();
        for (const entry of partitions) {
            const uuid = entry[0];
            const ownedPartitions = entry[1];
            for (const ownedPartition of ownedPartitions) {
                newPartitions.set(ownedPartition, uuid);
            }
        }
        return newPartitions;
    }
    logFailure(connection, partitionStateVersion, current, cause) {
        this.logger.debug('PartitionService', 'Response will not be applied since ' + cause
            + '. Response is from ' + connection
            + '. Current connection ' + current.connection
            + '. Response state version ' + partitionStateVersion
            + '. Current state version ' + current.partitionStateVersion);
    }
    getPartitions() {
        return this.partitionTable.partitions;
    }
    shouldBeApplied(connection, partitions, partitionStateVersion, current) {
        if (partitions.length === 0) {
            this.logFailure(connection, partitionStateVersion, current, 'response is empty');
            return false;
        }
        if (!connection.equals(current.connection)) {
            this.logger.trace('PartitionService', 'Event coming from a new connection. Old connection: ' + current.connection
                + ', new connection ' + connection);
            return true;
        }
        if (partitionStateVersion <= current.partitionStateVersion) {
            this.logFailure(connection, partitionStateVersion, current, 'response state version is old');
            return false;
        }
        return true;
    }
}
exports.PartitionServiceImpl = PartitionServiceImpl;
//# sourceMappingURL=PartitionService.js.map