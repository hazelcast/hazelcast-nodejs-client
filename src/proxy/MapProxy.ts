/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {BaseProxy} from './BaseProxy';
import {IMap} from './IMap';
import * as Promise from '../PromiseWrapper';
import {Data} from '../serialization/Data';
import {MapPutCodec} from '../codec/MapPutCodec';
import {MapGetCodec} from '../codec/MapGetCodec';
import {MapClearCodec} from '../codec/MapClearCodec';
import {MapSizeCodec} from '../codec/MapSizeCodec';
import {MapRemoveCodec} from '../codec/MapRemoveCodec';
import {MapRemoveIfSameCodec} from '../codec/MapRemoveIfSameCodec';
import {MapContainsKeyCodec} from '../codec/MapContainsKeyCodec';
import {MapContainsValueCodec} from '../codec/MapContainsValueCodec';
import {MapIsEmptyCodec} from '../codec/MapIsEmptyCodec';
import {MapPutAllCodec} from '../codec/MapPutAllCodec';
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
import {assertArray, assertNotNull, getSortedQueryResultSet} from '../Util';
import {IterationType, Predicate} from '../core/Predicate';
import {MapEntriesWithPredicateCodec} from '../codec/MapEntriesWithPredicateCodec';
import {MapKeySetWithPredicateCodec} from '../codec/MapKeySetWithPredicateCodec';
import {MapValuesWithPredicateCodec} from '../codec/MapValuesWithPredicateCodec';
import {MapAddEntryListenerToKeyWithPredicateCodec} from '../codec/MapAddEntryListenerToKeyWithPredicateCodec';
import {MapAddEntryListenerWithPredicateCodec} from '../codec/MapAddEntryListenerWithPredicateCodec';
import {PagingPredicate} from '../serialization/DefaultPredicates';
import {MapValuesWithPagingPredicateCodec} from '../codec/MapValuesWithPagingPredicateCodec';
import {MapKeySetWithPagingPredicateCodec} from '../codec/MapKeySetWithPagingPredicateCodec';
import {IdentifiedDataSerializable, Portable} from '../serialization/Serializable';
import {MapExecuteOnAllKeysCodec} from '../codec/MapExecuteOnAllKeysCodec';
import {MapExecuteWithPredicateCodec} from '../codec/MapExecuteWithPredicateCodec';
import {MapExecuteOnKeyCodec} from '../codec/MapExecuteOnKeyCodec';
import {MapExecuteOnKeysCodec} from '../codec/MapExecuteOnKeysCodec';
import * as SerializationUtil from '../serialization/SerializationUtil';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import ClientMessage = require('../ClientMessage');
import {Aggregator} from '../aggregation/Aggregator';
import {MapAggregateCodec} from '../codec/MapAggregateCodec';
import {MapAggregateWithPredicateCodec} from '../codec/MapAggregateWithPredicateCodec';
import {ReadOnlyLazyList} from '../core/ReadOnlyLazyList';

export class MapProxy<K, V> extends BaseProxy implements IMap<K, V> {
    aggregate<R>(aggregator: Aggregator<R>): Promise<R> {
        assertNotNull(aggregator);
        let aggregatorData = this.toData(aggregator);
        return this.encodeInvokeOnRandomTarget(MapAggregateCodec, aggregatorData);
    }

    aggregateWithPredicate<R>(aggregator: Aggregator<R>, predicate: Predicate): Promise<R> {
        assertNotNull(aggregator);
        assertNotNull(predicate);
        this.checkNotPagingPredicate(predicate);
        let aggregatorData = this.toData(aggregator);
        let predicateData = this.toData(predicate);
        return this.encodeInvokeOnRandomTarget(MapAggregateWithPredicateCodec, aggregatorData, predicateData);
    }

    executeOnKeys(keys: K[], entryProcessor: IdentifiedDataSerializable|Portable): Promise<any[]> {
        assertNotNull(keys);
        assertArray(keys);
        if (keys.length === 0) {
            return Promise.resolve([]);
        } else {
            var toObject = this.toObject.bind(this);
            var keysData = SerializationUtil.serializeList(this.toData.bind(this), keys);
            var proData = this.toData(entryProcessor);
            return this.encodeInvokeOnRandomTarget(MapExecuteOnKeysCodec, proData, keysData)
                .then<[K, V][]>(SerializationUtil.deserializeEntryList.bind(this, toObject));
        }
    }

    executeOnKey(key: K, entryProcessor: IdentifiedDataSerializable | Portable): Promise<V> {
        assertNotNull(key);
        assertNotNull(entryProcessor);
        var keyData = this.toData(key);
        var proData = this.toData(entryProcessor);

        return this.executeOnKeyInternal(keyData, proData);
    }

    protected executeOnKeyInternal(keyData: Data, proData: Data): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapExecuteOnKeyCodec, keyData, proData, keyData, 1);
    }

    executeOnEntries(entryProcessor: IdentifiedDataSerializable | Portable, predicate: Predicate = null): Promise<[K, V][]> {
        assertNotNull(entryProcessor);
        var proData = this.toData(entryProcessor);
        var toObject = this.toObject.bind(this);

        if (predicate == null) {
            return this.encodeInvokeOnRandomTarget<[Data, Data][]>(MapExecuteOnAllKeysCodec, proData)
                .then<[K, V][]>(SerializationUtil.deserializeEntryList.bind(this, toObject));
        } else {
            var predData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapExecuteWithPredicateCodec, proData, predData)
                .then<[K, V][]>(SerializationUtil.deserializeEntryList.bind(this, toObject));
        }

    }

    entrySetWithPredicate(predicate: Predicate): Promise<any[]> {
        assertNotNull(predicate);
        var toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicate) {
            predicate.setIterationType(IterationType.ENTRY);
            var pData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(
                MapValuesWithPagingPredicateCodec, pData
            ).then(function(rawValues: [Data, Data][]) {
                var deserValues = rawValues.map<[K, V]>(function (ite: [Data, Data]) {
                    return [toObject(ite[0]), toObject(ite[1])];
                });
                return getSortedQueryResultSet(deserValues, predicate);
            });
        } else {
            var pData = this.toData(predicate);
            var deserializedSet: [K, V][] = [];
            return this.encodeInvokeOnRandomTarget(MapEntriesWithPredicateCodec, pData).then(function(entrySet: [Data, Data][]) {
                entrySet.forEach(function(entry) {
                    deserializedSet.push([toObject(entry[0]), toObject(entry[1])]);
                });
                return deserializedSet;
            });
        }
    }

    keySetWithPredicate(predicate: Predicate): Promise<K[]> {
        assertNotNull(predicate);
        var toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicate) {
            predicate.setIterationType(IterationType.KEY);
            var predData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPagingPredicateCodec, predData).then(function(rawValues: Data[]) {
                var deserValues = rawValues.map<[K, V]>(function (ite: Data) {
                    return [toObject(ite), null];
                });
                return getSortedQueryResultSet(deserValues, predicate);
            });
        } else {
            var predicateData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPredicateCodec, predicateData).then(function (entrySet: Data[]) {
                return entrySet.map<K>(toObject);
            });
        }
    }

    valuesWithPredicate(predicate: Predicate): Promise<ReadOnlyLazyList<V>> {
        assertNotNull(predicate);
        var toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicate) {
            predicate.setIterationType(IterationType.VALUE);
            let predData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(
                MapValuesWithPagingPredicateCodec, predData
            ).then((rawValues: [Data, Data][]) => {
                let desValues = rawValues.map<[K, V]>(function (ite: [Data, Data]) {
                    return [toObject(ite[0]), toObject(ite[1])];
                });
                return new ReadOnlyLazyList(getSortedQueryResultSet(desValues, predicate), this.client.getSerializationService());
            });
        } else {
            var predicateData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapValuesWithPredicateCodec, predicateData).then( (rawValues: Data[]) => {
                return new ReadOnlyLazyList(rawValues, this.client.getSerializationService());
            });
        }
    }

    addEntryListenerWithPredicate(listener: IMapListener<K, V>, predicate: Predicate,
                                  key: K = undefined, includeValue: boolean = undefined
    ): Promise<string> {
        return this.addEntryListenerInternal(listener, predicate, key, includeValue);
    }

    containsKey(key: K): Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.containsKeyInternal(keyData);
    }

    protected containsKeyInternal(keyData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapContainsKeyCodec, keyData, keyData, 0);
    }

    containsValue(value: V): Promise<boolean> {
        assertNotNull(value);
        var valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget<boolean>(MapContainsValueCodec, valueData);
    }

    put(key: K, value: V, ttl: number = -1): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData: Data = this.toData(key);
        var valueData: Data = this.toData(value);
        return this.putInternal(keyData, valueData, ttl);
    }

    protected putInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapPutCodec, keyData, keyData, valueData, 0, ttl);
    }

    putAll(pairs: [K, V][]): Promise<void> {
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
            partitionsToKeys[pId].push([keyData, this.toData(pair[1])]);
        }
        return this.putAllInternal(partitionsToKeys);
    }

    protected putAllInternal(partitionsToKeysData: {[id: string]: [Data, Data][]}): Promise<void> {
        var partitionPromises: Promise<void>[] = [];
        for (var partition in partitionsToKeysData) {
            partitionPromises.push(
                this.encodeInvokeOnPartition<void>(MapPutAllCodec, Number(partition), partitionsToKeysData[partition])
            );
        }
        return Promise.all(partitionPromises).then(function () {
            return;
        });
    }

    get(key: K): Promise<V> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.getInternal(keyData);
    }

    protected getInternal(keyData: Data): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapGetCodec, keyData, keyData, 0);
    }

    remove(key: K, value: V = null): Promise<V> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.removeInternal(keyData, value);
    }

    protected removeInternal(keyData: Data, value: V = null): Promise<V> {
        if (value == null) {
            return this.encodeInvokeOnKey<V>(MapRemoveCodec, keyData, keyData, 0);
        } else {
            var valueData = this.toData(value);
            return this.encodeInvokeOnKey<V>(MapRemoveIfSameCodec, keyData, keyData, valueData, 0);
        }
    }

    size(): Promise<number> {
        return this.encodeInvokeOnRandomTarget<number>(MapSizeCodec);
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapClearCodec);
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvokeOnRandomTarget<boolean>(MapIsEmptyCodec);
    }

    getAll(keys: K[]): Promise<any[]> {
        assertNotNull(keys);
        assertArray(keys);
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
        var result: [any, any][] = [];
        return this.getAllInternal(partitionsToKeys, result).then(function () {
            return result;
        });
    }

    protected getAllInternal(partitionsToKeys: {[id: string]: any}, result: any[] = []): Promise<[Data, Data][]> {
        var partitionPromises: Promise<[Data, Data][]>[] = [];
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
        return Promise.all(partitionPromises).then(function(serializedEntryArrayArray: [Data, Data][][]) {
            var serializedEntryArray = Array.prototype.concat.apply([], serializedEntryArrayArray);
            result.push(...(serializedEntryArray.map(deserializeEntry)));
            return serializedEntryArray;
        });
    }

    delete(key: K): Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.deleteInternal(keyData);
    }

    protected deleteInternal(keyData: Data): Promise<void> {
        return this.encodeInvokeOnKey<void>(MapDeleteCodec, keyData, keyData, 0);
    }

    entrySet(): Promise<any[]> {
        var deserializedSet: [K, V][] = [];
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget(MapEntrySetCodec).then(function(entrySet: [Data, Data][]) {
            entrySet.forEach(function(entry) {
                deserializedSet.push([toObject(entry[0]), toObject(entry[1])]);
            });
            return deserializedSet;
        });
    }

    evict(key: K) : Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.evictInternal(keyData);
    }

    protected evictInternal(keyData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapEvictCodec, keyData, keyData, 0);
    }

    evictAll(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapEvictAllCodec);
    }

    flush(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapFlushCodec);
    }

    lock(key: K, ttl: number = -1): Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapLockCodec, keyData, keyData, 0, ttl, 0);
    }

    isLocked(key: K): Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapIsLockedCodec, keyData, keyData);
    }

    unlock(key: K): Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapUnlockCodec, keyData, keyData, 0, 0);
    }

    forceUnlock(key: K): Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapForceUnlockCodec, keyData, keyData, 0);
    }

    keySet(): Promise<K[]> {
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget<K[]>(MapKeySetCodec).then(function(entrySet) {
            return entrySet.map<K>(toObject);
        });
    }

    loadAll(keys: K[] = null, replaceExistingValues: boolean = true): Promise<void> {
        if (keys == null) {
            return this.encodeInvokeOnRandomTarget<void>(MapLoadAllCodec, replaceExistingValues);
        } else {
            var toData = this.toData.bind(this);
            var keysData: Data[] = keys.map<Data>(toData);
            return this.encodeInvokeOnRandomTarget<void>(MapLoadGivenKeysCodec, keysData, replaceExistingValues);
        }
    }

    putIfAbsent(key: K, value: V, ttl: number = -1): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.putIfAbsentInternal(keyData, valueData, ttl);
    }

    protected putIfAbsentInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapPutIfAbsentCodec, keyData, keyData, valueData, 0, ttl);
    }

    putTransient(key: K, value: V, ttl: number = -1): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.putTransientInternal(keyData, valueData, ttl);
    }

    protected putTransientInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return this.encodeInvokeOnKey<void>(MapPutTransientCodec, keyData, keyData, valueData, 0, ttl);
    }

    replace(key: K, newValue: V): Promise<V> {
        assertNotNull(key);
        assertNotNull(newValue);
        var keyData = this.toData(key);
        var newValueData = this.toData(newValue);
        return this.replaceInternal(keyData, newValueData);
    }

    protected replaceInternal(keyData: Data, newValueData: Data): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapReplaceCodec, keyData, keyData, newValueData, 0);
    }

    replaceIfSame(key: K, oldValue: V, newValue: V): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(oldValue);
        assertNotNull(newValue);
        var keyData = this.toData(key);
        var newValueData = this.toData(newValue);
        var oldValueData = this.toData(oldValue);
        return this.replaceIfSameInternal(keyData, oldValueData, newValueData);
    }

    protected replaceIfSameInternal(keyData: Data, oldValueData: Data, newValueData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapReplaceIfSameCodec, keyData, keyData, oldValueData, newValueData, 0);
    }

    set(key: K, value: V, ttl: number = -1): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.setInternal(keyData, valueData, ttl);
    }

    protected setInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return this.encodeInvokeOnKey<void>(MapSetCodec, keyData, keyData, valueData, 0, ttl);
    }

    values(): Promise<ReadOnlyLazyList<V>> {
        return this.encodeInvokeOnRandomTarget<Data[]>(MapValuesCodec).then((valuesData) => {
            return new ReadOnlyLazyList(valuesData, this.client.getSerializationService());
        });
    }

    getEntryView(key: K): Promise<EntryView<K, V>> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<EntryView<K, V>>(MapGetEntryViewCodec, keyData, keyData, 0);
    }

    addIndex(attribute: string, ordered: boolean): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapAddIndexCodec, attribute, ordered);
    }

    tryLock(key: K, timeout: number = 0, lease: number = -1): Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapTryLockCodec, keyData, keyData, 0, lease, timeout, 0);
    }

    tryPut(key: K, value: V, timeout: number): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.tryPutInternal(keyData, valueData, timeout);
    }

    protected tryPutInternal(keyData: Data, valueData: Data, timeout: number): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapTryPutCodec, keyData, keyData, valueData, 0, timeout);
    }

    tryRemove(key: K, timeout: number): Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.tryRemoveInternal(keyData, timeout);
    }

    protected tryRemoveInternal(keyData: Data, timeout: number): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapTryRemoveCodec, keyData, keyData, 0, timeout);
    }

    private addEntryListenerInternal(
        listener: IMapListener<K, V>, predicate: Predicate, key: K, includeValue: boolean
    ): Promise<string> {
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
            eventParams = eventParams.map(toObject);
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
        let codec: ListenerMessageCodec;
        let listenerHandler: Function;
        if (key && predicate) {
            var keyData = this.toData(key);
            var predicateData = this.toData(predicate);
            codec = this.createEntryListenerToKeyWithPredicate(this.name, keyData, predicateData, includeValue, flags);
            listenerHandler = MapAddEntryListenerToKeyWithPredicateCodec.handle;
        } else if (key && !predicate) {
            var keyData = this.toData(key);
            codec = this.createEntryListenerToKey(this.name, keyData, includeValue, flags);
            listenerHandler = MapAddEntryListenerToKeyCodec.handle;
        } else if (!key && predicate) {
            var predicateData = this.toData(predicate);
            codec = this.createEntryListenerWithPredicate(this.name, predicateData, includeValue, flags);
            listenerHandler = MapAddEntryListenerWithPredicateCodec.handle;
        } else {
            codec = this.createEntryListener(this.name, includeValue, flags);
            listenerHandler = MapAddEntryListenerCodec.handle;
        }
        return this.client.getListenerService()
            .registerListener(codec, (m: ClientMessage) => { listenerHandler(m, entryEventHandler, toObject); });
    }

    addEntryListener(listener: IMapListener<K, V>, key: K = undefined, includeValue: boolean = false): Promise<string> {
        return this.addEntryListenerInternal(listener, undefined, key, includeValue);
    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(listenerId);
    }


    private createEntryListenerToKey(name: string, keyData: Data, includeValue: boolean, flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest: function(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerToKeyCodec.encodeRequest(name, keyData, includeValue, flags, localOnly);
            },
            decodeAddResponse: function(msg: ClientMessage): string {
                return MapAddEntryListenerToKeyCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest: function(listenerId: string): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            }
        };
    }

    private createEntryListenerToKeyWithPredicate(name: string, keyData: Data, predicateData: Data, includeValue: boolean,
                                                   flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest: function(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerToKeyWithPredicateCodec.encodeRequest(name, keyData, predicateData, includeValue,
                    flags, localOnly);
            },
            decodeAddResponse: function(msg: ClientMessage): string {
                return MapAddEntryListenerToKeyWithPredicateCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest: function(listenerId: string): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            }
        };
    }

    private createEntryListenerWithPredicate(name: string, predicateData: Data, includeValue: boolean,
                                              flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest: function(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerWithPredicateCodec.encodeRequest(name, predicateData, includeValue, flags, localOnly);
            },
            decodeAddResponse: function(msg: ClientMessage): string {
                return MapAddEntryListenerWithPredicateCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest: function(listenerId: string): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            }
        };
    }

    private createEntryListener(name: string, includeValue: boolean, flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest: function(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerCodec.encodeRequest(name, includeValue, flags, localOnly);
            },
            decodeAddResponse: function(msg: ClientMessage): string {
                return MapAddEntryListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest: function(listenerId: string): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            }
        };
    }

    private checkNotPagingPredicate(v: Predicate): void {
        if (v instanceof PagingPredicate) {
            throw new RangeError('Paging predicate is not supported.');
        }
    }


}


