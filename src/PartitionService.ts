/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import {ILogger} from './logging/ILogger';
import {Connection} from './network/Connection';
import {ClientOfflineError, UUID} from './core';
import {SerializationService} from './serialization/SerializationService';

/**
 * Partition service for Hazelcast clients. Allows to retrieve information
 * about the partition count, the partition owner or the partitionId of a key.
 */
export interface PartitionService {

    /**
     * Returns UUID of owner member for a given partition id.
     *
     * @param partitionId partition id
     * @return UUID of the owner of the partition
     *         or `undefined` if a partition is not assigned yet
     */
    getPartitionOwner(partitionId: number): UUID;

    /**
     * Returns partition count of the connected cluster.
     * If partition table is not fetched yet, this method returns `0`.
     *
     * @return the partition count
     */
    getPartitionCount(): number;

    /**
     * Computes the partition id for a given key.
     *
     * @param key
     * @returns the partition id.
     * @throws ClientOfflineError if the partition table has not arrived yet.
     */
    getPartitionId(key: any): number;

}

class PartitionTable {
    connection: Connection;
    partitionStateVersion = -1;
    partitions = new Map<number, UUID>();
}

/** @internal */
export class PartitionServiceImpl implements PartitionService {

    private partitionTable = new PartitionTable();
    private partitionCount = 0;

    constructor(
        private readonly logger: ILogger,
        private readonly serializationService: SerializationService
    ) {}

    reset(): void {
        this.partitionTable = new PartitionTable();
    }

    /**
     * The partitions can be empty on the response, client will not apply the empty partition table.
     */
    handlePartitionViewEvent(connection: Connection,
                             partitions: Array<[UUID, number[]]>,
                             partitionStateVersion: number): void {
        this.logger.debug('PartitionService',
            'Handling new partition table with partitionStateVersion: ' + partitionStateVersion);
        if (!this.shouldBeApplied(connection, partitions, partitionStateVersion, this.partitionTable)) {
            return;
        }
        const newPartitions = PartitionServiceImpl.convertToMap(partitions);
        this.partitionTable.connection = connection;
        this.partitionTable.partitionStateVersion = partitionStateVersion;
        this.partitionTable.partitions = newPartitions;
    }

    getPartitionOwner(partitionId: number): UUID {
        return this.getPartitions().get(partitionId);
    }

    getPartitionId(key: any): number {
        if (this.partitionCount === 0) {
            // Partition count can not be zero for the sync mode.
            // On the sync mode, we are waiting for the first connection to be established.
            // We are initializing the partition count with the value coming from the server with authentication.
            // This exception is used only for async mode client.
            throw new ClientOfflineError();
        }
        let partitionHash: number;
        if (typeof key === 'object' && 'getPartitionHash' in key) {
            partitionHash = key.getPartitionHash();
        } else {
            partitionHash = this.serializationService.toData(key).getPartitionHash();
        }
        return Math.abs(partitionHash) % this.partitionCount;
    }

    getPartitionCount(): number {
        return this.partitionCount;
    }

    /**
     * @param newPartitionCount
     * @return true if partition count can be set for the first time, or it is equal to
     * one that is already available, returns false otherwise
     */
    checkAndSetPartitionCount(newPartitionCount: number): boolean {
        if (this.partitionCount === 0) {
            this.partitionCount = newPartitionCount;
            return true;
        }
        return this.partitionCount === newPartitionCount;
    }

    private static convertToMap(partitions: Array<[UUID, number[]]>): Map<number, UUID> {
        const newPartitions = new Map<number, UUID>();
        for (const entry of partitions) {
            const uuid = entry[0];
            const ownedPartitions = entry[1];
            for (const ownedPartition of ownedPartitions) {
                newPartitions.set(ownedPartition, uuid);
            }
        }
        return newPartitions;
    }

    private logFailure(connection: Connection, partitionStateVersion: number,
                       current: PartitionTable, cause: string): void {
        this.logger.debug('PartitionService', 'Response will not be applied since ' + cause
            + '. Response is from ' + connection
            + '. Current connection ' + current.connection
            + '. Response state version ' + partitionStateVersion
            + '. Current state version ' + current.partitionStateVersion);
    }

    private getPartitions(): Map<number, UUID> {
        return this.partitionTable.partitions;
    }

    private shouldBeApplied(connection: Connection,
                            partitions: Array<[UUID, number[]]>,
                            partitionStateVersion: number,
                            current: PartitionTable): boolean {
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
