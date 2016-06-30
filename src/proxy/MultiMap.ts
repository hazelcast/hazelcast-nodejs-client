import * as Promise from 'bluebird';
import {DistributedObject} from '../DistributedObject';
import {IMapListener} from '../core/MapListener';

export interface MultiMap<K, V> extends DistributedObject {

    /**
     * Adds a key-value pair to this multi-map.
     * If this multi-map already has some value associated with the specified key, then calling this method
     * will not replace the old value. Instead, both values will be associated with the same key.
     * @param key key to add.
     * @param value value to associate with the key.
     * @return `true` if this multi-map did not have the specified value associated
     * with the specified key, `false` otherwise.
     */
    put(key: K, value: V): Promise<boolean>;

    /**
     * Retrieves a list of values associated with the specified key.
     * @param key key to search for.
     * @return array of values associated with the specified key.
     */
    get(key: K): Promise<Array<V>>;

    /**
     * Removes an association of the specified value with the specified key. Calling this method does not affect
     * other values associated with the same key.
     * @param key key from which the value should be detached.
     * @param value value to be removed.
     * @return `true` if the value was detached from the specified key, `false` if it was not.
     */
    remove(key: K, value: V): Promise<boolean>;

    /**
     * Detaches all values from the specified key.
     * @param key key from which all entries should be removed.
     * @return an array of old values that were associated with this key prior to this method call.
     */
    removeAll(key: K): Promise<Array<V>>;

    /**
     * @return an array of all keys in this multi-map.
     */
    keySet(): Promise<Array<K>>;

    /**
     * @return a flat array of all values stored in this multi-map.
     */
    values(): Promise<Array<V>>;

    /**
     * Returns all entries in this multi-map. If a certain key has multiple values associated with it,
     * then one pair will be returned for each value.
     * @return an array of all key value pairs stored in this multi-map.
     */
    entrySet(): Promise<Array<[K, V]>>;

    /**
     * Checks if this multi-map contains a specified key.
     * @param key key to search for.
     * @returns `true` if this map contains the specified key, `false` otherwise.
     */
    containsKey(key: K): Promise<boolean>;

    /**
     * @param value value to search for.
     * @return `true` if the specified value is associated with at least one key in this multi-map,
     * `false` otherwise.
     */
    containsValue(value: V): Promise<boolean>;

    /**
     * @param key key to match against.
     * @param value value to match against.
     * @return `true` if this multi-map has an association between
     * the specified key and the specified value, `false` otherwise.
     */
    containsEntry(key: K, value: V): Promise<boolean>;

    /**
     * @return the total number of values in this multi-map. 
     */
    size(): Promise<number>;

    /**
     * Removes all entries from this multi-map.
     */
    clear(): Promise<void>;

    /**
     * @param key key to search for.
     * @return the number of values associated with the specified key.
     */
    valueCount(key: K): Promise<number>;

    /**
     * Adds an entry listener to this multi-map.
     * @param listener entry listener to be attached
     * @param key if specified then this entry listener will only be notified of updates related to this key.
     * @param includeValue if `true`, then the event will include the modified value.
     * @return registration ID for this entry listener
     */
    addEntryListener(listener: IMapListener<K, V>, key?: K, includeValue?: boolean): Promise<string>;

    /**
     * Removes the entry listener by the registration ID.
     * @param listenerId registration ID that was returned when this listener was added.
     */
    removeEntryListener(listenerId: string): Promise<boolean>;

    /**
     * Locks the specified key.
     * If the specified key cannot be locked immediately, then the returned Promise will be resolved
     * only when the lock becomes available.
     * All attempts to access the locked key will block until the lock is released.
     *
     * Locking is reentrant, meaning that the lock owner can obtain the lock multiple times.
     * If the lock was acquired multiple times, then `unlock` method must be called the same amount of
     * times, otherwise the lock will remain unavailable.
     *
     * If lease time is specified, then the lock will automatically become available
     * after the specified time has passed.
     * If lease time is not specified or is less than zero,
     * then lock owner must call `unlock` to make the lock available.
     * @param key key to be locked.
     * @param leaseMillis lease time in milliseconds.
     */
    lock(key: K, leaseMillis?: number): Promise<void>;

    /**
     * @param key key to be checked
     * @return `true` if this key is locked, `false` otherwise
     */
    isLocked(key: K): Promise<boolean>;

    /**
     * Attempts to acquire the lock for the specified key within the specified timeout.
     * The returned promise will be returned either when the lock becomes available
     * or when the timeout is reached.
     *
     * If the specified key cannot be locked immediately, then the returned Promise will be resolved
     * only when the lock becomes available.
     * All attempts to access the locked key will block until the lock is released.
     *
     * Locking is reentrant, meaning that the lock owner can obtain the lock multiple times.
     * If the lock was acquired multiple times, then `unlock` method must be called the same amount of
     * times, otherwise the lock will remain unavailable.
     *
     * If lease time is specified, then the lock will automatically become available
     * after the specified time has passed.
     * If lease time is not specified or is less than zero,
     * then lock owner must call `unlock` to make the lock available.
     * @param key key to be locked
     * @param timeoutMillis timeout for locking, in milliseconds
     * @param leaseMillis lease time in milliseconds
     */
    tryLock(key: K, timeoutMillis?: number, leaseMillis?: number): Promise<boolean>;

    /**
     * Unlocks the specified key
     * @param key key to be unlocked
     */
    unlock(key: K): Promise<void>;

    /**
     * Forcefully unlocks the specified key, disregarding the acquisition count.
     * This in contrast to the regular `unlock`, which has to be called the same amount of times as
     * the lock was acquired.
     * @param key key to be unlocked.
     */
    forceUnlock(key: K): Promise<void>;
}
