import * as Long from 'long';
import { Aggregator } from '../aggregation/Aggregator';
import { SimpleEntryView } from '../core/SimpleEntryView';
import { MapListener } from './MapListener';
import { Predicate, ReadOnlyLazyList, DistributedObject } from '../core';
import { IndexConfig } from '../config/IndexConfig';
/**
 * Concurrent, distributed, observable and queryable map.
 *
 * Methods that require serialization/deserialization may throw RangeError, e.g when there is no suitable
 * serializer for a certain type.
 */
export interface IMap<K, V> extends DistributedObject {
    /**
     * Applies the aggregation logic on all map entries and returns the result.
     *
     * Fast-Aggregations are the successor of the Map-Reduce Aggregators.
     * They are equivalent to the Map-Reduce Aggregators in most of the
     * use-cases, but instead of running on the Map-Reduce engine they run
     * on the Query infrastructure. Their performance is tens to hundreds
     * times better due to the fact that they run in parallel for each
     * partition and are highly optimized for speed and low memory consumption.
     *
     * @param aggregator aggregator to aggregate the entries with
     * @param <R> type of the result
     * @throws AssertionError if `aggregator` is `null`
     * @returns the result of the given type
     */
    aggregate<R>(aggregator: Aggregator<R>): Promise<R>;
    /**
     * Applies the aggregation logic on map entries filtered with the Predicated
     * and returns the result.
     *
     * Fast-Aggregations are the successor of the Map-Reduce Aggregators. They
     * are equivalent to the Map-Reduce Aggregators in most of the use-cases,
     * but instead of running on the Map-Reduce engine they run on the Query
     * infrastructure. Their performance is tens to hundreds times better
     * due to the fact that they run in parallel for each partition and are
     * highly optimized for speed and low memory consumption.
     *
     * @param aggregator aggregator to aggregate the entries with
     * @param predicate predicate to filter the entries with
     * @throws AssertionError if `aggregator` or `predicate` is `null`
     * @param <R> type of the result
     * @returns the result of the given type
     */
    aggregateWithPredicate<R>(aggregator: Aggregator<R>, predicate: Predicate): Promise<R>;
    /**
     * Adds an index to this map for the specified entries so
     * that queries can run faster.
     *
     * Let's say your map values are Employee objects.
     * ```
     * class Employee implements Portable {
     *     active: boolean = false;
     *     age: number;
     *     name: string = null;
     *     // other fields
     *
     *     // portable implementation
     * }
     * ```
     *
     * If you are querying your values mostly based on age and active then
     * you may consider indexing these fields.
     * ```
     * const map = client.getMap('employees');
     * // Sorted index for range queries:
     * map.addIndex({
     *     type: 'SORTED',
     *     attributes: ['age']
     * });
     * // Hash index for equality predicates:
     * map.addIndex({
     *     type: 'HASH',
     *     attributes: ['active']
     * });
     * ```
     *
     * Index attribute should either have a getter method or be public.
     * You should also make sure to add the indexes before adding
     * entries to this map.
     *
     * **Time to Index**
     *
     * Indexing time is executed in parallel on each partition by operation threads. The Map
     * is not blocked during this operation.
     *
     * The time taken in proportional to the size of the Map and the number Members.
     *
     * **Searches while indexes are being built**
     *
     * Until the index finishes being created, any searches for the attribute will use a full Map scan,
     * thus avoiding using a partially built index and returning incorrect results.
     *
     * @throws AssertionError if `indexConfig` is `null`
     * @throws TypeError If the specified index configuration is invalid.
     * @param indexConfig Index configuration.
     */
    addIndex(indexConfig: IndexConfig): Promise<void>;
    /**
     * Returns `true` if this map has an item associated with key.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     * @returns `true` if the map contains the key, `false` otherwise
     */
    containsKey(key: K): Promise<boolean>;
    /**
     * Returns `true` if this map has key(s) associated with given value.
     *
     * @param value the value of the map entry
     * @throws AssertionError if `value` is `null`
     * @returns `true` if the map has key or keys associated with given value
     */
    containsValue(value: V): Promise<boolean>;
    /**
     * Associates the specified value with the specified key.
     * If key was associated with another value, it replaces the old value.
     *
     * The entry will expire and get evicted after the TTL. It limits the
     * lifetime of the entries relative to the time of the last write access
     * performed on them. If the TTL is `0`, then the entry lives forever.
     * If the TTL is negative, then the TTL from the map configuration will
     * be used (default: forever).
     *
     * The entry will expire and get evicted after the Max Idle time. It limits
     * the lifetime of the entries relative to the time of the last read or write
     * access performed on them. If the Max Idle is `0`, then the entry lives
     * forever. If the Max Idle is negative, then the Max Idle from the map
     * configuration will be used (default: forever). The time precision is
     * limited by `1` second. The Max Idle that is less than `1` second can
     * lead to unexpected behaviour.
     *
     * @param key the key of the map entry
     * @param value new value
     * @param ttl optional time to live in milliseconds. `0` means infinite,
     *            negative means map config default. Time resolution for TTL
     *            is seconds. The given value is rounded to the next closest
     *            second value.
     * @param maxIdle optional maximum time in milliseconds for this entry to
     *                stay idle in the map. `0` means infinite, negative means
     *                map config default.
     * @throws AssertionError if `key` or `value` is `null`
     * @returns old value if there was any, `null` otherwise
     */
    put(key: K, value: V, ttl?: number | Long, maxIdle?: number | Long): Promise<V>;
    /**
     * Puts all key value pairs from this array to the map as key -> value mappings.
     *
     * The behaviour of this operation is undefined if the specified pairs are modified
     * while this operation is in progress.
     *
     * **Interactions with the map store**
     *
     * For each element not found in memory
     * `MapLoader#load(Object)` is invoked to load the value from
     * the map store backing the map, which may come at a significant
     * performance cost. Exceptions thrown by load fail the operation
     * and are propagated to the caller. The elements which were added
     * before the exception was thrown will remain in the map, the rest
     * will not be added.
     *
     * If write-through persistence mode is configured,
     * `MapStore#store(Object, Object)` is invoked for each element
     * before the element is added in memory, which may come at a
     * significant performance cost. Exceptions thrown by store fail the
     * operation and are propagated to the caller. The elements which
     * were added before the exception was thrown will remain in the map,
     * the rest will not be added.
     *
     * If write-behind persistence mode is configured with write-coalescing
     * turned off, this call may be rejected with `ReachedMaxSizeError`
     * if the write-behind queue has reached its per-node maximum capacity.
     *
     * @param pairs entries to be put
     * @throws AssertionError if any key or value in the specified array is `null`
     */
    putAll(pairs: Array<[K, V]>): Promise<void>;
    /**
     * Puts all key value pairs from this array to the map as key -> value
     * mappings without loading non-existing elements from map store which
     * is more efficient than `putAll`.
     *
     * This method breaks the contract of EntryListener. EntryEvent of all
     * the updated entries will have `null` oldValue even if they exist previously.
     *
     * The behaviour of this operation is undefined if the specified pairs are
     * modified while this operation is in progress.
     *
     * **Interactions with the map store**
     *
     * If write-through persistence mode is configured,
     * `MapStore#store(Object, Object)` is invoked for each element
     * before the element is added in memory, which may come at a
     * significant performance cost. Exceptions thrown by store fail the
     * operation and are propagated to the caller. The elements which
     * were added before the exception was thrown will remain in the map,
     * the rest will not be added.
     *
     * If write-behind persistence mode is configured with write-coalescing
     * turned off, this call may be rejected with `ReachedMaxSizeError`
     * if the write-behind queue has reached its per-node maximum capacity.
     *
     * Works with Hazelcast versions 4.1 and above.
     *
     * @param pairs entries to be put
     * @throws AssertionError if any key or value in the specified array is `null`
     */
    setAll(pairs: Array<[K, V]>): Promise<void>;
    /**
     * Retrieves the value associated with given key.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     * @returns value associated with key, `null` if the key does not exist
     */
    get(key: K): Promise<V>;
    /**
     * Retrieves key value pairs of given keys.
     *
     * @param keys the array of keys
     * @throws AssertionError if `keys` is null or `keys` is not an array.
     */
    getAll(keys: K[]): Promise<Array<[K, V]>>;
    /**
     * Removes specified key from map. If optional value is specified, the key
     * is removed only if currently mapped to given value. Note that serialized
     * version of the value is used in comparison.
     *
     * @param key the key of the map entry
     * @param value expected value
     * @throws AssertionError if `key` is `null`
     * @returns value associated with key, `null` if the key did not exist
     *          before. If optional value is specified, a `boolean` representing
     *          whether or not entry is removed is returned
     */
    remove(key: K, value?: V): Promise<V | boolean>;
    /**
     * Removes all entries which match with the supplied predicate.
     * Note that calling this method also removes all entries from caller's Near Cache.
     * If this map has index, matching entries will be found via index search,
     * otherwise they will be found by full-scan.
     *
     * @param predicate matching entries with this predicate will be removed from the map
     * @throws AssertionError if `predicate` is `null`
     */
    removeAll(predicate: Predicate): Promise<void>;
    /**
     * Removes specified key from the map. Unlike {@link remove} this method does not
     * return the deleted value. Therefore, it eliminates deserialization cost
     * of the returned value.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     */
    delete(key: K): Promise<void>;
    /**
     * Retrieves the number of elements in the map.
     * @returns number of elements in map
     */
    size(): Promise<number>;
    /**
     * Removes all of the mappings.
     */
    clear(): Promise<void>;
    /**
     * Returns whether this map is empty or not.
     */
    isEmpty(): Promise<boolean>;
    /**
     * Returns entries as an array of key-value pairs.
     */
    entrySet(): Promise<Array<[K, V]>>;
    /**
     * Queries the map based on the specified predicate and returns matching entries.
     * Specified predicate runs on all members in parallel.
     *
     * @param predicate specified query criteria.
     * @throws AssertionError if `predicate` is `null`
     * @returns result entry set of the query.
     */
    entrySetWithPredicate(predicate: Predicate): Promise<Array<[K, V]>>;
    /**
     * Evicts the specified key from this map.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     */
    evict(key: K): Promise<boolean>;
    /**
     * Evicts all keys from this map.
     */
    evictAll(): Promise<void>;
    /**
     * If this map has a MapStore, this method flushes all local dirty entries.
     */
    flush(): Promise<void>;
    /**
     * Releases the lock for the specified key regardless of the owner.
     * This operation always unlocks the key.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     */
    forceUnlock(key: K): Promise<void>;
    /**
     * Checks whether given key is locked.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     * @returns `true` if key is locked, `false` otherwise
     */
    isLocked(key: K): Promise<boolean>;
    /**
     * Locks the given key for this map. Promise is resolved when lock is
     * successfully acquired. This means it may never be resolved if some
     * other process holds the lock and does not unlock it. A lock may be
     * acquired on non-existent keys. In that case, other clients would
     * block until the non-existent key is unlocked. If the lock holder
     * introduces the key to the map, the put operation is not blocked.
     * If a client not holding a lock on the non-existent key tries to
     * introduce the key while a lock exists on the non-existent key,
     * the put operation blocks until it is unlocked.
     *
     * Locking is reentrant, meaning that the lock owner client can obtain the
     * lock multiple times. If the lock was acquired multiple times, then `unlock()`
     * method must be called the same amount of times, otherwise the lock will
     * remain unavailable.
     *
     * @param key the key of the map entry
     * @param leaseTime lock is automatically unlocked after `leaseTime`
     *                  milliseconds; defaults to infinity
     * @throws AssertionError if `key` is `null`
     */
    lock(key: K, leaseTime?: number): Promise<void>;
    /**
     * Returns the keys of this map as an array.
     */
    keySet(): Promise<K[]>;
    /**
     * Queries the map based on the specified predicate and returns the keys
     * of matching entries.
     *
     * @param predicate predicate to filter map entries
     * @throws AssertionError if `predicate` is `null`
     */
    keySetWithPredicate(predicate: Predicate): Promise<K[]>;
    /**
     * Loads keys to the store.
     *
     * @param keys loads only given keys if set
     * @param replaceExistingValues if set to `true` existing keys will be
     *                              replaced by newly loaded keys.
     */
    loadAll(keys?: K[], replaceExistingValues?: boolean): Promise<void>;
    /**
     * Puts specified key value association if it was not present before.
     *
     * The entry will expire and get evicted after the TTL. It limits the
     * lifetime of the entries relative to the time of the last write access
     * performed on them. If the TTL is `0`, then the entry lives forever.
     * If the TTL is negative, then the TTL from the map configuration will
     * be used (default: forever).
     *
     * The entry will expire and get evicted after the Max Idle time. It limits
     * the lifetime of the entries relative to the time of the last read or write
     * access performed on them. If the Max Idle is `0`, then the entry lives
     * forever. If the Max Idle is negative, then the Max Idle from the map
     * configuration will be used (default: forever). The time precision is
     * limited by `1` second. The Max Idle that is less than `1` second can
     * lead to unexpected behaviour.
     *
     * @param key the key of the map entry
     * @param value new value
     * @param ttl optional time to live in milliseconds. `0` means infinite,
     *            negative means map config default. Time resolution for TTL
     *            is seconds. The given value is rounded to the next closest
     *            second value.
     * @param maxIdle optional maximum time in milliseconds for this entry to
     *                stay idle in the map. `0` means infinite, negative means
     *                map config default.
     * @throws AssertionError if `key` or `value` is `null`
     * @returns old value of the entry
     */
    putIfAbsent(key: K, value: V, ttl?: number | Long, maxIdle?: number | Long): Promise<V>;
    /**
     * Same as {@link put} except it does not call underlying MapStore.
     *
     * @param key the key of the map entry
     * @param value new value
     * @param ttl optional time to live in milliseconds. `0` means infinite,
     *            negative means map config default. Time resolution for TTL
     *            is seconds. The given value is rounded to the next closest
     *            second value.
     * @param maxIdle optional maximum time in milliseconds for this entry to
     *                stay idle in the map. `0` means infinite, negative means
     *                map config default.
     * @throws AssertionError if `key` or `value` is `null`
     */
    putTransient(key: K, value: V, ttl?: number | Long, maxIdle?: number | Long): Promise<void>;
    /**
     * Replaces value of the key if only it was associated to `oldValue`.
     *
     * @param key the key of the map entry
     * @param newValue new value
     * @param oldValue expected old value
     * @throws AssertionError if `key`, `oldValue` or `newValue` is `null`
     * @returns `true` if the value was replaced
     */
    replaceIfSame(key: K, oldValue: V, newValue: V): Promise<boolean>;
    /**
     * Replaces value of given key with `newValue`.
     *
     * @param key the key of the map entry
     * @param newValue
     * @throws AssertionError if `key` or `newValue` is `null`
     * @returns previous value
     */
    replace(key: K, newValue: V): Promise<V>;
    /**
     * Similar to {@link put} except it does not return the old value.
     *
     * The entry will expire and get evicted after the TTL. It limits the
     * lifetime of the entries relative to the time of the last write access
     * performed on them. If the TTL is `0`, then the entry lives forever.
     * If the TTL is negative, then the TTL from the map configuration will
     * be used (default: forever).
     *
     * The entry will expire and get evicted after the Max Idle time. It limits
     * the lifetime of the entries relative to the time of the last read or write
     * access performed on them. If the Max Idle is `0`, then the entry lives
     * forever. If the Max Idle is negative, then the Max Idle from the map
     * configuration will be used (default: forever). The time precision is
     * limited by `1` second. The Max Idle that is less than `1` second can
     * lead to unexpected behaviour.
     *
     * @param key the key of the map entry
     * @param value new value
     * @param ttl optional time to live in milliseconds. `0` means infinite,
     *            negative means map config default. Time resolution for TTL
     *            is seconds. The given value is rounded to the next closest
     *            second value.
     * @param maxIdle optional maximum time in milliseconds for this entry to
     *                stay idle in the map. `0` means infinite, negative means
     *                map config default.
     * @throws AssertionError if `key` or `value` is `null`
     */
    set(key: K, value: V, ttl?: number | Long, maxIdle?: number | Long): Promise<void>;
    /**
     * Releases the lock for this key. If this client holds the lock,
     * hold count is decremented. If hold count is zero, lock is released.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     */
    unlock(key: K): Promise<void>;
    /**
     * Returns a list of values contained in this map.
     */
    values(): Promise<ReadOnlyLazyList<V>>;
    /**
     * Queries the map based on the specified predicate and returns the values of
     * matching entries. Specified predicate runs on all members in parallel.
     *
     * @param predicate
     * @throws AssertionError if `predicate` is `null`
     * @returns a list of values that satisfies the given predicate
     */
    valuesWithPredicate(predicate: Predicate): Promise<ReadOnlyLazyList<V>>;
    /**
     * Returns a key-value pair representing the association of given key.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     */
    getEntryView(key: K): Promise<SimpleEntryView<K, V>>;
    /**
     * Tries to acquire the lock for the specified key.
     * If lock is not available, server immediately responds with `false`.
     *
     * Locking is reentrant, meaning that the lock owner client can obtain
     * the lock multiple times. If the lock was acquired multiple times, then
     * `unlock()` method must be called the same amount of times, otherwise the
     * lock will remain unavailable.
     *
     * @param key the key of the map entry
     * @param timeout server waits for `timeout` milliseconds to acquire
     *                the lock before giving up; defaults to `0`
     * @param leaseTime lock is automatically release after `leaseTime`
     *                  milliseconds; defaults to infinity
     * @throws AssertionError if `key` is `null`
     */
    tryLock(key: K, timeout?: number, leaseTime?: number): Promise<boolean>;
    /**
     * Tries to put specified key value pair into the map. If this method returns
     * false, it indicates that caller thread was not able to acquire the lock for
     * given key in `timeout` milliseconds.
     *
     * @param key the key of the map entry
     * @param value new value
     * @param timeout maximum time to wait in milliseconds
     * @throws AssertionError if `key`, `value` or `timeout` is `null`
     */
    tryPut(key: K, value: V, timeout: number): Promise<boolean>;
    /**
     * Tries to remove specified key from the map. If this method returns
     * false, it indicates that caller thread was not able to acquire the lock
     * for given key in `timeout` milliseconds.
     *
     * @param key the key of the map entry
     * @param timeout maximum time to wait in milliseconds
     * @throws AssertionError if `key` or `timeout` is `null`
     */
    tryRemove(key: K, timeout: number): Promise<boolean>;
    /**
     * Adds a {@link MapListener} for this map.
     *
     * @param listener listener object
     * @param key optional key to restrict events to associated entry
     * @param includeValue if set to `true`, event message will contain
     *                     new value of the key
     * @returns registration id of the listener
     */
    addEntryListener(listener: MapListener<K, V>, key?: K, includeValue?: boolean): Promise<string>;
    /**
     * Adds a {@link MapListener} for this map. Listener will get notified
     * for map add/remove/update/evict events filtered by the given predicate.
     *
     * @param listener listener object
     * @param predicate predicate
     * @param key optional key to restrict events to associated entry
     * @param includeValue if set to `true`, event message will contain
     *                     new value of the key
     * @returns registration id of the listener
     */
    addEntryListenerWithPredicate(listener: MapListener<K, V>, predicate: Predicate, key?: K, includeValue?: boolean): Promise<string>;
    /**
     * Removes a {@link MapListener} from this map.
     *
     * @param listenerId registration Id of the listener
     * @returns `true` if remove operation is successful, `false` if
     *          unsuccessful or this listener did not exist
     */
    removeEntryListener(listenerId: string): Promise<boolean>;
    /**
     * Applies the user defined EntryProcessor to the all entries in the map.
     * Returns the results mapped by each key in the map.
     * Note that `entryProcessor` should be registered at server side too.
     *
     * @param entryProcessor EntryProcessor object
     * @param predicate if specified, entry processor is applied to the entries
     *                  that satisfy this predicate
     * @throws AssertionError if `entryProcessor` is `null`
     * @returns entries after EntryProcessor is applied
     */
    executeOnEntries(entryProcessor: any, predicate?: Predicate): Promise<Array<[K, V]>>;
    /**
     * Applies the user defined EntryProcessor to the entry mapped by the key.
     *
     * @param key entry processor is applied only to the value that is mapped
     *            with this key
     * @param entryProcessor entry processor to be applied
     * @throws AssertionError if `key` or `entryProcessor` is `null`
     * @returns result of entry process
     */
    executeOnKey(key: K, entryProcessor: any): Promise<V>;
    /**
     * Applies the user defined EntryProcessor to the entries mapped by the
     * given keys.
     *
     * @param keys keys to be processed
     * @param entryProcessor
     * @throws AssertionError if `keys` is not an array
     * @returns result of entry process
     */
    executeOnKeys(keys: K[], entryProcessor: any): Promise<Array<[K, V]>>;
    /**
     * Updates the TTL (time to live) value of the entry specified by `key`
     * with a new TTL value. New TTL value is valid starting from the time
     * this operation is invoked, not since the time the entry was created.
     * If the entry does not exist or is already expired, this call has no
     * effect.
     *
     * The entry will expire and get evicted after the TTL. If the TTL is `0`,
     * then the entry lives forever. If the TTL is negative, then the TTL
     * from the map configuration will be used (default: forever).
     *
     * If there is no entry with key `key` or is already expired, this call
     * makes no changes to entries stored in this map.
     *
     * @param key the key of the map entry
     * @param ttl time to live in milliseconds. `0` means infinite, negative
     *            means map config default. Time resolution for TTL is seconds.
     *            The given value is rounded to the next closest second value.
     * @return `true` if the entry exists and its TTL value is changed,
     *          `false` otherwise
     * @throws AssertionError if `key` or `ttl` is `null`
     */
    setTtl(key: K, ttl: number | Long): Promise<boolean>;
}
