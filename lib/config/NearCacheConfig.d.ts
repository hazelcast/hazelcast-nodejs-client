import { EvictionPolicy } from './EvictionPolicy';
import { InMemoryFormat } from './InMemoryFormat';
/**
 * Near Cache configuration to be used by the client for the specified IMap.
 */
export interface NearCacheConfig {
    /**
     * Enables cluster-assisted invalidate on change behavior. When set to `true`,
     * entries are invalidated when they are changed in the cluster. By default, set to `true`.
     */
    invalidateOnChange?: boolean;
    /**
     * Maximum number of seconds that an entry can stay in the Near Cache until
     * it is accessed. By default, set to `0`.
     */
    maxIdleSeconds?: number;
    /**
     * Specifies in which format data will be stored in the Near Cache. Available values
     * are `OBJECT` and `BINARY`. By default, set to `BINARY`.
     */
    inMemoryFormat?: InMemoryFormat;
    /**
     * Maximum number of seconds that an entry can stay in the cache. By default, set to `0`.
     */
    timeToLiveSeconds?: number;
    /**
     * Defines eviction policy configuration. Available values are `LRU`, `LFU`, `NONE`
     * and `RANDOM`. By default, set to `LRU`.
     */
    evictionPolicy?: EvictionPolicy;
    /**
     * Defines maximum number of entries kept in the memory before eviction kicks in.
     * By default, set to `Number.MAX_SAFE_INTEGER`.
     */
    evictionMaxSize?: number;
    /**
     * Number of random entries that are evaluated to see if some of them are already
     * expired. By default, set to `8`.
     */
    evictionSamplingCount?: number;
    /**
     * Size of the pool for eviction candidates. The pool is kept sorted according to
     * the eviction policy. By default, set to `16`.
     */
    evictionSamplingPoolSize?: number;
}
