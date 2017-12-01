import {RepairingHandler} from './RepairingHandler';
import {NearCache} from './NearCache';
import HazelcastClient from '../HazelcastClient';

const PROPERTY_MAX_RECONCILIATION_INTERVAL_SECONDS = 'hazelcast.invalidation.reconciliation.interval.seconds';
const PROPERTY_MAX_TOLERATED_MISS_COUNT = 'hazelcast.invalidation.max.tolerated.miss.count';
const MIN_ALLOWED_RECONCILIATION_INTERVAL_SECONDS = 30;

export class RepairingTask {

    private antientropyTaskHandle: number;
    private lastAntiEntropyRunTime: number;
    private handlers: Map<string, RepairingHandler>;
    private reconcilliationInterval: number;
    private maxToleratedMissCount: number;
    private localUuid: string;
    private client: HazelcastClient;

    constructor(client: HazelcastClient) {
        this.client = client;
        let config = this.client.getConfig();
        this.handlers = new Map();
        this.localUuid = this.client.getLocalEndpoint().uuid;
        let requestedReconciliationSeconds = config.properties[PROPERTY_MAX_RECONCILIATION_INTERVAL_SECONDS];
        this.reconcilliationInterval = this.getReconciliationIntervalMillis(requestedReconciliationSeconds);
        this.maxToleratedMissCount = config.properties[PROPERTY_MAX_TOLERATED_MISS_COUNT];
    }

    registerAndGetHandler(objectName: string, nearCache: NearCache): RepairingHandler {
        let handler = this.handlers.get(objectName);
        if (handler !== undefined) {
            return handler;
        }
        handler = new RepairingHandler(objectName, this.client.getPartitionService(), nearCache, this.localUuid);
        this.handlers.set(objectName, handler);
        return handler;
    }

    deregisterHandler(objectName: string): void {
        this.handlers.delete(objectName);
    }

    start(): void {
        // create anti entropy task.
    }

    stop(): void {
        // stop and remove anti entropy task.
    }

    antiEntropyTask(): void {
        // fixSequenceGaps
    }

    private getReconciliationIntervalMillis(seconds: number): number {
        if (seconds === 0 || seconds >= MIN_ALLOWED_RECONCILIATION_INTERVAL_SECONDS) {
            return seconds * 1000;
        } else {
            let message = 'Reconciliation interval can be at least ' + MIN_ALLOWED_RECONCILIATION_INTERVAL_SECONDS + ' seconds ' +
                'if not 0. Configured interval is ' + seconds + ' seconds. ' +
                'Note: configuring a value of 0 seconds disables the reconciliation task.';
            throw new RangeError(message);
        }
    }

}
