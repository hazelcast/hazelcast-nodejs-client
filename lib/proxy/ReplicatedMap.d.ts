import * as Long from 'long';
import { EntryListener } from './EntryListener';
import { DistributedObject, ListComparator, Predicate, ReadOnlyLazyList } from '../core';
/**
 * A specialized map whose values locally stored on every node of the cluster.
 *
 * Methods that require serialization/deserialization may throw RangeError, e.g when there is no suitable
 * serializer for a certain type.
 */
export interface ReplicatedMap<K, V> extends DistributedObject {
    /**
     * Associates a given value to the specified key and replicates it to the
     * cluster. If there is an old value, it will be replaced by the specified
     * one and returned from the call.
     *
     * @param key the key of the map entry
     * @param value new value
     * @param ttl optional time to live in milliseconds. `0` means infinite.
     * @throws AssertionError if `key` or `value` is `null`
     * @returns old value if there was any, `null` otherwise
     */
    put(key: K, value: V, ttl?: number | Long): Promise<V>;
    /**
     * Wipes data out of the replicated maps. If some node fails on executing
     * the operation, it is retried for at most 5 times (on the failing nodes only).
     */
    clear(): Promise<void>;
    /**
     * Returns the value to which the specified key is mapped, or `null` if this map
     * contains no mapping for the key.
     *
     * If this map permits `null` values, then a return value of `null` does not
     * necessarily indicate that the map contains no mapping for the key; it's also
     * possible that the map explicitly maps the key to null. The {@link containsKey}
     * operation may be used to distinguish these two cases. This message is
     * idempotent.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     * @returns value associated with the specified key
     */
    get(key: K): Promise<V>;
    /**
     * Returns `true` if this map contains a mapping for the specified key. This
     * message is idempotent.
     *
     * @param key the key to search for
     * @throws AssertionError if `key` is `null`
     * @returns `true` if this map contains the specified key, `false` otherwise
     */
    containsKey(key: K): Promise<boolean>;
    /**
     * Returns `true` if this map maps one or more keys to the specified value.
     *
     * @param value the value to search for
     * @throws AssertionError if `key` is `null`
     * @returns `true` if the specified value is associated with at least one key
     */
    containsValue(value: V): Promise<boolean>;
    /**
     * Returns the number of key-value mappings in this map. If the map contains
     * more than `Integer.MAX_VALUE` (Java; 2^31-1) elements, returns
     * `Integer.MAX_VALUE`.
     *
     * @returns the number of key-value mappings in this map.
     */
    size(): Promise<number>;
    /**
     * @returns `true` if this map has no entries, `false` otherwise
     */
    isEmpty(): Promise<boolean>;
    /**
     * Removes the mapping for a key from this map if it is present.
     *
     * @param key the key of the map entry
     * @throws AssertionError if `key` is `null`
     * @returns value associated with key, `null` if the key did not exist before
     */
    remove(key: K): Promise<V>;
    /**
     * Copies all the mappings from the specified key-value pairs array to this map.
     *
     * The behavior of this operation is undefined if the specified map is modified
     * while the operation is in progress.
     *
     * @param pairs entries to be put
     */
    putAll(pairs: Array<[K, V]>): Promise<void>;
    /**
     * Returns a view of the key contained in this map.
     *
     * @returns keys of this map as an array
     */
    keySet(): Promise<K[]>;
    /**
     * Returns an eagerly populated collection view of the values contained in
     * this map.
     *
     * @param comparator optional ListComparator function to sort
     *                   the returned elements
     * @returns a list of values contained in this map
     */
    values(comparator?: ListComparator<V>): Promise<ReadOnlyLazyList<V>>;
    /**
     * Returns map entries as an array of key-value pairs.
     *
     * @returns map entries as an array of key-value pairs
     */
    entrySet(): Promise<Array<[K, V]>>;
    /**
     * Adds a continuous entry listener for this map. The listener will be notified for
     * map add/remove/update/evict events filtered by the given predicate.
     *
     * @param listener listener object
     * @param key key to restrict events to associated entry
     * @param predicate predicate
     * @returns registration id of the listener
     */
    addEntryListenerToKeyWithPredicate(listener: EntryListener<K, V>, key: K, predicate: Predicate): Promise<string>;
    /**
     * Adds a continuous entry listener for this map. The listener will be notified for
     * map add/remove/update/evict events filtered by the given predicate.
     *
     * @param listener listener object
     * @param predicate predicate
     * @returns registration id of the listener
     */
    addEntryListenerWithPredicate(listener: EntryListener<K, V>, predicate: Predicate): Promise<string>;
    /**
     * Adds the specified entry listener for the specified key. The listener will be
     * notified for all add/remove/update/evict events of the specified key only.
     *
     * @param listener listener object
     * @param key key to restrict events to associated entry
     * @returns Registration id of the listener.
     */
    addEntryListenerToKey(listener: EntryListener<K, V>, key: K): Promise<string>;
    /**
     * Adds an entry listener for this map. The listener will be notified for all
     * map add/remove/update/evict events.
     *
     * @param listener
     * @returns registration id of the listener
     */
    addEntryListener(listener: EntryListener<K, V>): Promise<string>;
    /**
     * Removes the specified entry listener. Returns silently if there was no such
     * listener added before. This message is idempotent.
     *
     * @param listenerId registration id of the listener
     * @returns `true` if remove operation is successful, `false` if unsuccessful
     *          or this listener did not exist
     */
    removeEntryListener(listenerId: string): Promise<boolean>;
}
