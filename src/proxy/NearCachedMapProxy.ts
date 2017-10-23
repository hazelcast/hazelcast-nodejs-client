import {MapProxy} from './MapProxy';
import HazelcastClient from '../HazelcastClient';
import {NearCacheImpl, NearCache} from '../nearcache/NearCache';
import {Data} from '../serialization/Data';
import * as Promise from 'bluebird';
import {MapAddNearCacheEntryListenerCodec} from '../codec/MapAddNearCacheEntryListenerCodec';
import {EntryEventType} from '../core/EntryEventType';
import ClientMessage = require('../ClientMessage');
import {InvalidationAwareWrapper} from '../nearcache/InvalidationAwareWrapper';
import {KeyStateMarker, TrueKeyStateMarker} from '../nearcache/KeyStateMarker';
import {DataKeyedHashMap} from '../DataStoreHashMap';

export class NearCachedMapProxy<K, V> extends MapProxy<K, V> {

    private nearCache: NearCache;
    private invalidationListenerId: string;
    private keyStateMarker: KeyStateMarker;

    constructor(client: HazelcastClient, servicename: string, name: string) {
        super(client, servicename, name);
        this.nearCache = new NearCacheImpl(this.client.getConfig().nearCacheConfigs[name], this.client.getSerializationService());
        this.keyStateMarker = TrueKeyStateMarker.INSTANCE;
        if (this.nearCache.isInvalidatedOnChange()) {
            let partitionCount = client.getPartitionService().getPartitionCount();
            this.nearCache = InvalidationAwareWrapper.asInvalidationAware(this.nearCache, partitionCount);
            this.keyStateMarker = this.getKeyStateMarker();
            this.addNearCacheInvalidationListener().then((id: string) => {
                this.invalidationListenerId = id;
            });
        }
    }

    private tryToPutNearCache(key: Data, value: V | Data) {
        try {
            this.nearCache.put(key, value);
        } finally {
            this.resetToUnmarkedState(key);
        }
    }

    private resetToUnmarkedState(key: Data): void {
        if (this.keyStateMarker.unmarkIfMarked(key)) {
            return;
        }
        this.nearCache.invalidate(key);
        this.keyStateMarker.unmarkForcibly(key);
    }

    private unmarkRemainingMarkedKeys(markers: DataKeyedHashMap<boolean>): void {
        let entries: Array<[Data, boolean]> = markers.entries();
        entries.forEach((entry: [Data, any]) => {
            let marked = entry[1];
            if (marked) {
                this.keyStateMarker.unmarkForcibly(entry[0]);
            }
        });
    }

    private invalidatCacheEntryAndReturn<T>(keyData: Data, retVal: T): T {
        this.nearCache.invalidate(keyData);
        return retVal;
    }

    private invalidateCacheAndReturn<T>(retVal: T): T {
        this.nearCache.clear();
        return retVal;
    }

    getKeyStateMarker(): KeyStateMarker {
        return (<InvalidationAwareWrapper>this.nearCache).getKeyStateMarker();
    }

    clear(): Promise<void> {
        return super.clear().then<void>(this.invalidateCacheAndReturn.bind(this));
    }

    protected containsKeyInternal(keyData: Data): Promise<boolean> {
        var cachedValue = this.nearCache.get(keyData);
        if (cachedValue !== undefined) {
            return Promise.resolve(cachedValue != null);
        } else {
            return super.containsKeyInternal(keyData);
        }
    }

    protected deleteInternal(keyData: Data): Promise<void> {
        this.nearCache.invalidate(keyData);
        return super.deleteInternal(keyData).then<void>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    evictAll(): Promise<void> {
        this.nearCache.clear();
        return super.evictAll().then<void>(this.invalidateCacheAndReturn.bind(this));
    }

    protected evictInternal(key: Data): Promise<boolean> {
        return super.evictInternal(key).then<boolean>(this.invalidatCacheEntryAndReturn.bind(this, key));
    }

    protected putAllInternal(partitionsToKeysData: {[id: string]: [Data, Data][]}): Promise<void> {
        return super.putAllInternal(partitionsToKeysData).then(() => {
            for (var partition in partitionsToKeysData) {
                partitionsToKeysData[partition].forEach((entry: [Data, Data]) => {
                    this.nearCache.invalidate(entry[0]);
                });
            }
        });
    }

    protected putIfAbsentInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return super.putIfAbsentInternal(keyData, valueData, ttl).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected putTransientInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return super
            .putTransientInternal(keyData, valueData, ttl).then<void>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected executeOnKeyInternal(keyData: Data, proData: Data): Promise<V> {
        return super.executeOnKeyInternal(keyData, proData).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected putInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return super.putInternal(keyData, valueData, ttl).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected getInternal(keyData: Data): Promise<V> {
        var cachedValue = this.nearCache.get(keyData);
        if (cachedValue !== undefined) {
            return Promise.resolve(cachedValue);
        } else {
            let marked = this.keyStateMarker.markIfUnmarked(keyData);
            return super.getInternal(keyData).then((val: V) => {
                if (marked) {
                    this.tryToPutNearCache(keyData, val);
                }
                return val;
            }).catch((err: any) => {
                this.resetToUnmarkedState(keyData);
                throw err;
            });
        }
    }

    protected tryRemoveInternal(keyData: Data, timeout: number): Promise<boolean> {
        return super.tryRemoveInternal(keyData, timeout).then<boolean>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected removeInternal(keyData: Data, value: V): Promise<V> {
        return super.removeInternal(keyData, value).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected getAllInternal(partitionsToKeys: {[id: string]: any}, result: any[] = []): Promise<any[]> {
        let markers = new DataKeyedHashMap<boolean>();
        try {
            for (var partition in partitionsToKeys) {
                var partitionArray = partitionsToKeys[partition];
                for (var i = partitionArray.length - 1; i >= 0; i--) {
                    let key = partitionArray[i];
                    var cachedResult = this.nearCache.get(key);
                    if (cachedResult !== undefined) {
                        result.push([this.toObject(partitionArray[i]), cachedResult]);
                        partitionArray = partitionArray.splice(i, 1);
                    } else if (this.nearCache.isInvalidatedOnChange()) {
                        markers.set(key, this.keyStateMarker.markIfUnmarked(key));
                    }
                }
            }
        } catch (err) {
            this.unmarkRemainingMarkedKeys(markers);
            return Promise.resolve([]);
        }
        return super.getAllInternal(partitionsToKeys, result).then((serializedEntryArray: [Data, Data][]) => {
            try {
                serializedEntryArray.forEach((serializedEntry: [Data, Data]) => {
                    let key = serializedEntry[0];
                    let value = serializedEntry[1];
                    let marked = markers.get(key);
                    markers.delete(key);
                    if (marked !== undefined && marked) {
                        this.tryToPutNearCache(key, value);
                    } else if (!this.nearCache.isInvalidatedOnChange()) {
                        this.nearCache.put(key, value);
                    }
                });
            } finally {
                this.unmarkRemainingMarkedKeys(markers);
            }
            return result;
        });


    }

    protected replaceIfSameInternal(keyData: Data, oldValueData: Data, newValueData: Data): Promise<boolean> {
        return super.replaceIfSameInternal(keyData, oldValueData, newValueData)
            .then<boolean>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected replaceInternal(keyData: Data, valueData: Data): Promise<V> {
        return super.replaceInternal(keyData, valueData).then<V>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    protected setInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return super.setInternal(keyData, valueData, ttl).then<void>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }


    protected tryPutInternal(keyData: Data, valueData: Data, timeout: number): Promise<boolean> {
        return super.tryPutInternal(keyData, valueData, timeout)
            .then<boolean>(this.invalidatCacheEntryAndReturn.bind(this, keyData));
    }

    private addNearCacheInvalidationListener(): Promise<string> {
        var nearCache = this.nearCache;
        var invalidationHandler = function(keyData: Data) {
            if (keyData == null) {
                nearCache.clear();
            } else {
                nearCache.invalidate(keyData);
            }
        };
        var invalidationBatchHandler = function (keys: Array<Data>) {
            keys.forEach((key: Data) => {
                nearCache.invalidate(key);
            });
        };

        var registerEncodeFunc = (localOnly: boolean) => {
            return MapAddNearCacheEntryListenerCodec.encodeRequest(this.name, EntryEventType.INVALIDATION, localOnly);
        };
        return this.client.getListenerService().registerListener(
            registerEncodeFunc,
            (m: ClientMessage) => { MapAddNearCacheEntryListenerCodec.handle(m, invalidationHandler, invalidationBatchHandler); },
            (m: ClientMessage) => { return MapAddNearCacheEntryListenerCodec.decodeResponse(m)['response']; }
        );
    }

}
