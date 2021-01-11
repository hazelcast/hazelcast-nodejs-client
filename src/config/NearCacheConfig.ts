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

import {EvictionPolicy} from './EvictionPolicy';
import {InMemoryFormat} from './InMemoryFormat';

export class NearCacheConfig {
    name: string = 'default';
    /**
     * 'true' to invalidate entries when they are changed in cluster,
     * 'false' to invalidate entries only when they are accessed.
     */
    invalidateOnChange: boolean = true;
    /**
     * Max number of seconds that an entry can stay in the cache until it is acceessed
     */
    maxIdleSeconds: number = 0;
    inMemoryFormat: InMemoryFormat = InMemoryFormat.BINARY;
    /**
     * Maximum number of seconds that an entry can stay in cache.
     */
    timeToLiveSeconds: number = 0;
    evictionPolicy: EvictionPolicy = EvictionPolicy.NONE;
    evictionMaxSize: number = Number.MAX_SAFE_INTEGER;
    evictionSamplingCount: number = 8;
    evictionSamplingPoolSize: number = 16;

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

    clone(): NearCacheConfig {
        const other = new NearCacheConfig();
        Object.assign(other, this);
        return other;
    }
}
