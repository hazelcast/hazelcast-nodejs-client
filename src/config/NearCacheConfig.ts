/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {EvictionPolicy} from './EvictionPolicy';
import {InMemoryFormat} from './InMemoryFormat';

/**
 * Near Cache configuration to be used by the client for the specified IMap.
 */
export interface NearCacheConfig {

    /**
     * Enables cluster-assisted invalidate on change behavior. When set to `true`,
     * entries are invalidated when they are changed in cluster. By default, set to `true`.
     */
    invalidateOnChange?: boolean;

    /**
     * Maximum number of seconds that an entry can stay in the Near Cache until
     * it is accessed. By default, set to `0`.
     */
    maxIdleSeconds?: number;

    /**
     * Specifies in which format data will be stored in the Near Cache. Available values
     * are `OBJECT` and `BINARY`. By default, set to `BINARY`.
     */
    inMemoryFormat?: InMemoryFormat;

    /**
     * Maximum number of seconds that an entry can stay in cache. By default, set to `0`.
     */
    timeToLiveSeconds?: number;

    /**
     * Defines eviction policy configuration. Available values are `LRU`, `LFU`, `NONE`
     * and `RANDOM`. By default, set to `LRU`.
     */
    evictionPolicy?: EvictionPolicy;

    /**
     * Defines maximum number of entries kept in the memory before eviction kicks in.
     * By default, set to `Number.MAX_SAFE_INTEGER`.
     */
    evictionMaxSize?: number;

    /**
     * Number of random entries that are evaluated to see if some of them are already
     * expired. By default, set to `8`.
     */
    evictionSamplingCount?: number;

    /**
     * Size of the pool for eviction candidates. The pool is kept sorted according to
     * the eviction policy. By default, set to `16`.
     */
    evictionSamplingPoolSize?: number;

}

export class NearCacheConfigImpl implements NearCacheConfig {

    /**
     * Name of the IMap backed by the Near Cache.
     */
    name: string;
    invalidateOnChange = true;
    maxIdleSeconds = 0;
    inMemoryFormat = InMemoryFormat.BINARY;
    timeToLiveSeconds = 0;
    evictionPolicy = EvictionPolicy.LRU;
    evictionMaxSize = Number.MAX_SAFE_INTEGER;
    evictionSamplingCount = 8;
    evictionSamplingPoolSize = 16;

    toString(): string {
        return 'NearCacheConfig[' +
            'name: ' + this.name + ', ' +
            'invalidateOnChange:' + this.invalidateOnChange + ', ' +
            'inMemoryFormat: ' + this.inMemoryFormat + ', ' +
            'ttl(sec): ' + this.timeToLiveSeconds + ', ' +
            'evictionPolicy: ' + this.evictionPolicy + ', ' +
            'evictionMaxSize: ' + this.evictionMaxSize + ', ' +
            'maxIdleSeconds: ' + this.maxIdleSeconds + ']';
    }

    clone(): NearCacheConfigImpl {
        const other = new NearCacheConfigImpl();
        Object.assign(other, this);
        return other;
    }

}
