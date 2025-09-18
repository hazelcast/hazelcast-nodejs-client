import * as Long from 'long';
/**
 * Represents a view of a map entry.
 */
export declare class SimpleEntryView<K, V> {
    /**
     * Key of the entry.
     */
    key: K;
    /**
     * Value of the entry.
     */
    value: V;
    /**
     * Cost (in bytes) of the entry.
     */
    cost: Long;
    /**
     * Creation time of the entry.
     */
    creationTime: Long;
    /**
     * Expiration time of the entry.
     */
    expirationTime: Long;
    /**
     * Number of hits of the entry.
     */
    hits: Long;
    /**
     * Last access time for the entry.
     */
    lastAccessTime: Long;
    /**
     * Last time the value was flushed to map store.
     */
    lastStoredTime: Long;
    /**
     * Last time the value was updated.
     */
    lastUpdateTime: Long;
    /**
     * Version of the entry.
     */
    version: Long;
    /**
     * Last set time-to-live in milliseconds.
     */
    ttl: Long;
    /**
     * Last set max idle time in milliseconds.
     */
    maxIdle: Long;
}
