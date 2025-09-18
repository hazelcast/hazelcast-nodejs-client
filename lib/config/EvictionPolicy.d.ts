/**
 * Represents the format that objects are kept in this client's memory.
 */
export declare enum EvictionPolicy {
    /**
     * No items are evicted.
     */
    NONE = "NONE",
    /**
     * Least Recently Used.
     */
    LRU = "LRU",
    /**
     * Least Frequently Used.
     */
    LFU = "LFU",
    /**
     * A random item is evicted each time.
     */
    RANDOM = "RANDOM"
}
