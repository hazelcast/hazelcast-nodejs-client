/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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

import {NearCache, NearCacheStatistics} from './NearCache';
import {Data} from '../serialization/Data';
import {KeyStateMarker, KeyStateMarkerImpl} from './KeyStateMarker';
import {StaleReadDetector} from './StaleReadDetector';
export class InvalidationAwareWrapper implements NearCache {
    private nearCache: NearCache;
    private keyStateMarker: KeyStateMarker;

    public static asInvalidationAware(nearCache: NearCache, markerCount: number): InvalidationAwareWrapper {
        return new InvalidationAwareWrapper(nearCache, markerCount);
    }

    private constructor(nearCache: NearCache, markerCount: number) {
        this.nearCache = nearCache;
        this.keyStateMarker = new KeyStateMarkerImpl(markerCount);
    }

    put(key: Data, value: any): void {
        return this.nearCache.put(key, value);
    }

    get(key: Data): Data|any {
        return this.nearCache.get(key);
    }

    invalidate(key: Data): void {
        this.keyStateMarker.removeIfMarked(key);
        return this.nearCache.invalidate(key);
    }

    clear(): void {
        this.keyStateMarker.unmarkAllForcibly();
        return this.nearCache.clear();
    }

    getStatistics(): NearCacheStatistics {
        return this.nearCache.getStatistics();
    }

    isInvalidatedOnChange(): boolean {
        return this.nearCache.isInvalidatedOnChange();
    }

    getKeyStateMarker(): KeyStateMarker {
        return this.keyStateMarker;
    }

    setStaleReadDetector(detector: StaleReadDetector): void {
        this.nearCache.setStaleReadDetector(detector);
    }
}
