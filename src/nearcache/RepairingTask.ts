import {RepairingHandler} from './RepairingHandler';
import {NearCache} from './NearCache';
import HazelcastClient from '../HazelcastClient';
import {MetadataFetcher} from './MetadataFetcher';
import * as assert from 'assert';
import * as Long from 'long';
import {LoggingService} from '../logging/LoggingService';

const PROPERTY_MAX_RECONCILIATION_INTERVAL_SECONDS = 'hazelcast.invalidation.reconciliation.interval.seconds';
const PROPERTY_MIN_RECONCILIATION_INTERVAL_SECONDS = 'hazelcast.invalidation.min.reconciliation.interval.seconds';
const PROPERTY_MAX_TOLERATED_MISS_COUNT = 'hazelcast.invalidation.max.tolerated.miss.count';

export class RepairingTask {

    private antientropyTaskHandle: any;
    private handlers: Map<string, RepairingHandler>;
    private reconcilliationInterval: number;
    private maxToleratedMissCount: number;
    private localUuid: string;
    private metadataFetcher: MetadataFetcher;
    private client: HazelcastClient;
    private partitionCount: number;
    private readonly minAllowedReconciliationSeconds: number;
    private readonly logger = LoggingService.getLoggingService();

    constructor(client: HazelcastClient) {
        this.client = client;
        let config = this.client.getConfig();
        this.minAllowedReconciliationSeconds = config.properties[PROPERTY_MIN_RECONCILIATION_INTERVAL_SECONDS];
        let requestedReconciliationSeconds = config.properties[PROPERTY_MAX_RECONCILIATION_INTERVAL_SECONDS];
        this.reconcilliationInterval = this.getReconciliationIntervalMillis(requestedReconciliationSeconds);
        this.handlers = new Map<string, RepairingHandler>();
        this.localUuid = this.client.getLocalEndpoint().uuid;
        this.maxToleratedMissCount = config.properties[PROPERTY_MAX_TOLERATED_MISS_COUNT];
        this.metadataFetcher = new MetadataFetcher(client);
        this.partitionCount = this.client.getPartitionService().getPartitionCount();
    }

    registerAndGetHandler(objectName: string, nearCache: NearCache): RepairingHandler {
        let handler = this.handlers.get(objectName);
        if (handler !== undefined) {
            return handler;
        }
        handler = new RepairingHandler(objectName, this.client.getPartitionService(), nearCache, this.localUuid);
        this.metadataFetcher.initHandler(handler);
        this.handlers.set(objectName, handler);
        if (this.antientropyTaskHandle === undefined) {
            this.start();
        }
        return handler;
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
            let added = handler.getMetadataContainer(i).getMissedSequenceCount();
            totalMissCount = totalMissCount.add(added);
            if (totalMissCount.greaterThanOrEqual(this.maxToleratedMissCount)) {
                return true;
            }
        }
        return false;
    }

    private updateLastKnownStaleSequences(handler: RepairingHandler): void {
        for (let i = 0; i < this.partitionCount; i++) {
            let container = handler.getMetadataContainer(i);
            let missedCount = container.getMissedSequenceCount();
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
            let message = 'Reconciliation interval can be at least ' + this.minAllowedReconciliationSeconds + ' seconds ' +
                'if not 0. Configured interval is ' + seconds + ' seconds. ' +
                'Note: configuring a value of 0 seconds disables the reconciliation task.';
            throw new RangeError(message);
        }
    }

}
