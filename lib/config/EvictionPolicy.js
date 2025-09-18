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
exports.EvictionPolicy = void 0;
/**
 * Represents the format that objects are kept in this client's memory.
 */
var EvictionPolicy;
(function (EvictionPolicy) {
    /**
     * No items are evicted.
     */
    EvictionPolicy["NONE"] = "NONE";
    /**
     * Least Recently Used.
     */
    EvictionPolicy["LRU"] = "LRU";
    /**
     * Least Frequently Used.
     */
    EvictionPolicy["LFU"] = "LFU";
    /**
     * A random item is evicted each time.
     */
    EvictionPolicy["RANDOM"] = "RANDOM";
})(EvictionPolicy = exports.EvictionPolicy || (exports.EvictionPolicy = {}));
//# sourceMappingURL=EvictionPolicy.js.map