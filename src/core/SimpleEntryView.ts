/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import * as Long from 'long';

/**
 * Represents a view of a map entry.
 */
export class SimpleEntryView<K, V> {

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
     * Last time the value was flushed to mapstore.
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

    /** @internal */
    constructor(key: K, value: V, cost: Long, creationTime: Long,
                expirationTime: Long, hits: Long, lastAccessTime: Long,
                lastStoredTime: Long, lastUpdateTime: Long, version: Long,
                ttl: Long, maxIdle: Long) {
        this.key = key;
        this.value = value;
        this.cost = cost;
        this.creationTime = creationTime;
        this.expirationTime = expirationTime;
        this.hits = hits;
        this.lastAccessTime = lastAccessTime;
        this.lastStoredTime = lastStoredTime;
        this.lastUpdateTime = lastUpdateTime;
        this.version = version;
        this.ttl = ttl;
        this.maxIdle = maxIdle;
    }

}
