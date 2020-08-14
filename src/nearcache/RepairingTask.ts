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
/** @ignore *//** */

import * as assert from 'assert';
import * as Long from 'long';
import HazelcastClient from '../HazelcastClient';
import {MetadataFetcher} from './MetadataFetcher';
import {NearCache} from './NearCache';
import {RepairingHandler} from './RepairingHandler';
import {PartitionServiceImpl} from '../PartitionService';
import * as Promise from 'bluebird';
import {ILogger} from '../logging/ILogger';
import {UUID} from '../core/UUID';

const PROPERTY_MAX_RECONCILIATION_INTERVAL_SECONDS = 'hazelcast.invalidation.reconciliation.interval.seconds';
const PROPERTY_MIN_RECONCILIATION_INTERVAL_SECONDS = 'hazelcast.invalidation.min.reconciliation.interval.seconds';
const PROPERTY_MAX_TOLERATED_MISS_COUNT = 'hazelcast.invalidation.max.tolerated.miss.count';

/** @internal */
export class RepairingTask {

    private antientropyTaskHandle: any;
    private handlers: Map<string, RepairingHandler>;
    private reconcilliationInterval: number;
    private maxToleratedMissCount: number;
    private localUuid: UUID;
    private metadataFetcher: MetadataFetcher;
    private client: HazelcastClient;
    private partitionCount: number;
    private readonly minAllowedReconciliationSeconds: number;
    private readonly logger: ILogger;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.logger = this.client.getLoggingService().getLogger();
        const config = this.client.getConfig();
        this.minAllowedReconciliationSeconds = config.properties[PROPERTY_MIN_RECONCILIATION_INTERVAL_SECONDS] as number;
        const requestedReconciliationSeconds = config.properties[PROPERTY_MAX_RECONCILIATION_INTERVAL_SECONDS] as number;
        this.reconcilliationInterval = this.getReconciliationIntervalMillis(requestedReconciliationSeconds);
        this.handlers = new Map<string, RepairingHandler>();
        this.localUuid = this.client.getLocalEndpoint().uuid;
        this.maxToleratedMissCount = config.properties[PROPERTY_MAX_TOLERATED_MISS_COUNT] as number;
        this.metadataFetcher = new MetadataFetcher(client);
        this.partitionCount = this.client.getPartitionService().getPartitionCount();
    }

    registerAndGetHandler(objectName: string, nearCache: NearCache): Promise<RepairingHandler> {
        let handler = this.handlers.get(objectName);
        if (handler !== undefined) {
            return Promise.resolve(handler);
        }

        const partitionService = this.client.getPartitionService() as PartitionServiceImpl;
        handler = new RepairingHandler(objectName, partitionService, nearCache, this.localUuid);
        return this.metadataFetcher.initHandler(handler).then(() => {
            this.handlers.set(objectName, handler);
            if (this.antientropyTaskHandle === undefined) {
                this.start();
            }
            return handler;
        });
    }

    deregisterHandler(objectName: string): void {
        this.handlers.delete(objectName);
    }

    start(): void {
        assert(this.reconcilliationInterval > 0);
        this.antientropyTaskHandle = setInterval(this.antiEntropyTask.bind(this), this.reconcilliationInterval);
    }

    shutdown(): void {
        if (this.antientropyTaskHandle != null) {
            clearInterval(this.antientropyTaskHandle);
        }
    }

    antiEntropyTask(): void {
        if (this.client.getLifecycleService().isRunning()) {
            this.handlers.forEach((handler: RepairingHandler) => {
                if (this.isAboveMaxToleratedMissCount(handler)) {
                    this.updateLastKnownStaleSequences(handler);
                }
            });
            this.metadataFetcher.fetchMetadata(this.handlers);
        } else {
            this.shutdown();
            this.logger.debug('RepairingTask', 'Anti entropy task was on although client was not running.' +
                'Anti entropy task was shutdown forcibly.');
        }
    }

    private isAboveMaxToleratedMissCount(handler: RepairingHandler): boolean {
        let totalMissCount = Long.fromNumber(0);
        for (let i = 0; i < this.partitionCount; i++) {
            const added = handler.getMetadataContainer(i).getMissedSequenceCount();
            totalMissCount = totalMissCount.add(added);
            if (totalMissCount.greaterThanOrEqual(this.maxToleratedMissCount)) {
                return true;
            }
        }
        return false;
    }

    private updateLastKnownStaleSequences(handler: RepairingHandler): void {
        for (let i = 0; i < this.partitionCount; i++) {
            const container = handler.getMetadataContainer(i);
            const missedCount = container.getMissedSequenceCount();
            if (missedCount.notEquals(0)) {
                container.increaseMissedSequenceCount(missedCount.negate());
                handler.updateLastKnownStaleSequence(container);
            }
        }
    }

    private getReconciliationIntervalMillis(seconds: number): number {
        if (seconds === 0 || seconds >= this.minAllowedReconciliationSeconds) {
            return seconds * 1000;
        } else {
            const message = 'Reconciliation interval can be at least ' + this.minAllowedReconciliationSeconds + ' seconds ' +
                'if not 0. Configured interval is ' + seconds + ' seconds. ' +
                'Note: configuring a value of 0 seconds disables the reconciliation task.';
            throw new RangeError(message);
        }
    }

}
