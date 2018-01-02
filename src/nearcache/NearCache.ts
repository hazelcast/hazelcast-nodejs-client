/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {Data} from '../serialization/Data';
import {EvictionPolicy, InMemoryFormat, NearCacheConfig} from '../Config';
import {shuffleArray} from '../Util';
import {SerializationService} from '../serialization/SerializationService';
import {DataKeyedHashMap} from '../DataStoreHashMap';
import {StaleReadDetector} from './StaleReadDetector';
import * as AlwaysFreshStaleReadDetectorImpl from './AlwaysFreshStaleReadDetectorImpl';
import {DataRecord} from './DataRecord';
import * as Long from 'long';

export interface NearCacheStatistics {
    evictedCount: number;
    expiredCount: number;
    missCount: number;
    hitCount: number;
    entryCount: number;
}

export interface NearCache {
    put(key: Data, value: any): void;
    get(key: Data): Data | any;
    invalidate(key: Data): void;
    clear(): void;
    getStatistics(): NearCacheStatistics;
    isInvalidatedOnChange(): boolean;
    setStaleReadDetector(detector: StaleReadDetector): void;
    tryReserveForUpdate(key: Data): Long;
    tryPublishReserved(key: Data, value: any, reservationId: Long): any;
}

export class NearCacheImpl implements NearCache {

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
    private evictionCandidatePool: Array<DataRecord>;
    private staleReadDetector: StaleReadDetector = AlwaysFreshStaleReadDetectorImpl.INSTANCE;
    private reservationCounter: Long = Long.ZERO;

    internalStore: DataKeyedHashMap<DataRecord>;

    private evictedCount: number = 0;
    private expiredCount: number = 0;
    private missCount: number = 0;
    private hitCount: number = 0;
    private compareFunc: (x: DataRecord, y: DataRecord) => number;

    constructor(nearCacheConfig: NearCacheConfig, serializationService: SerializationService) {
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
    }

    nextReservationId(): Long {
        let res = this.reservationCounter;
        this.reservationCounter = this.reservationCounter.add(1);
        return res;
    }

    tryReserveForUpdate(key: Data): Long {
        let internalRecord = this.internalStore.get(key);
        let resId = this.nextReservationId();
        if (internalRecord === undefined) {
            this.doEvictionIfRequired();
            let dr = new DataRecord(key, undefined, undefined, this.timeToLiveSeconds);
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
        let internalRecord = this.internalStore.get(key);
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
        var dr = new DataRecord(key, value, undefined, this.timeToLiveSeconds);
        this.initInvalidationMetadata(dr);
        this.internalStore.set(key, dr);
    }

    private initInvalidationMetadata(dr: DataRecord): void {
        if (this.staleReadDetector === AlwaysFreshStaleReadDetectorImpl.INSTANCE) {
            return;
        }
        let partitionId = this.staleReadDetector.getPartitionId(dr.key);
        let metadataContainer = this.staleReadDetector.getMetadataContainer(partitionId);
        dr.setInvalidationSequence(metadataContainer.getSequence());
        dr.setUuid(metadataContainer.getUuid());
    }

    /**
     *
     * @param key
     * @returns the value if present in near cache, 'undefined' if not
     */
    get(key: Data): Data | any {
        var dr = this.internalStore.get(key);
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
    }

    invalidate(key: Data): void {
        this.internalStore.delete(key);
    }

    clear(): void {
        this.internalStore.clear();
    }

    protected isEvictionRequired() {
        return this.evictionPolicy !== EvictionPolicy.NONE && this.evictionMaxSize <= this.internalStore.size;
    }

    protected doEvictionIfRequired(): void {
        if (!this.isEvictionRequired()) {
            return;
        }
        var internalSize = this.internalStore.size;
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
        var arr: Array<DataRecord> = Array.from(this.internalStore.values() );

        shuffleArray<DataRecord>(arr);
        var newCandidates = arr.slice(0, this.evictionSamplingCount);
        var cleanedNewCandidates = newCandidates.filter(this.filterExpiredRecord, this);
        var expiredCount = newCandidates.length - cleanedNewCandidates.length;
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
        if (this.internalStore.delete(key) ) {
            this.expiredCount++;
        }
    }

    protected evictRecord(key: any | Data): void {
        if (this.internalStore.delete(key)) {
            this.evictedCount++;
        }
    }

    isInvalidatedOnChange(): boolean {
        return this.invalidateOnChange;
    }

    getStatistics(): NearCacheStatistics {
        var stats: NearCacheStatistics = {
            evictedCount: this.evictedCount,
            expiredCount: this.expiredCount,
            missCount: this.missCount,
            hitCount: this.hitCount,
            entryCount: this.internalStore.size
        };
        return stats;
    }
}
