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

import * as Promise from 'bluebird';
import HazelcastClient from './HazelcastClient';
import {ILogger} from './logging/ILogger';
import Address = require('./Address');
import ClientMessage = require('./ClientMessage');
import GetPartitionsCodec = require('./codec/GetPartitionsCodec');

const PARTITION_REFRESH_INTERVAL = 10000;

export class PartitionService {

    private client: HazelcastClient;
    private partitionMap: { [partitionId: number]: Address } = {};
    private partitionCount: number;
    private partitionRefreshTask: any;
    private isShutdown: boolean;
    private logger: ILogger;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.logger = client.getLoggingService().getLogger();
        this.isShutdown = false;
    }

    initialize(): Promise<void> {
        this.partitionRefreshTask = setInterval(this.refresh.bind(this), PARTITION_REFRESH_INTERVAL);
        return this.refresh();
    }

    shutdown(): void {
        clearInterval(this.partitionRefreshTask);
        this.isShutdown = true;
    }

    /**
     * Refreshes the internal partition table.
     */
    refresh(): Promise<void> {
        if (this.isShutdown) {
            return Promise.resolve();
        }
        const ownerConnection = this.client.getClusterService().getOwnerConnection();
        if (ownerConnection == null) {
            return Promise.resolve();
        }
        const clientMessage: ClientMessage = GetPartitionsCodec.encodeRequest();

        return this.client.getInvocationService()
            .invokeOnConnection(ownerConnection, clientMessage)
            .then((response: ClientMessage) => {
                const receivedPartitionMap = GetPartitionsCodec.decodeResponse(response);
                for (const partitionId in receivedPartitionMap) {
                    this.partitionMap[partitionId] = receivedPartitionMap[partitionId];
                }
                this.partitionCount = Object.keys(this.partitionMap).length;
            }).catch((e) => {
                if (this.client.getLifecycleService().isRunning()) {
                    this.logger.warn('PartitionService', 'Error while fetching cluster partition table from'
                        + this.client.getClusterService().ownerUuid, e);
                }
            });
    }

    /**
     * Returns the {@link Address} of the node which owns given partition id.
     * @param partitionId
     * @returns the address of the node.
     */
    getAddressForPartition(partitionId: number): Address {
        return this.partitionMap[partitionId];
    }

    /**
     * Computes the partition id for a given key.
     * @param key
     * @returns the partition id.
     */
    getPartitionId(key: any): number {
        let partitionHash: number;
        if (typeof key === 'object' && 'getPartitionHash' in key) {
            partitionHash = key.getPartitionHash();
        } else {
            partitionHash = this.client.getSerializationService().toData(key).getPartitionHash();
        }
        return Math.abs(partitionHash) % this.partitionCount;
    }

    getPartitionCount(): number {
        return this.partitionCount;
    }
}
