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

import * as Long from 'long';
import {EvictionPolicy} from '../config/EvictionPolicy';
import {InMemoryFormat} from '../config/InMemoryFormat';
import {NearCacheConfigImpl} from '../config/NearCacheConfig';
import {Data} from '../serialization/Data';
import {SerializationService} from '../serialization/SerializationService';
import {
    deferredPromise,
    DeferredPromise,
    shuffleArray
} from '../util/Util';
import {DataKeyedHashMap} from './DataStoreHashMap';
import {DataRecord} from './DataRecord';
import {
    StaleReadDetector,
    alwaysFreshDetector
} from './StaleReadDetector';

/** @internal */
export interface NearCacheStatistics {
    creationTime: number;
    evictedCount: number;
    expiredCount: number;
    missCount: number;
    hitCount: number;
    entryCount: number;
}

/** @internal */
export interface NearCache {
    put(key: Data, value: any): void;

    get(key: Data): Promise<Data | any>;

    getName(): string;

    invalidate(key: Data): void;

    clear(): void;

    getStatistics(): NearCacheStatistics;

    isInvalidatedOnChange(): boolean;

    setStaleReadDetector(detector: StaleReadDetector): void;

    tryReserveForUpdate(key: Data): Long;

    tryPublishReserved(key: Data, value: any, reservationId: Long): any;

    setReady(error?: Error): void;
}

/** @internal */
export class NearCacheImpl implements NearCache {

    internalStore: DataKeyedHashMap<DataRecord>;
    private serializationService: SerializationService;
    private name: string;
    private invalidateOnChange: boolean;
    private maxIdleSeconds: number;
    private inMemoryFormat: InMemoryFormat;
    private timeToLiveSeconds: number;
    private evictionPolicy: EvictionPolicy;
    private evictionMaxSize: number;
    private evictionSamplingCount: number;
    private evictionSamplingPoolSize: number;
    private evictionCandidatePool: DataRecord[];
    private staleReadDetector: StaleReadDetector = alwaysFreshDetector;
    private reservationCounter: Long = Long.ZERO;

    private evictedCount = 0;
    private expiredCount = 0;
    private missCount = 0;
    private hitCount = 0;
    private creationTime = Date.now();
    private compareFunc: (x: DataRecord, y: DataRecord) => number;
    private ready: DeferredPromise<void>;

    constructor(nearCacheConfig: NearCacheConfigImpl, serializationService: SerializationService) {
        this.serializationService = serializationService;
        this.name = nearCacheConfig.name;
        this.invalidateOnChange = nearCacheConfig.invalidateOnChange;
        this.maxIdleSeconds = nearCacheConfig.maxIdleSeconds;
        this.inMemoryFormat = nearCacheConfig.inMemoryFormat;
        this.timeToLiveSeconds = nearCacheConfig.timeToLiveSeconds;
        this.evictionPolicy = nearCacheConfig.evictionPolicy;
        this.evictionMaxSize = nearCacheConfig.evictionMaxSize;
        this.evictionSamplingCount = nearCacheConfig.evictionSamplingCount;
        this.evictionSamplingPoolSize = nearCacheConfig.evictionSamplingPoolSize;
        if (this.evictionPolicy === EvictionPolicy.LFU) {
            this.compareFunc = DataRecord.lfuComp;
        } else if (this.evictionPolicy === EvictionPolicy.LRU) {
            this.compareFunc = DataRecord.lruComp;
        } else if (this.evictionPolicy === EvictionPolicy.RANDOM) {
            this.compareFunc = DataRecord.randomComp;
        } else {
            this.compareFunc = undefined;
        }

        this.evictionCandidatePool = [];
        this.internalStore = new DataKeyedHashMap<DataRecord>();
        this.ready = deferredPromise();
    }

    setReady(error?: Error): void {
        if (error) {
            this.ready.reject(error);
        } else {
            this.ready.resolve();
        }
    }

    getName(): string {
        return this.name;
    }

    nextReservationId(): Long {
        const res = this.reservationCounter;
        this.reservationCounter = this.reservationCounter.add(1);
        return res;
    }

    tryReserveForUpdate(key: Data): Long {
        const internalRecord = this.internalStore.get(key);
        const resId = this.nextReservationId();
        if (internalRecord === undefined) {
            this.doEvictionIfRequired();
            const dr = new DataRecord(key, undefined, undefined, this.timeToLiveSeconds);
            dr.casStatus(DataRecord.READ_PERMITTED, resId);
            this.internalStore.set(key, dr);
            return resId;
        }
        if (internalRecord.casStatus(DataRecord.READ_PERMITTED, resId)) {
            return resId;
        }
        return DataRecord.NOT_RESERVED;
    }

    tryPublishReserved(key: Data, value: any, reservationId: Long): any {
        const internalRecord = this.internalStore.get(key);
        if (internalRecord && internalRecord.casStatus(reservationId, DataRecord.READ_PERMITTED)) {
            if (this.inMemoryFormat === InMemoryFormat.OBJECT) {
                internalRecord.value = this.serializationService.toObject(value);
            } else {
                internalRecord.value = this.serializationService.toData(value);
            }
            internalRecord.setCreationTime();
            this.initInvalidationMetadata(internalRecord);
        } else if (internalRecord === undefined) {
            return undefined;
        } else {
            if (this.inMemoryFormat === InMemoryFormat.BINARY) {
                return this.serializationService.toObject(internalRecord.value);
            } else {
                return internalRecord.value;
            }
        }
    }

    setStaleReadDetector(staleReadDetector: StaleReadDetector): void {
        this.staleReadDetector = staleReadDetector;
    }

    /**
     * Creates a new {DataRecord} for given key and value. Then, puts the record in near cache.
     * If the number of records in near cache exceeds {evictionMaxSize}, it removes expired items first.
     * If there is no expired item, it triggers an invalidation process to create free space.
     * @param key
     * @param value
     */
    put(key: Data, value: any): void {
        this.doEvictionIfRequired();
        if (this.inMemoryFormat === InMemoryFormat.OBJECT) {
            value = this.serializationService.toObject(value);
        } else {
            value = this.serializationService.toData(value);
        }
        const dr = new DataRecord(key, value, undefined, this.timeToLiveSeconds);
        this.initInvalidationMetadata(dr);
        this.internalStore.set(key, dr);
    }

    /**
     *
     * @param key
     * @returns the value if present in near cache, 'undefined' if not
     */
    get(key: Data): Promise<Data | any> {
        return this.ready.promise.then(() => {
            const dr = this.internalStore.get(key);
            if (dr === undefined) {
                this.missCount++;
                return undefined;
            }
            if (this.staleReadDetector.isStaleRead(key, dr)) {
                this.internalStore.delete(key);
                this.missCount++;
                return undefined;
            }
            if (dr.isExpired(this.maxIdleSeconds)) {
                this.expireRecord(key);
                this.missCount++;
                return undefined;
            }
            dr.setAccessTime();
            dr.hitRecord();
            this.hitCount++;
            if (this.inMemoryFormat === InMemoryFormat.BINARY) {
                return this.serializationService.toObject(dr.value);
            } else {
                return dr.value;
            }
        });
    }

    invalidate(key: Data): void {
        this.internalStore.delete(key);
    }

    clear(): void {
        this.internalStore.clear();
    }

    isInvalidatedOnChange(): boolean {
        return this.invalidateOnChange;
    }

    getStatistics(): NearCacheStatistics {
        const stats: NearCacheStatistics = {
            creationTime: this.creationTime,
            evictedCount: this.evictedCount,
            expiredCount: this.expiredCount,
            missCount: this.missCount,
            hitCount: this.hitCount,
            entryCount: this.internalStore.size,
        };
        return stats;
    }

    protected isEvictionRequired(): boolean {
        return this.evictionPolicy !== EvictionPolicy.NONE && this.evictionMaxSize <= this.internalStore.size;
    }

    protected doEvictionIfRequired(): void {
        if (!this.isEvictionRequired()) {
            return;
        }
        if (this.recomputeEvictionPool() > 0) {
            return;
        } else {
            this.evictRecord(this.evictionCandidatePool[0].key);
            this.evictionCandidatePool = this.evictionCandidatePool.slice(1);
        }
    }

    /**
     * @returns number of expired elements.
     */
    protected recomputeEvictionPool(): number {
        const arr: DataRecord[] = Array.from(this.internalStore.values());

        shuffleArray<DataRecord>(arr);
        const newCandidates = arr.slice(0, this.evictionSamplingCount);
        const cleanedNewCandidates = newCandidates.filter(this.filterExpiredRecord, this);
        const expiredCount = newCandidates.length - cleanedNewCandidates.length;
        if (expiredCount > 0) {
            return expiredCount;
        }

        this.evictionCandidatePool.push(...cleanedNewCandidates);

        this.evictionCandidatePool.sort(this.compareFunc);

        this.evictionCandidatePool = this.evictionCandidatePool.slice(0, this.evictionSamplingPoolSize);
        return 0;
    }

    protected filterExpiredRecord(candidate: DataRecord): boolean {
        if (candidate.isExpired(this.maxIdleSeconds)) {
            this.expireRecord(candidate.key);
            return false;
        } else {
            return true;
        }
    }

    protected expireRecord(key: any | Data): void {
        if (this.internalStore.delete(key)) {
            this.expiredCount++;
        }
    }

    protected evictRecord(key: any | Data): void {
        if (this.internalStore.delete(key)) {
            this.evictedCount++;
        }
    }

    private initInvalidationMetadata(dr: DataRecord): void {
        if (this.staleReadDetector === alwaysFreshDetector) {
            return;
        }
        const partitionId = this.staleReadDetector.getPartitionId(dr.key);
        const metadataContainer = this.staleReadDetector.getMetadataContainer(partitionId);
        dr.setInvalidationSequence(metadataContainer.getSequence());
        dr.setUuid(metadataContainer.getUuid());
    }
}
