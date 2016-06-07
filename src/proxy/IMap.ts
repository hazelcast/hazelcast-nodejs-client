import * as Q from 'q';
import {DistributedObject} from '../DistributedObject';
import {EntryView} from '../core/EntryView';
import {IMapListener} from '../core/MapListener';
export interface IMap<K, V> extends DistributedObject {

    /**
     * This method checks whether the map has an item asssociated with key
     * @param key
     * @throws {RangeError} if key is undefined or null
     * @return a promise to be resolved to true if the map contains the key, false otherwise.
     */
    containsKey(key: K) : Q.Promise<boolean>;

    /**
     * This method return true if this map has key(s) associated with given value
     * @param value
     * @throws {RangeError} if value is undefined or null
     * @return a promise to be resolved to true if the map has key or keys associated with given value.
     */
    containsValue(value: V) : Q.Promise<boolean>;

    /**
     * Associates the specified value with the specified key.
     * If key was associated with another value, it replaces the old value.
     * If specified, value is evicted after ttl seconds.
     * @param key
     * @param value
     * @param ttl Time to live in milliseconds. 0 means infinite.
     * If ttl is not an integer, it is rounded up to the nearest integer value.
     * @throws {RangeError} if specified key or value is undefined or null or ttl is negative.
     * @return a promise to be resolved to the old value if there was any, `undefined` otherwise.
     */
    put(key: K, value: V, ttl?: number) : Q.Promise<V>;

    /**
     * Puts all key value pairs from this array to the map as key -> value mappings.
     * @param pairs
     */
    putAll(pairs: [K, V][]): Q.Promise<void>;

    /**
     * Retrieves the value associated with given key.
     * @param key
     * @throws {RangeError} if key is undefined or null
     * @return a promise to be resolved to the value associated with key, undefined if the key does not exist.
     */
    get(key: K) : Q.Promise<V>;

    /**
     * Retrieves key value pairs of given keys.
     * @param keys the array of keys
     */
    getAll(keys: K[]): Q.Promise<[K, V][]>;

    /**
     * Removes specified key from map. If optional value is specified, the key is removed only if currently mapped to
     * given value.
     * Note that serialized version of value is used in comparison.
     * @param key
     * @param value
     * @throws {RangeError} if key is undefined or null
     * @return a promise to be resolved to the value associated with key, `undefined` if the key did not exist before.
     */
    remove(key: K, value?: V) : Q.Promise<V>;

    /**
     * Removes specified key from map. Unlike {@link remove} this method does not return deleted value.
     * Therefore it eliminates deserialization cost of returned value.
     * @throws {RangeError} if key is null or undefined.
     * @param key
     */
    delete(key: K): Q.Promise<void>;

    /**
     * Retrieves the number of elements in map
     * @return a promise to be resolved to the number of elements in map
     */
    size() : Q.Promise<number>;

    /**
     * Removes all of the mappings
     * @return
     */
    clear() : Q.Promise<void>;

    /**
     * Returns whether this map is empty or not
     */
    isEmpty() : Q.Promise<boolean>;

    /**
     * Returns entries as an array of key-value pairs.
     */
    entrySet(): Q.Promise<[K, V][]>;

    /**
     * Evicts the specified key from this map.
     * @throws {RangeError} if key is null or undefined.
     * @param key
     */
    evict(key: K): Q.Promise<boolean>;

    /**
     * Evicts all keys from this map.
     */
    evictAll(): Q.Promise<void>;

    /**
     * If this map has a MapStore, this method flushes all local dirty entries.
     */
    flush(): Q.Promise<void>;

    /**
     * Releases the lock for the specified key regardless of the owner.
     * It always unlocks the key.
     * @throws {RangeError} if key is null or undefined.
     * @param key
     */
    forceUnlock(key: K): Q.Promise<void>;

    /**
     * Checks whether given key is locked.
     * @param key
     * @throws {RangeError} if key is null or undefined.
     * @return {true} if key is locked, {false} otherwise
     */
    isLocked(key: K): Q.Promise<boolean>;

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
    lock(key: K, ttl?: number): Q.Promise<void>;

    /**
     * Returns the keys of this map as an array.
     */
    keySet(): Q.Promise<K[]>;

    /**
     * Loads keys to the store.
     * @param keys loads only given keys if set.
     * @param replaceExistingValues if `true` existing keys will be replaced by newly loaded keys.
     */
    loadAll(keys?: K[], replaceExistingValues?: boolean): Q.Promise<void>;

    /**
     * Puts specified key value association if it was not present before.
     * @param key
     * @param value
     * @param ttl if set, key will be evicted automatically after `ttl` milliseconds.
     * @throws {RangeError} if key or value is null or undefined.
     * @return old value of the entry.
     */
    putIfAbsent(key: K, value: V, ttl?: number): Q.Promise<V>;

    /**
     * Same as {@link put} except it does not call underlying MapStore.
     * @param key
     * @param value
     * @param ttl
     * @throws {RangeError} if key or value is null or undefined.
     */
    putTransient(key: K, value: V, ttl?: number): Q.Promise<void>;

    /**
     * Replaces value of the key if only it was associated to `oldValue`.
     * @param key
     * @param value
     * @param oldValue
     * @throws {RangeError} if key, oldValue or newValue is null or undefined.
     * @return {true} if the value was replaced.
     */
    replaceIfSame(key: K, oldValue: V,  newValue: V): Q.Promise<boolean>;

    /**
     * Replaces value of given key with `newValue`.
     * @param key
     * @param newValue
     * @throws {RangeError} if key or newValue is null or undefined.
     * @return previous value
     */
    replace(key: K, newValue: V): Q.Promise<V>;

    /**
     * Similar to {@link put} except it does not return the old value.
     * @param key
     * @param value
     * @param ttl
     * @throws {RangeError} if key or value is null or undefined.
     */
    set(key: K, value: V, ttl?: number): Q.Promise<void>;

    /**
     * Releases the lock for this key.
     * If this client holds the lock, hold count is decremented.
     * If hold count is zero, lock is released.
     * @throws {RangeError} if this client is not the owner of the key.
     * @param key
     */
    unlock(key: K): Q.Promise<void>;

    /**
     * Returns an array of values contained in this map.
     */
    values(): Q.Promise<V[]>;

    /**
     * Returns a key-value pair representing the association of given key
     * @param key
     * @throws {RangeError} if key is null or undefined.
     */
    getEntryView(key: K): Q.Promise<EntryView<K, V>>;

    /**
     * Adds an index for attribute in this map.
     * @param attribute
     * @param ordered index is kept ordered if {true}, unordered otherwise.
     */
    addIndex(attribute: string, ordered: boolean): Q.Promise<void>;

    /**
     * Tries to acquire the lock for the specified key.
     * If lock is not available, server immediately responds with {false}
     * @param key
     * @param timeout Server waits for `timeout` milliseconds to acquire the lock before giving up.
     * @param lease lock is automatically release after `lease` milliseconds.
     * @throws {RangeError} if key is null or undefined.
     */
    tryLock(key: K, timeout?: number, lease?: number): Q.Promise<boolean>;

    /**
     * Tries to put specified key value pair into map. If this method returns
     * false, it indicates that caller thread was not able to acquire the lock for
     * given key in `timeout` milliseconds.
     * @param key
     * @param value
     * @param timeout
     * @throws {RangeError} if key or value is null or undefined.
     */
    tryPut(key: K, value: V, timeout: number): Q.Promise<boolean>;

    /**
     * Tries to remove specified key from map. If this method returns
     * false, it indicates that caller thread was not able to acquire the lock for
     * given key in `timeout` milliseconds.
     * @param key
     * @param timeout
     * @throws {RangeError} if key is null or undefined.
     */
    tryRemove(key: K, timeout: number): Q.Promise<boolean>;

    /**
     * Adds a {@link IMapListener} for this map.
     * @param listener
     * @param key Events are triggered for only this key if set.
     * @param includeValue Event message contains new value of the key if set to {true}.
     * @return Registration id of the listener.
     */
    addEntryListener(listener: IMapListener<K, V>, key?: K, includeValue?: boolean): Q.Promise<string>;

    /**
     * Removes a {@link IMapListener} from this map.
     * @param listenerId Registration Id of the listener.
     * @return `true` if remove operation is successful, `false` if unsuccessful or this listener did not exist.
     */
    removeEntryListener(listenerId: string): Q.Promise<boolean>;
}
