///<reference path="../typings/q/Q.d.ts" />
import Promise = Q.Promise;
import {DistributedObject} from './DistributedObject';
export interface IMap<K, V> extends DistributedObject {

    /**
     * This method checks whether the map has an item asssociated with key
     * @param key
     * @throws {Error} if key is undefined or null
     * @return a promise to be resolved to true if the map contains the key, false otherwise.
     */
    containsKey(key: K) : Promise<boolean>;

    /**
     * This method return true if this map has key(s) associated with given value
     * @throws {Error} if value is undefined or null
     * @param value
     * @return a promise to be resolved to true if the map has key or keys associated with given value.
     */
    containsValue(value: V) : Promise<boolean>;

    /**
     * Associates the specified value with the specified key.
     * If key was associated with another value, it replaces the old value.
     * If specified, value is evicted after ttl seconds.
     * @param key
     * @param value
     * @param ttl Time to live in seconds. 0 means infinite.
     * If ttl is not an integer, it is rounded up to the nearest integer value.
     * @throws {Error} if specified key or value is undefined or null or ttl is negative.
     * @return a promise to be resolved to the old value if there was any, undefined otherwise.
     */
    put(key: K, value: V, ttl?: number) : Promise<V>;

    /**
     * Retrieves the value associated with given key.
     * @param key
     * @throws {Error} if key is undefined or null
     * @return a promise to be resolved to the value associated with key, undefined if the key does not exist.
     */
    get(key: K) : Promise<V>;

    /**
     * Removes specified key from map. If optional value is specified, the key is removed only if currently mapped to
     * given value.
     * Note that serialized version of value is used in comparison.
     * @param key
     * @param value
     * @throws {Error} if key is undefined or null
     * @return a promise to be resolved to the value associated with key, undefined if the key did not exist before.
     */
    remove(key: K, value?: V) : Promise<V>;

    /**
     * Retrieves the number of elements in map
     * @return a promise to be resolved to the number of elements in map
     */
    size() : Promise<number>;

    /**
     * Removes all of the mappings
     * @return
     */
    clear() : Promise<void>;
}
