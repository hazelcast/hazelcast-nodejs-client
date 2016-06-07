import {BaseProxy} from './BaseProxy';
import {IMap} from './IMap';
import * as Q from 'q';
import {Data} from '../serialization/Data';
import {MapPutCodec} from '../codec/MapPutCodec';
import ClientMessage = require('../ClientMessage');
import murmur = require('../invocation/Murmur');
import {MapGetCodec} from '../codec/MapGetCodec';
import {MapClearCodec} from '../codec/MapClearCodec';
import {MapSizeCodec} from '../codec/MapSizeCodec';
import {MapRemoveCodec} from '../codec/MapRemoveCodec';
import {MapRemoveIfSameCodec} from '../codec/MapRemoveIfSameCodec';
import {MapContainsKeyCodec} from '../codec/MapContainsKeyCodec';
import {MapContainsValueCodec} from '../codec/MapContainsValueCodec';
import {MapIsEmptyCodec} from '../codec/MapIsEmptyCodec';
import {MapPutAllCodec} from '../codec/MapPutAllCodec';
import defer = Q.defer;
import {MapDeleteCodec} from '../codec/MapDeleteCodec';
import {MapEntrySetCodec} from '../codec/MapEntrySetCodec';
import {MapEvictCodec} from '../codec/MapEvictCodec';
import {MapEvictAllCodec} from '../codec/MapEvictAllCodec';
import {MapFlushCodec} from '../codec/MapFlushCodec';
import {MapLockCodec} from '../codec/MapLockCodec';
import {MapIsLockedCodec} from '../codec/MapIsLockedCodec';
import {MapUnlockCodec} from '../codec/MapUnlockCodec';
import {MapForceUnlockCodec} from '../codec/MapForceUnlockCodec';
import {MapKeySetCodec} from '../codec/MapKeySetCodec';
import {MapLoadAllCodec} from '../codec/MapLoadAllCodec';
import {MapPutIfAbsentCodec} from '../codec/MapPutIfAbsentCodec';
import {MapPutTransientCodec} from '../codec/MapPutTransientCodec';
import {MapReplaceCodec} from '../codec/MapReplaceCodec';
import {MapReplaceIfSameCodec} from '../codec/MapReplaceIfSameCodec';
import {MapSetCodec} from '../codec/MapSetCodec';
import {MapValuesCodec} from '../codec/MapValuesCodec';
import {MapLoadGivenKeysCodec} from '../codec/MapLoadGivenKeysCodec';
import {MapGetAllCodec} from '../codec/MapGetAllCodec';
import {MapGetEntryViewCodec} from '../codec/MapGetEntryViewCodec';
import {EntryView} from '../core/EntryView';
import {MapAddIndexCodec} from '../codec/MapAddIndexCodec';
import {MapTryLockCodec} from '../codec/MapTryLockCodec';
import {MapTryPutCodec} from '../codec/MapTryPutCodec';
import {MapTryRemoveCodec} from '../codec/MapTryRemoveCodec';
import {IMapListener} from '../core/MapListener';
import {MapAddEntryListenerCodec} from '../codec/MapAddEntryListenerCodec';
import {EntryEventType} from '../core/EntryEventType';
import {MapAddEntryListenerToKeyCodec} from '../codec/MapAddEntryListenerToKeyCodec';
import {MapRemoveEntryListenerCodec} from '../codec/MapRemoveEntryListenerCodec';
import {assertNotNull} from '../Util';
export class MapProxy<K, V> extends BaseProxy implements IMap<K, V> {
    containsKey(key: K): Q.Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapContainsKeyCodec, keyData, keyData, 0);
    }

    containsValue(value: V): Q.Promise<boolean> {
        assertNotNull(value);
        var valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget<boolean>(MapContainsValueCodec, valueData);
    }

    put(key: K, value: V, ttl: number = -1): Q.Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData: Data = this.toData(key);
        var valueData: Data = this.toData(value);
        return this.encodeInvokeOnKey<V>(MapPutCodec, keyData, keyData, valueData, 0, ttl);
    }

    putAll(pairs: [K, V][]): Q.Promise<void> {
        var partitionService = this.client.getPartitionService();
        var partitionsToKeys: {[id: string]: any} = {};
        var pair: [K, V];
        var pairId: string;
        for (pairId in pairs) {
            pair = pairs[pairId];
            var keyData = this.toData(pair[0]);
            var pId: number = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push({key: keyData, val: this.toData(pair[1])});
        }

        var partitionPromises: Q.Promise<void>[] = [];
        for (var partition in partitionsToKeys) {
            partitionPromises.push(
                this.encodeInvokeOnPartition<void>(MapPutAllCodec, Number(partition), partitionsToKeys[partition])
            );
        }
        var deferred = Q.defer<void>();
        Q.all(partitionPromises)
            .then(function() {
                deferred.resolve();
            });
        return deferred.promise;
    }

    get(key: K): Q.Promise<V> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<V>(MapGetCodec, keyData, keyData, 0);
    }

    remove(key: K, value: V = null): Q.Promise<V> {
        assertNotNull(key);
        var keyData = this.toData(key);
        if (value == null) {
            return this.encodeInvokeOnKey<V>(MapRemoveCodec, keyData, keyData, 0);
        } else {
            var valueData = this.toData(value);
            return this.encodeInvokeOnKey<V>(MapRemoveIfSameCodec, keyData, keyData, valueData, 0);
        }
    }

    size(): Q.Promise<number> {
        return this.encodeInvokeOnRandomTarget<number>(MapSizeCodec);
    }

    clear(): Q.Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapClearCodec);
    }

    isEmpty(): Q.Promise<boolean> {
        return this.encodeInvokeOnRandomTarget<boolean>(MapIsEmptyCodec);
    }

    getAll(keys: K[]): Q.Promise<any[]> {
        var partitionService = this.client.getPartitionService();
        var partitionsToKeys: {[id: string]: any} = {};
        var key: K;
        for (var i in keys) {
            key = keys[i];
            var keyData = this.toData(key);
            var pId: number = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push(keyData);
        }

        var partitionPromises: Q.Promise<[Data, Data][]>[] = [];
        for (var partition in partitionsToKeys) {
            partitionPromises.push(this.encodeInvokeOnPartition<[Data, Data][]>(
                MapGetAllCodec,
                Number(partition),
                partitionsToKeys[partition])
            );
        }
        var toObject = this.toObject.bind(this);
        var deserializeEntry = function(entry: [Data, Data]) {
            return [toObject(entry[0]), toObject(entry[1])];
        };
        return Q.all(partitionPromises).then(function(serializedEntryArrayArray: [Data, Data][][]) {
            return Array.prototype.concat.apply([], serializedEntryArrayArray).map(deserializeEntry);
        });
    }

    delete(key: K): Q.Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapDeleteCodec, keyData, keyData, 0);
    }

    entrySet(): Q.Promise<any[]> {
        var deserializedSet: [K, V][] = [];
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget(MapEntrySetCodec).then(function(entrySet: [Data, Data][]) {
            entrySet.forEach(function(entry) {
                deserializedSet.push([toObject(entry[0]), toObject(entry[1])]);
            });
            return deserializedSet;
        });
    }

    evict(key: K) : Q.Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapEvictCodec, keyData, keyData, 0);
    }

    evictAll(): Q.Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapEvictAllCodec);
    }

    flush(): Q.Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapFlushCodec);
    }

    lock(key: K, ttl: number = -1): Q.Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapLockCodec, keyData, keyData, 0, ttl);
    }

    isLocked(key: K): Q.Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapIsLockedCodec, keyData, keyData);
    }

    unlock(key: K): Q.Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapUnlockCodec, keyData, keyData, 0);
    }

    forceUnlock(key: K): Q.Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapForceUnlockCodec, keyData, keyData);
    }

    keySet(): Q.Promise<K[]> {
        var deserializedSet: K[] = [];
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget<K[]>(MapKeySetCodec).then(function(entrySet) {
            entrySet.forEach(function(entry) {
                deserializedSet.push(toObject(entry));
            });
            return deserializedSet;
        });
    }

    loadAll(keys: K[] = null, replaceExistingValues: boolean = true): Q.Promise<void> {
        assertNotNull(keys);
        if (keys == null) {
            return this.encodeInvokeOnRandomTarget<void>(MapLoadAllCodec, replaceExistingValues);
        } else {
            var toData = this.toData.bind(this);
            var keysData: Data[] = keys.map<Data>(toData);
            return this.encodeInvokeOnRandomTarget<void>(MapLoadGivenKeysCodec, keysData, replaceExistingValues);
        }
    }

    putIfAbsent(key: K, value: V, ttl: number = -1): Q.Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<V>(MapPutIfAbsentCodec, keyData, keyData, valueData, 0, ttl);
    }

    putTransient(key: K, value: V, ttl: number = -1): Q.Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<void>(MapPutTransientCodec, keyData, keyData, valueData, 0, ttl);
    }

    replace(key: K, newValue: V): Q.Promise<V> {
        assertNotNull(key);
        assertNotNull(newValue);
        var keyData = this.toData(key);
        var newValueData = this.toData(newValue);
        return this.encodeInvokeOnKey<V>(MapReplaceCodec, keyData, keyData, newValueData, 0);
    }

    replaceIfSame(key: K, oldValue: V, newValue: V): Q.Promise<boolean> {
        assertNotNull(key);
        assertNotNull(oldValue);
        assertNotNull(newValue);
        var keyData = this.toData(key);
        var newValueData = this.toData(newValue);
        var oldValueData = this.toData(oldValue);
        return this.encodeInvokeOnKey<boolean>(MapReplaceIfSameCodec, keyData, keyData, oldValueData, newValueData, 0);
    }

    set(key: K, value: V, ttl: number = -1): Q.Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<void>(MapSetCodec, keyData, keyData, valueData, 0, ttl);
    }

    values(): Q.Promise<V[]> {
        var values: V[] = [];
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget<V[]>(MapValuesCodec).then(function(valuesData) {
            valuesData.forEach(function(valueData) {
                values.push(toObject(valueData));
            });
            return values;
        });
    }

    getEntryView(key: K): Q.Promise<EntryView<K, V>> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<EntryView<K, V>>(MapGetEntryViewCodec, keyData, keyData, 0);
    }

    addIndex(attribute: string, ordered: boolean): Q.Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapAddIndexCodec, attribute, ordered);
    }

    tryLock(key: K, timeout: number = 0, lease: number = -1): Q.Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapTryLockCodec, keyData, keyData, 0, lease, timeout);
    }

    tryPut(key: K, value: V, timeout: number): Q.Promise<boolean> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<boolean>(MapTryPutCodec, keyData, keyData, valueData, value, 0, timeout);
    }

    tryRemove(key: K, timeout: number): Q.Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapTryRemoveCodec, keyData, keyData, 0, timeout);
    }

    addEntryListener(listener: IMapListener<K, V>, key: K = undefined, includeValue: boolean = false): Q.Promise<string> {
        var flags: any = null;
        var conversionTable: {[funcName: string]: EntryEventType} = {
            'added': EntryEventType.ADDED,
            'removed': EntryEventType.REMOVED,
            'updated': EntryEventType.UPDATED,
            'merged': EntryEventType.MERGED,
            'evicted': EntryEventType.EVICTED,
            'evictedAll': EntryEventType.EVICT_ALL,
            'clearedAll': EntryEventType.CLEAR_ALL
        };
        for (var funcName in conversionTable) {
            if (listener[funcName]) {
                /* tslint:disable:no-bitwise */
                flags = flags | conversionTable[funcName];
            }
        }
        var toObject = this.toObject.bind(this);
        var entryEventHandler = function(
            key: K, val: V, oldVal: V, mergingVal: V, event: number, uuid: string, numberOfAffectedEntries: number
        ) {
            var eventParams: any[] = [key, oldVal, val, mergingVal, numberOfAffectedEntries, uuid];
            eventParams = eventParams.map((val) => {if (val === undefined) { return null; } else { return val; } });
            switch (event) {
                case EntryEventType.ADDED:
                    listener.added.apply(null, eventParams);
                    break;
                case EntryEventType.REMOVED:
                    listener.removed.apply(null, eventParams);
                    break;
                case EntryEventType.UPDATED:
                    listener.updated.apply(null, eventParams);
                    break;
                case EntryEventType.EVICTED:
                    listener.evicted.apply(null, eventParams);
                    break;
                case EntryEventType.EVICT_ALL:
                    listener.evictedAll.apply(null, eventParams);
                    break;
                case EntryEventType.CLEAR_ALL:
                    listener.clearedAll.apply(null, eventParams);
                    break;
                case EntryEventType.MERGED:
                    listener.merged.apply(null, eventParams);
                    break;
            }
        };
        var request: ClientMessage;
        if (key !== undefined) {
            var keyData = this.toData(key);
            request = MapAddEntryListenerToKeyCodec.encodeRequest(this.name, keyData, includeValue, flags, false);
            return this.client.getListenerService().registerListener(
                request,
                (m: ClientMessage) => {MapAddEntryListenerToKeyCodec.handle(m, entryEventHandler, toObject); },
                MapAddEntryListenerToKeyCodec.decodeResponse,
                keyData
            );
        } else {
            request = MapAddEntryListenerCodec.encodeRequest(this.name, includeValue, flags, false);
            return this.client.getListenerService().registerListener(
                request,
                (m: ClientMessage) => {MapAddEntryListenerCodec.handle(m, entryEventHandler, toObject); },
                MapAddEntryListenerCodec.decodeResponse
            );
        }
    }

    removeEntryListener(listenerId: string): Q.Promise<boolean> {
        return this.client.getListenerService().deregisterListener(
            MapRemoveEntryListenerCodec.encodeRequest(this.name, listenerId),
            MapRemoveEntryListenerCodec.decodeResponse
        );
    }
}
