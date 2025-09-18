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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NearCacheManager = void 0;
const NearCache_1 = require("./NearCache");
/**
 * Gets, creates, and destroys Near Caches.
 * @internal
 */
class NearCacheManager {
    constructor(clientConfig, serializationService) {
        this.clientConfig = clientConfig;
        this.serializationService = serializationService;
        this.caches = new Map();
    }
    getOrCreateNearCache(name) {
        let nearCache = this.caches.get(name);
        if (nearCache == null) {
            const config = this.clientConfig;
            nearCache = new NearCache_1.NearCacheImpl(config.getNearCacheConfig(name), this.serializationService);
            this.caches.set(name, nearCache);
        }
        return nearCache;
    }
    destroyNearCache(name) {
        const nearCache = this.caches.get(name);
        if (nearCache != null) {
            this.caches.delete(name);
            nearCache.clear();
        }
    }
    destroyAllNearCaches() {
        this.caches.forEach((cache) => {
            cache.clear();
        });
        this.caches.clear();
    }
    listAllNearCaches() {
        return Array.from(this.caches.values());
    }
    clearAllNearCaches() {
        for (const nearCache of this.listAllNearCaches()) {
            nearCache.clear();
        }
    }
}
exports.NearCacheManager = NearCacheManager;
//# sourceMappingURL=NearCacheManager.js.map