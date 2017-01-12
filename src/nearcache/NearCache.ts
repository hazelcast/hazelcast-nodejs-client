import {Data} from '../serialization/Data';
import {EvictionPolicy, InMemoryFormat, NearCacheConfig} from '../Config';
import {shuffleArray} from '../Util';
import {SerializationService} from '../serialization/SerializationService';
import {DataKeyedHashMap} from '../DataStoreHashMap';

export class DataRecord {
    key: Data;
    value: Data | any;
    private creationTime: number;
    private expirationTime: number;
    private lastAccessTime: number;
    private accessHit: number;

    constructor(key: Data, value: Data | any, creationTime?: number, ttl?: number) {
        this.key = key;
        this.value = value;
        if (creationTime) {
            this.creationTime = creationTime;
        } else {
            this.creationTime = new Date().getTime();
        }
        if (ttl) {
            this.expirationTime = this.creationTime + ttl * 1000;
        } else {
            this.expirationTime = undefined;
        }
        this.lastAccessTime = this.creationTime;
        this.accessHit = 0;
    }

    public static lruComp(x: DataRecord, y: DataRecord) {
        return x.lastAccessTime - y.lastAccessTime;
    }

    public static lfuComp(x: DataRecord, y: DataRecord) {
        return x.accessHit - y.accessHit;
    }

    public static randomComp(x: DataRecord, y: DataRecord) {
        return Math.random() - 0.5;
    }

    isExpired(maxIdleSeconds: number) {
        var now = new Date().getTime();
        if ( (this.expirationTime > 0 && this.expirationTime < now) ||
            (maxIdleSeconds > 0 && this.lastAccessTime + maxIdleSeconds * 1000 < now)) {
            return true;
        } else {
            return false;
        }
    }

    setAccessTime(): void {
        this.lastAccessTime = new Date().getTime();
    }

    hitRecord(): void {
        this.accessHit++;
    }
}

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
        this.internalStore.set(key, dr);
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
