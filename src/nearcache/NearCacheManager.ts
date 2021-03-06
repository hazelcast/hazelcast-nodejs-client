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
/** @ignore *//** */

import {NearCache, NearCacheImpl} from './NearCache';
import {SerializationService} from '../serialization/SerializationService';
import {ClientConfig, ClientConfigImpl} from '../config';

/** @internal */
export class NearCacheManager {

    private readonly caches: Map<string, NearCache> = new Map();

    constructor(
        private readonly clientConfig: ClientConfig,
        protected readonly serializationService: SerializationService
    ) {}

    public getOrCreateNearCache(name: string): NearCache {
        let nearCache = this.caches.get(name);
        if (nearCache == null) {
            const config = this.clientConfig as ClientConfigImpl;
            nearCache = new NearCacheImpl(config.getNearCacheConfig(name),
                this.serializationService);
            this.caches.set(name, nearCache);
        }
        return nearCache;
    }

    public destroyNearCache(name: string): void {
        const nearCache = this.caches.get(name);
        if (nearCache != null) {
            this.caches.delete(name);
            nearCache.clear();
        }
    }

    public destroyAllNearCaches(): void {
        this.caches.forEach((cache) => {
            cache.clear();
        });
        this.caches.clear();
    }

    public listAllNearCaches(): NearCache[] {
        return Array.from(this.caches.values());
    }

    public clearAllNearCaches(): void {
        for (const nearCache of this.listAllNearCaches()) {
            nearCache.clear();
        }
    }
}
