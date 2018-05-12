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

import * as Promise from 'bluebird';
import {DistributedObject} from '../DistributedObject';
import {EntryView} from '../core/EntryView';
import {IMapListener} from '../core/MapListener';
import {Predicate} from '../core/Predicate';
import {IdentifiedDataSerializable, Portable} from '../serialization/Serializable';
import {Aggregator} from '../aggregation/Aggregator';
import {ReadOnlyLazyList} from '../core/ReadOnlyLazyList';

export interface IMap<K, V> extends DistributedObject {

    /**
     * Applies the aggregation logic on all map entries and returns the result
     * <p>
     * Fast-Aggregations are the successor of the Map-Reduce Aggregators.
     * They are equivalent to the Map-Reduce Aggregators in most of the use-cases, but instead of running on the Map-Reduce
     * engine they run on the Query infrastructure. Their performance is tens to hundreds times better due to the fact
     * that they run in parallel for each partition and are highly optimized for speed and low memory consumption.
     *
     * @requires Hazelcast 3.8
     * @param aggregator aggregator to aggregate the entries with
     * @param <R> type of the result
     * @return the result of the given type
     */
    aggregate<R>(aggregator: Aggregator<R>): Promise<R>;

    /**
     * Applies the aggregation logic on map entries filtered with the Predicated and returns the result
     * <p>
     * Fast-Aggregations are the successor of the Map-Reduce Aggregators.
     * They are equivalent to the Map-Reduce Aggregators in most of the use-cases, but instead of running on the Map-Reduce
     * engine they run on the Query infrastructure. Their performance is tens to hundreds times better due to the fact
     * that they run in parallel for each partition and are highly optimized for speed and low memory consumption.
     *
     * @requires Hazelcast 3.8
     * @param aggregator aggregator to aggregate the entries with
     * @param predicate predicate to filter the entries with
     * @param <R> type of the result
     * @return the result of the given type
     */
    aggregateWithPredicate<R>(aggregator: Aggregator<R>, predicate: Predicate): Promise<R>;

    /**
     * Adds an index to this map for the specified entries so that queries can run faster.
     * @param attribute index attribute of value
     * @param ordered `true` if index should be ordered, `false` otherwise.
     */
    addIndex(attribute: string, ordered: boolean): Promise<void>;

    /**
     * This method checks whether the map has an item asssociated with key
     * @param key
     * @throws {RangeError} if key is undefined or null
     * @return `true` if the map contains the key, `false` otherwise.
     */
    containsKey(key: K): Promise<boolean>;

    /**
     * This method return true if this map has key(s) associated with given value
     * @param value
     * @throws {RangeError} if value is undefined or null
     * @return `true` if the map has key or keys associated with given value.
     */
    containsValue(value: V): Promise<boolean>;

    /**
     * Associates the specified value with the specified key.
     * If key was associated with another value, it replaces the old value.
     * If specified, value is evicted after ttl seconds.
     * @param key
     * @param value
     * @param ttl Time to live in milliseconds. 0 means infinite.
     * If ttl is not an integer, it is rounded up to the nearest integer value.
     * @throws {RangeError} if specified key or value is undefined or null or ttl is negative.
     * @return old value if there was any, `undefined` otherwise.
     */
    put(key: K, value: V, ttl?: number): Promise<V>;

    /**
     * Puts all key value pairs from this array to the map as key -> value mappings.
     * @param pairs
     */
    putAll(pairs: [K, V][]): Promise<void>;

    /**
     * Retrieves the value associated with given key.
     * @param key
     * @throws {RangeError} if key is undefined or null
     * @return value associated with key, undefined if the key does not exist.
     */
    get(key: K): Promise<V>;

    /**
     * Retrieves key value pairs of given keys.
     * @param keys the array of keys
     */
    getAll(keys: K[]): Promise<[K, V][]>;

    /**
     * Removes specified key from map. If optional value is specified, the key is removed only if currently mapped to
     * given value.
     * Note that serialized version of value is used in comparison.
     * @param key
     * @param value
     * @throws {RangeError} if key is undefined or null
     * @return value associated with key, `undefined` if the key did not exist before.
     */
    remove(key: K, value?: V): Promise<V>;

    /**
     * Removes specified key from map. Unlike {@link remove} this method does not return deleted value.
     * Therefore it eliminates deserialization cost of returned value.
     * @throws {RangeError} if key is null or undefined.
     * @param key
     */
    delete(key: K): Promise<void>;

    /**
     * Retrieves the number of elements in map
     * @return number of elements in map
     */
    size(): Promise<number>;

    /**
     * Removes all of the mappings
     * @return
     */
    clear(): Promise<void>;

    /**
     * Returns whether this map is empty or not
     */
    isEmpty(): Promise<boolean>;

    /**
     * Returns entries as an array of key-value pairs.
     */
    entrySet(): Promise<[K, V][]>;

    /**
     * Queries the map based on the specified predicate and returns matching entries.
     * Specified predicate runs on all members in parallel.
     * @param predicate specified query criteria.
     * @return result entry set of the query.
     */
    entrySetWithPredicate(predicate: Predicate): Promise<[K, V][]>;

    /**
     * Evicts the specified key from this map.
     * @throws {RangeError} if key is null or undefined.
     * @param key
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
     * It always unlocks the key.
     * @throws {RangeError} if key is null or undefined.
     * @param key
     */
    forceUnlock(key: K): Promise<void>;

    /**
     * Checks whether given key is locked.
     * @param key
     * @throws {RangeError} if key is null or undefined.
     * @return `true` if key is locked, `false` otherwise
     */
    isLocked(key: K): Promise<boolean>;

    /**
     * Locks the given key for this map. Promise is resolved when lock is successfully acquired.
     * This means it may never be resolved if some other process holds the lock and does not unlock it.
     * A lock may be acquired on non-existent keys. Other processes wait on non-existent key.
     * When this client puts the non-existent key, it is allowed to do that.
     * Locks are re-entrant meaning that if lock is taken N times, it should be released N times.
     * @param key
     * @param ttl lock is automatically unlocked after `ttl` milliseconds.
     * @throws {RangeError} if key is null or undefined.
     */
    lock(key: K, ttl?: number): Promise<void>;

    /**
     * Returns the keys of this map as an array.
     */
    keySet(): Promise<K[]>;

    /**
     * Queries the map based on the specified predicate and returns the keys of matching entries.
     * @param predicate
     */
    keySetWithPredicate(predicate: Predicate): Promise<K[]>;

    /**
     * Loads keys to the store.
     * @param keys loads only given keys if set.
     * @param replaceExistingValues if `true` existing keys will be replaced by newly loaded keys.
     */
    loadAll(keys?: K[], replaceExistingValues?: boolean): Promise<void>;

    /**
     * Puts specified key value association if it was not present before.
     * @param key
     * @param value
     * @param ttl if set, key will be evicted automatically after `ttl` milliseconds.
     * @throws {RangeError} if key or value is null or undefined.
     * @return old value of the entry.
     */
    putIfAbsent(key: K, value: V, ttl?: number): Promise<V>;

    /**
     * Same as {@link put} except it does not call underlying MapStore.
     * @param key
     * @param value
     * @param ttl
     * @throws {RangeError} if key or value is null or undefined.
     */
    putTransient(key: K, value: V, ttl?: number): Promise<void>;

    /**
     * Replaces value of the key if only it was associated to `oldValue`.
     * @param key
     * @param value
     * @param oldValue
     * @throws {RangeError} if key, oldValue or newValue is null or undefined.
     * @return `true` if the value was replaced.
     */
    replaceIfSame(key: K, oldValue: V, newValue: V): Promise<boolean>;

    /**
     * Replaces value of given key with `newValue`.
     * @param key
     * @param newValue
     * @throws {RangeError} if key or newValue is null or undefined.
     * @return previous value
     */
    replace(key: K, newValue: V): Promise<V>;

    /**
     * Similar to {@link put} except it does not return the old value.
     * @param key
     * @param value
     * @param ttl
     * @throws {RangeError} if key or value is null or undefined.
     */
    set(key: K, value: V, ttl?: number): Promise<void>;

    /**
     * Releases the lock for this key.
     * If this client holds the lock, hold count is decremented.
     * If hold count is zero, lock is released.
     * @throws {RangeError} if this client is not the owner of the key.
     * @param key
     */
    unlock(key: K): Promise<void>;

    /**
     * Returns a list of values contained in this map.
     */
    values(): Promise<ReadOnlyLazyList<V>>;

    /**
     * Queries the map based on the specified predicate and returns the values of matching entries.
     * Specified predicate runs on all members in parallel.
     * @param predicate
     * @return a list of values that satisfies the given predicate.
     */
    valuesWithPredicate(predicate: Predicate): Promise<ReadOnlyLazyList<V>>;

    /**
     * Returns a key-value pair representing the association of given key
     * @param key
     * @throws {RangeError} if key is null or undefined.
     */
    getEntryView(key: K): Promise<EntryView<K, V>>;

    /**
     * Tries to acquire the lock for the specified key.
     * If lock is not available, server immediately responds with {false}
     * @param key
     * @param timeout Server waits for `timeout` milliseconds to acquire the lock before giving up.
     * @param lease lock is automatically release after `lease` milliseconds.
     * @throws {RangeError} if key is null or undefined.
     */
    tryLock(key: K, timeout?: number, lease?: number): Promise<boolean>;

    /**
     * Tries to put specified key value pair into map. If this method returns
     * false, it indicates that caller thread was not able to acquire the lock for
     * given key in `timeout` milliseconds.
     * @param key
     * @param value
     * @param timeout
     * @throws {RangeError} if key or value is null or undefined.
     */
    tryPut(key: K, value: V, timeout: number): Promise<boolean>;

    /**
     * Tries to remove specified key from map. If this method returns
     * false, it indicates that caller thread was not able to acquire the lock for
     * given key in `timeout` milliseconds.
     * @param key
     * @param timeout
     * @throws {RangeError} if key is null or undefined.
     */
    tryRemove(key: K, timeout: number): Promise<boolean>;

    /**
     * Adds a {@link IMapListener} for this map.
     * @param listener
     * @param key Events are triggered for only this key if set.
     * @param includeValue Event message contains new value of the key if set to {true}.
     * @return Registration id of the listener.
     */
    addEntryListener(listener: IMapListener<K, V>, key?: K, includeValue?: boolean): Promise<string>;

    /**
     * Adds a {@link IMapListener} for this map.
     * Listener will get notified for map add/remove/update/evict events filtered by the given predicate.
     * @param listener
     * @param predicate
     * @param key Events are triggered for only this key if set.
     * @param includeValue Event message contains new value of the key if set to `true`.
     * @return Registration id of the listener.
     */
    addEntryListenerWithPredicate(listener: IMapListener<K, V>, predicate: Predicate,
                                  key?: K, includeValue?: boolean): Promise<string>;

    /**
     * Removes a {@link IMapListener} from this map.
     * @param listenerId Registration Id of the listener.
     * @return `true` if remove operation is successful, `false` if unsuccessful or this listener did not exist.
     */
    removeEntryListener(listenerId: string): Promise<boolean>;

    /**
     * Applies the user defined EntryProcessor to the all entries in the map.
     * Returns the results mapped by each key in the map
     * Note that {entryProcessor} should be registered at server side too.
     * @param entryProcessor
     * @param predicate if specified, entry processor is applied to the entries that satisfis this predicate.
     * @return entries after entryprocessor is applied.
     */
    executeOnEntries(entryProcessor: IdentifiedDataSerializable | Portable, predicate?: Predicate): Promise<[K, V][]>;

    /**
     * Applies the user defined EntryProcessor to the entry mapped by the key.
     * @param key entry processor is applied only to the value that is mapped with this key.
     * @param entryProcessor entry processor to be applied.
     * @return result of entry process.
     */
    executeOnKey(key: K, entryProcessor: IdentifiedDataSerializable | Portable): Promise<V>;

    /**
     * Applies the user defined EntryProcessor to the entries mapped by the given keys.
     *
     * @param keys keys to be processed
     * @param entryProcessor
     * @return result of entry process
     */
    executeOnKeys(keys: K[], entryProcessor: IdentifiedDataSerializable | Portable): Promise<[K, V][]>;
}
