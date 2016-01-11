///<reference path="../typings/q/Q.d.ts" />
import Promise = Q.Promise;
export interface MapInterface<K, V> {

    /**
     * This method checks whether the map has an item asssociated with key
     * @param key
     * @throws {Error} if key is undefined or null
     * @return a promise to be resolved to true if the map contains the key, false otherwise.
     */
    containsKey(key: K) : Promise<boolean>;

    /**
     * Associates the specified value with the specified key.
     * If key was associated with another value, it replaces the old value.
     * @param key
     * @param value
     * @throws {Error} if specified key or value is undefined or null
     * @return a promise to be resolved to the old value if there was any, undefined otherwise.
     */
    put(key: K, value: V) : Promise<V>;

    /**
     * Retrieves the value associated with given key.
     * @param key
     * @throws {Error} if key is undefined or null
     * @return a promise to be resolved to the value associated with key, undefined if the key does not exist.
     */
    get(key: K) : Promise<V>;

    /**
     * Removes specified key from map
     * @param key
     * @throws {Error} if key is undefined or null
     * @return a promise to be resolved to the value associated with key, undefined if the key did not exist before.
     */
    remove(key: K) : Promise<V>;

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
