import {NearCache, NearCacheStatistics} from './NearCache';
import {Data} from '../serialization/Data';
import {KeyStateMarker, KeyStateMarkerImpl} from './KeyStateMarker';
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
}
