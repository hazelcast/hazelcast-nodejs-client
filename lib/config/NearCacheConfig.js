"use strict";
/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NearCacheConfigImpl = void 0;
const EvictionPolicy_1 = require("./EvictionPolicy");
const InMemoryFormat_1 = require("./InMemoryFormat");
/** @internal */
class NearCacheConfigImpl {
    constructor() {
        this.invalidateOnChange = true;
        this.maxIdleSeconds = 0;
        this.inMemoryFormat = InMemoryFormat_1.InMemoryFormat.BINARY;
        this.timeToLiveSeconds = 0;
        this.evictionPolicy = EvictionPolicy_1.EvictionPolicy.LRU;
        this.evictionMaxSize = Number.MAX_SAFE_INTEGER;
        this.evictionSamplingCount = 8;
        this.evictionSamplingPoolSize = 16;
    }
    toString() {
        return 'NearCacheConfig[' +
            'name: ' + this.name + ', ' +
            'invalidateOnChange:' + this.invalidateOnChange + ', ' +
            'inMemoryFormat: ' + this.inMemoryFormat + ', ' +
            'ttl(sec): ' + this.timeToLiveSeconds + ', ' +
            'evictionPolicy: ' + this.evictionPolicy + ', ' +
            'evictionMaxSize: ' + this.evictionMaxSize + ', ' +
            'maxIdleSeconds: ' + this.maxIdleSeconds + ']';
    }
    clone() {
        const other = new NearCacheConfigImpl();
        Object.assign(other, this);
        return other;
    }
}
exports.NearCacheConfigImpl = NearCacheConfigImpl;
//# sourceMappingURL=NearCacheConfig.js.map