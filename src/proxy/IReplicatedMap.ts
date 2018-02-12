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
import {Predicate} from '../core/Predicate';
import {IMapListener} from '../core/MapListener';
import Long = require('long');
import {ArrayComparator} from '../util/ArrayComparator';

export interface IReplicatedMap<K, V> extends DistributedObject {
    /**
     * Associates a given value to the specified key and replicates it to the
     * cluster. If there is an old value, it will be replaced by the specified
     * one and returned from the call.
     *
     * @param key key with which the specified value is to be associated.
     * @param value value to be associated with the specified key.
     * @param ttl milliseconds to be associated with the specified key-value pair.
     * @return old value if there was any, `null` otherwise.
     */
    put(key: K, value: V, ttl?: Long|number): Promise<V>;

    /**
     * The clear operation wipes data out of the replicated maps.
     * If some node fails on executing the operation, it is retried for at most
     * 5 times (on the failing nodes only).
     * @return
     */
    clear(): Promise<void>;

    /**
     * Returns the value to which the specified key is mapped, or null if this map
     * contains no mapping for the key.
     *
     * If this map permits null values, then a return value of null does not
     * necessarily indicate that the map contains no mapping for the key; it's also
     * possible that the map explicitly maps the key to null. The #containsKey
     * operation may be used to distinguish these two cases. This message is
     * idempotent.
     *
     * @param key key to search for.
     * @return value associated with the specified key.
     */
    get(key: K): Promise<V>;


    /**
     * Returns true if this map contains a mapping for the specified key. This message is idempotent.
     *
     * @param key key to search for.
     * @return `true` if this map contains the specified key, `false` otherwise.
     */
    containsKey(key: K): Promise<boolean>;

    /**
     * Returns true if this map maps one or more keys to the specified value.
     *
     * @param value value to search for.
     * @return `true` if the specified value is associated with at least one key.
     */
    containsValue(value: V): Promise<boolean>;

    /**
     * If the map contains more than Integer.MAX_VALUE elements, returns Integer.MAX_VALUE.
     * @return Returns the number of key-value mappings in this map.
     */
    size(): Promise<number>;

    /**
     * @return `true` if this map has no entries, `false` otherwise.
     */
    isEmpty(): Promise<boolean>;

    /**
     * Removes the mapping for a key from this map if it is present (optional operation).
     * Returns the value to which this map previously associated the key,
     * or null if the map contained no mapping for the key. If this map permits null values,
     * then a return value of null does not necessarily indicate that the map contained
     * no mapping for the key; it's also possible that the map explicitly mapped the key to null.
     * The map will not contain a mapping for the specified key once the call returns.
     *
     * @param key key to remove.
     * @return value associated with key, `null` if the key did not exist before.
     */
    remove(key: K): Promise<V>;

    /**
     * Copies all of the mappings from the specified key-value pairs array to this map
     * (optional operation).
     * The effect of this call is equivalent to that of calling put(Object,Object)
     * put(k, v) on this map once for each mapping from key k to value v in the specified
     * map. The behavior of this operation is undefined if the specified map is modified
     * while the operation is in progress
     *
     * @param pairs
     * @return
     */
    putAll(pairs: [K, V][]): Promise<void>;

    /**
     * Returns a view of the key contained in this map.
     *
     * @return keys of this map as an array.
     */
    keySet(): Promise<K[]>;

    /**
     * @return Returns an array of values contained in this map.
     */
    values(comparator?: ArrayComparator<V>): Promise<V[]>;

    /**
     * @return Returns entries as an array of key-value pairs.
     */
    entrySet(): Promise<[K, V][]>;

    /**
     * Adds an continuous entry listener for this map. The listener will be notified for
     * map add/remove/update/evict events filtered by the given predicate.
     *
     * @param listener
     * @param key
     * @param predicate
     * @param localOnly
     * @return Registration id of the listener.
     */
    addEntryListenerToKeyWithPredicate(listener: IMapListener<K, V>, key: K, predicate: Predicate): Promise<string>;

    /**
     * Adds an continuous entry listener for this map. The listener will be notified for
     * map add/remove/update/evict events filtered by the given predicate.
     *
     * @param listener
     * @param predicate
     * @return Registration id of the listener.
     */
    addEntryListenerWithPredicate(listener: IMapListener<K, V>, predicate: Predicate): Promise<string>;

    /**
     * Adds the specified entry listener for the specified key. The listener will be
     * notified for all add/remove/update/evict events of the specified key only.
     *
     * @param listener
     * @param key
     * @return Registration id of the listener.
     */
    addEntryListenerToKey(listener: IMapListener<K, V>, key: K): Promise<string>;

    /**
     * Adds an entry listener for this map. The listener will be notified for all
     * map add/remove/update/evict events.
     *
     * @param listener
     * @return Registration id of the listener.
     */
    addEntryListener(listener: IMapListener<K, V>): Promise<string>;

    /**
     * Removes the specified entry listener. Returns silently if there was no such
     * listener added before. This message is idempotent.
     *
     * @param listenerId
     * @return `true` if remove operation is successful, `false` if unsuccessful or this listener did not exist.
     */
    removeEntryListener(listenerId: string): Promise<boolean>;
}
