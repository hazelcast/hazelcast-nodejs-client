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
exports.NearCacheImpl = void 0;
const Long = require("long");
const EvictionPolicy_1 = require("../config/EvictionPolicy");
const InMemoryFormat_1 = require("../config/InMemoryFormat");
const Util_1 = require("../util/Util");
const DataStoreHashMap_1 = require("./DataStoreHashMap");
const DataRecord_1 = require("./DataRecord");
const StaleReadDetector_1 = require("./StaleReadDetector");
/** @internal */
class NearCacheImpl {
    constructor(nearCacheConfig, serializationService) {
        this.staleReadDetector = StaleReadDetector_1.alwaysFreshDetector;
        this.reservationCounter = Long.ZERO;
        this.evictedCount = 0;
        this.expiredCount = 0;
        this.missCount = 0;
        this.hitCount = 0;
        this.creationTime = Date.now();
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
        if (this.evictionPolicy === EvictionPolicy_1.EvictionPolicy.LFU) {
            this.compareFunc = DataRecord_1.DataRecord.lfuComp;
        }
        else if (this.evictionPolicy === EvictionPolicy_1.EvictionPolicy.LRU) {
            this.compareFunc = DataRecord_1.DataRecord.lruComp;
        }
        else if (this.evictionPolicy === EvictionPolicy_1.EvictionPolicy.RANDOM) {
            this.compareFunc = DataRecord_1.DataRecord.randomComp;
        }
        else {
            this.compareFunc = undefined;
        }
        this.evictionCandidatePool = [];
        this.internalStore = new DataStoreHashMap_1.DataKeyedHashMap();
        this.ready = (0, Util_1.deferredPromise)();
    }
    setReady(error) {
        if (error) {
            this.ready.reject(error);
        }
        else {
            this.ready.resolve();
        }
    }
    getName() {
        return this.name;
    }
    nextReservationId() {
        const res = this.reservationCounter;
        this.reservationCounter = this.reservationCounter.add(1);
        return res;
    }
    tryReserveForUpdate(key) {
        const internalRecord = this.internalStore.get(key);
        const resId = this.nextReservationId();
        if (internalRecord === undefined) {
            this.doEvictionIfRequired();
            const dr = new DataRecord_1.DataRecord(key, undefined, undefined, this.timeToLiveSeconds);
            dr.casStatus(DataRecord_1.DataRecord.READ_PERMITTED, resId);
            this.internalStore.set(key, dr);
            return resId;
        }
        if (internalRecord.casStatus(DataRecord_1.DataRecord.READ_PERMITTED, resId)) {
            return resId;
        }
        return DataRecord_1.DataRecord.NOT_RESERVED;
    }
    tryPublishReserved(key, value, reservationId) {
        const internalRecord = this.internalStore.get(key);
        if (internalRecord && internalRecord.casStatus(reservationId, DataRecord_1.DataRecord.READ_PERMITTED)) {
            if (this.inMemoryFormat === InMemoryFormat_1.InMemoryFormat.OBJECT) {
                internalRecord.value = this.serializationService.toObject(value);
            }
            else {
                /**
                 * This will work with compact since MapProxy's getInternal and getAllInternal
                 * fetches schemas into local schema service. Also since tryPublishReserved runs
                 * after getting the value from server and we got a compact object, its schema
                 * is guaranteed to be replicated.
                 */
                internalRecord.value = this.serializationService.toData(value);
            }
            internalRecord.setCreationTime();
            this.initInvalidationMetadata(internalRecord);
        }
        else if (internalRecord === undefined) {
            return undefined;
        }
        else {
            if (this.inMemoryFormat === InMemoryFormat_1.InMemoryFormat.BINARY) {
                return this.serializationService.toObject(internalRecord.value);
            }
            else {
                return internalRecord.value;
            }
        }
    }
    setStaleReadDetector(staleReadDetector) {
        this.staleReadDetector = staleReadDetector;
    }
    /**
     * Creates a new {@link DataRecord} for given key and value. Then, puts the record in near cache.
     * If the number of records in near cache exceeds {@link evictionMaxSize}, it removes expired items first.
     * If there is no expired item, it triggers an invalidation process to create free space.
     * @param key
     * @param value
     */
    put(key, value) {
        this.doEvictionIfRequired();
        if (this.inMemoryFormat === InMemoryFormat_1.InMemoryFormat.OBJECT) {
            value = this.serializationService.toObject(value);
        }
        else {
            value = this.serializationService.toData(value);
        }
        const dr = new DataRecord_1.DataRecord(key, value, undefined, this.timeToLiveSeconds);
        this.initInvalidationMetadata(dr);
        this.internalStore.set(key, dr);
    }
    /**
     *
     * @param key
     * @returns the value if present in near cache, 'undefined' if not
     */
    get(key) {
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
            if (this.inMemoryFormat === InMemoryFormat_1.InMemoryFormat.BINARY) {
                return this.serializationService.toObject(dr.value);
            }
            else {
                return dr.value;
            }
        });
    }
    invalidate(key) {
        this.internalStore.delete(key);
    }
    clear() {
        this.internalStore.clear();
    }
    isInvalidatedOnChange() {
        return this.invalidateOnChange;
    }
    getStatistics() {
        const stats = {
            creationTime: this.creationTime,
            evictedCount: this.evictedCount,
            expiredCount: this.expiredCount,
            missCount: this.missCount,
            hitCount: this.hitCount,
            entryCount: this.internalStore.size,
        };
        return stats;
    }
    isEvictionRequired() {
        return this.evictionPolicy !== EvictionPolicy_1.EvictionPolicy.NONE && this.evictionMaxSize <= this.internalStore.size;
    }
    doEvictionIfRequired() {
        if (!this.isEvictionRequired()) {
            return;
        }
        if (this.recomputeEvictionPool() > 0) {
            return;
        }
        else {
            this.evictRecord(this.evictionCandidatePool[0].key);
            this.evictionCandidatePool = this.evictionCandidatePool.slice(1);
        }
    }
    /**
     * @returns number of expired elements.
     */
    recomputeEvictionPool() {
        const arr = Array.from(this.internalStore.values());
        (0, Util_1.shuffleArray)(arr);
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
    filterExpiredRecord(candidate) {
        if (candidate.isExpired(this.maxIdleSeconds)) {
            this.expireRecord(candidate.key);
            return false;
        }
        else {
            return true;
        }
    }
    expireRecord(key) {
        if (this.internalStore.delete(key)) {
            this.expiredCount++;
        }
    }
    evictRecord(key) {
        if (this.internalStore.delete(key)) {
            this.evictedCount++;
        }
    }
    initInvalidationMetadata(dr) {
        if (this.staleReadDetector === StaleReadDetector_1.alwaysFreshDetector) {
            return;
        }
        const partitionId = this.staleReadDetector.getPartitionId(dr.key);
        const metadataContainer = this.staleReadDetector.getMetadataContainer(partitionId);
        dr.setInvalidationSequence(metadataContainer.getSequence());
        dr.setUuid(metadataContainer.getUuid());
    }
}
exports.NearCacheImpl = NearCacheImpl;
//# sourceMappingURL=NearCache.js.map