/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import {Aggregator} from '../aggregation/Aggregator';
import {MapAddEntryListenerCodec} from '../codec/MapAddEntryListenerCodec';
import {MapAddEntryListenerToKeyCodec} from '../codec/MapAddEntryListenerToKeyCodec';
import {MapAddEntryListenerToKeyWithPredicateCodec} from '../codec/MapAddEntryListenerToKeyWithPredicateCodec';
import {MapAddEntryListenerWithPredicateCodec} from '../codec/MapAddEntryListenerWithPredicateCodec';
import {MapAddIndexCodec} from '../codec/MapAddIndexCodec';
import {MapAggregateCodec} from '../codec/MapAggregateCodec';
import {MapAggregateWithPredicateCodec} from '../codec/MapAggregateWithPredicateCodec';
import {MapClearCodec} from '../codec/MapClearCodec';
import {MapContainsKeyCodec} from '../codec/MapContainsKeyCodec';
import {MapContainsValueCodec} from '../codec/MapContainsValueCodec';
import {MapDeleteCodec} from '../codec/MapDeleteCodec';
import {MapEntriesWithPredicateCodec} from '../codec/MapEntriesWithPredicateCodec';
import {MapEntrySetCodec} from '../codec/MapEntrySetCodec';
import {MapEvictAllCodec} from '../codec/MapEvictAllCodec';
import {MapEvictCodec} from '../codec/MapEvictCodec';
import {MapExecuteOnAllKeysCodec} from '../codec/MapExecuteOnAllKeysCodec';
import {MapExecuteOnKeyCodec} from '../codec/MapExecuteOnKeyCodec';
import {MapExecuteOnKeysCodec} from '../codec/MapExecuteOnKeysCodec';
import {MapExecuteWithPredicateCodec} from '../codec/MapExecuteWithPredicateCodec';
import {MapFlushCodec} from '../codec/MapFlushCodec';
import {MapForceUnlockCodec} from '../codec/MapForceUnlockCodec';
import {MapGetAllCodec} from '../codec/MapGetAllCodec';
import {MapGetCodec} from '../codec/MapGetCodec';
import {MapGetEntryViewCodec} from '../codec/MapGetEntryViewCodec';
import {MapIsEmptyCodec} from '../codec/MapIsEmptyCodec';
import {MapIsLockedCodec} from '../codec/MapIsLockedCodec';
import {MapKeySetCodec} from '../codec/MapKeySetCodec';
import {MapKeySetWithPagingPredicateCodec} from '../codec/MapKeySetWithPagingPredicateCodec';
import {MapKeySetWithPredicateCodec} from '../codec/MapKeySetWithPredicateCodec';
import {MapLoadAllCodec} from '../codec/MapLoadAllCodec';
import {MapLoadGivenKeysCodec} from '../codec/MapLoadGivenKeysCodec';
import {MapLockCodec} from '../codec/MapLockCodec';
import {MapPutAllCodec} from '../codec/MapPutAllCodec';
import {MapPutCodec} from '../codec/MapPutCodec';
import {MapPutIfAbsentCodec} from '../codec/MapPutIfAbsentCodec';
import {MapPutTransientCodec} from '../codec/MapPutTransientCodec';
import {MapRemoveCodec} from '../codec/MapRemoveCodec';
import {MapRemoveEntryListenerCodec} from '../codec/MapRemoveEntryListenerCodec';
import {MapRemoveIfSameCodec} from '../codec/MapRemoveIfSameCodec';
import {MapReplaceCodec} from '../codec/MapReplaceCodec';
import {MapReplaceIfSameCodec} from '../codec/MapReplaceIfSameCodec';
import {MapSetCodec} from '../codec/MapSetCodec';
import {MapSizeCodec} from '../codec/MapSizeCodec';
import {MapTryLockCodec} from '../codec/MapTryLockCodec';
import {MapTryPutCodec} from '../codec/MapTryPutCodec';
import {MapTryRemoveCodec} from '../codec/MapTryRemoveCodec';
import {MapUnlockCodec} from '../codec/MapUnlockCodec';
import {MapValuesCodec} from '../codec/MapValuesCodec';
import {MapValuesWithPagingPredicateCodec} from '../codec/MapValuesWithPagingPredicateCodec';
import {MapValuesWithPredicateCodec} from '../codec/MapValuesWithPredicateCodec';
import {EventType} from './EventType';
import {SimpleEntryView} from '../core/SimpleEntryView';
import {MapEvent, MapListener} from './MapListener';
import {IterationType, Predicate} from '../core/Predicate';
import {ReadOnlyLazyList} from '../core/ReadOnlyLazyList';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {PagingPredicateImpl} from '../serialization/DefaultPredicates';
import {IdentifiedDataSerializable} from '../serialization/Serializable';
import {Portable} from '../serialization/Portable';
import * as SerializationUtil from '../serialization/SerializationUtil';
import {assertArray, assertNotNull} from '../util/Util';
import {BaseProxy} from './BaseProxy';
import {IMap} from './IMap';
import {EntryEvent} from './EntryListener';
import {UUID} from '../core/UUID';
import {ClientMessage} from '../protocol/ClientMessage';
import {IndexConfig} from '../config/IndexConfig';
import {IndexUtil} from '../util/IndexUtil';
import {PagingPredicateHolder} from '../protocol/PagingPredicateHolder';
import {MapEntriesWithPagingPredicateCodec} from '../codec/MapEntriesWithPagingPredicateCodec';

type EntryEventHander = (key: Data, value: Data, oldValue: Data, mergingValue: Data, eventType: number,
                         uuid: UUID, numberOfAffectedEntries: number) => void;

/** @internal */
export class MapProxy<K, V> extends BaseProxy implements IMap<K, V> {
    aggregate<R>(aggregator: Aggregator<R>): Promise<R> {
        assertNotNull(aggregator);
        const aggregatorData = this.toData(aggregator);
        return this.encodeInvokeOnRandomTarget(MapAggregateCodec, aggregatorData)
            .then((clientMessage) => {
                const response = MapAggregateCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    aggregateWithPredicate<R>(aggregator: Aggregator<R>, predicate: Predicate): Promise<R> {
        assertNotNull(aggregator);
        assertNotNull(predicate);
        this.checkNotPagingPredicate(predicate);
        const aggregatorData = this.toData(aggregator);
        const predicateData = this.toData(predicate);
        return this.encodeInvokeOnRandomTarget(MapAggregateWithPredicateCodec, aggregatorData, predicateData)
            .then((clientMessage) => {
                const response = MapAggregateWithPredicateCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    executeOnKeys(keys: K[], entryProcessor: IdentifiedDataSerializable | Portable): Promise<any[]> {
        assertNotNull(keys);
        assertArray(keys);
        if (keys.length === 0) {
            return Promise.resolve([]);
        } else {
            const toObject = this.toObject.bind(this);
            const keysData = SerializationUtil.serializeList(this.toData.bind(this), keys);
            const proData = this.toData(entryProcessor);
            return this.encodeInvokeOnRandomTarget(MapExecuteOnKeysCodec, proData, keysData)
                .then<Array<[K, V]>>((clientMessage) => {
                    const response = MapExecuteOnKeysCodec.decodeResponse(clientMessage);
                    return SerializationUtil.deserializeEntryList(toObject, response);
                });
        }
    }

    executeOnKey(key: K, entryProcessor: IdentifiedDataSerializable | Portable): Promise<V> {
        assertNotNull(key);
        assertNotNull(entryProcessor);
        const keyData = this.toData(key);
        const proData = this.toData(entryProcessor);

        return this.executeOnKeyInternal(keyData, proData);
    }

    executeOnEntries(entryProcessor: IdentifiedDataSerializable | Portable, predicate: Predicate = null): Promise<Array<[K, V]>> {
        assertNotNull(entryProcessor);
        const proData = this.toData(entryProcessor);
        const toObject = this.toObject.bind(this);
        if (predicate == null) {
            return this.encodeInvokeOnRandomTarget(MapExecuteOnAllKeysCodec, proData)
                .then<Array<[K, V]>>((clientMessage) => {
                    const response = MapExecuteOnAllKeysCodec.decodeResponse(clientMessage);
                    return SerializationUtil.deserializeEntryList(toObject, response);
                });
        } else {
            const predData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapExecuteWithPredicateCodec, proData, predData)
                .then<Array<[K, V]>>((clientMessage) => {
                    const response = MapExecuteWithPredicateCodec.decodeResponse(clientMessage);
                    return SerializationUtil.deserializeEntryList(toObject, response);
                });
        }

    }

    entrySetWithPredicate(predicate: Predicate): Promise<any[]> {
        assertNotNull(predicate);

        const toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicateImpl) {
            predicate.setIterationType(IterationType.ENTRY);
            const serializationService = this.client.getSerializationService();
            const pagingPredicateHolder = PagingPredicateHolder.of(predicate, serializationService);
            return this.encodeInvokeOnRandomTarget(MapEntriesWithPagingPredicateCodec, pagingPredicateHolder)
                .then((clientMessage) => {
                    const response = MapEntriesWithPagingPredicateCodec.decodeResponse(clientMessage);
                    predicate.setAnchorList(response.anchorDataList.asAnchorList(serializationService));
                    return SerializationUtil.deserializeEntryList(toObject, response.response);
                });
        } else {
            const pData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapEntriesWithPredicateCodec, pData)
                .then((clientMessage) => {
                    const response = MapEntriesWithPredicateCodec.decodeResponse(clientMessage);
                    return SerializationUtil.deserializeEntryList(toObject, response);
                });
        }
    }

    keySetWithPredicate(predicate: Predicate): Promise<K[]> {
        assertNotNull(predicate);

        const toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicateImpl) {
            predicate.setIterationType(IterationType.KEY);
            const serializationService = this.client.getSerializationService();
            const pagingPredicateHolder = PagingPredicateHolder.of(predicate, serializationService);
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPagingPredicateCodec, pagingPredicateHolder)
                .then((clientMessage) => {
                    const response = MapKeySetWithPagingPredicateCodec.decodeResponse(clientMessage);
                    predicate.setAnchorList(response.anchorDataList.asAnchorList(serializationService));
                    return response.response.map<K>(toObject);
                });
        } else {
            const predicateData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPredicateCodec, predicateData)
                .then((clientMessage) => {
                    const response = MapKeySetWithPredicateCodec.decodeResponse(clientMessage);
                    return response.map<K>(toObject);
                });
        }
    }

    valuesWithPredicate(predicate: Predicate): Promise<ReadOnlyLazyList<V>> {
        assertNotNull(predicate);
        if (predicate instanceof PagingPredicateImpl) {
            predicate.setIterationType(IterationType.VALUE);
            const serializationService = this.client.getSerializationService();
            const pagingPredicateHolder = PagingPredicateHolder.of(predicate, serializationService);
            return this.encodeInvokeOnRandomTarget(MapValuesWithPagingPredicateCodec, pagingPredicateHolder)
                .then((clientMessage) => {
                    const response = MapValuesWithPagingPredicateCodec.decodeResponse(clientMessage);
                    predicate.setAnchorList(response.anchorDataList.asAnchorList(serializationService));
                    return new ReadOnlyLazyList(response.response, serializationService);
                });
        } else {
            const predicateData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapValuesWithPredicateCodec, predicateData)
                .then((clientMessage) => {
                    const response = MapValuesWithPredicateCodec.decodeResponse(clientMessage);
                    return new ReadOnlyLazyList(response, this.client.getSerializationService());
                });
        }
    }

    addEntryListenerWithPredicate(listener: MapListener<K, V>, predicate: Predicate, key: K,
                                  includeValue: boolean): Promise<string> {
        return this.addEntryListenerInternal(listener, predicate, key, includeValue);
    }

    containsKey(key: K): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.containsKeyInternal(keyData);
    }

    containsValue(value: V): Promise<boolean> {
        assertNotNull(value);
        const valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget(MapContainsValueCodec, valueData)
            .then(MapContainsValueCodec.decodeResponse);
    }

    put(key: K, value: V, ttl = -1): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData: Data = this.toData(key);
        const valueData: Data = this.toData(value);
        return this.putInternal(keyData, valueData, ttl);
    }

    putAll(pairs: Array<[K, V]>): Promise<void> {
        return this.putAllInternal(pairs, true);
    }

    setAll(pairs: Array<[K, V]>): Promise<void> {
        return this.putAllInternal(pairs, false);
    }

    get(key: K): Promise<V> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.getInternal(keyData);
    }

    remove(key: K, value: V = null): Promise<V | boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.removeInternal(keyData, value);
    }

    size(): Promise<number> {
        return this.encodeInvokeOnRandomTarget(MapSizeCodec)
            .then(MapSizeCodec.decodeResponse);
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(MapClearCodec).then();
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvokeOnRandomTarget(MapIsEmptyCodec)
            .then(MapIsEmptyCodec.decodeResponse);
    }

    getAll(keys: K[]): Promise<any[]> {
        assertNotNull(keys);
        assertArray(keys);
        const partitionService = this.client.getPartitionService();
        const partitionsToKeys: { [id: string]: any } = {};
        let key: K;
        for (const i in keys) {
            key = keys[i];
            const keyData = this.toData(key);
            const pId: number = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push(keyData);
        }
        const result: Array<[any, any]> = [];
        return this.getAllInternal(partitionsToKeys, result).then(function (): Array<[any, any]> {
            return result;
        });
    }

    delete(key: K): Promise<void> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.deleteInternal(keyData);
    }

    entrySet(): Promise<any[]> {
        return this.encodeInvokeOnRandomTarget(MapEntrySetCodec)
            .then((clientMessage) => {
                const response = MapEntrySetCodec.decodeResponse(clientMessage);
                return SerializationUtil.deserializeEntryList(this.toObject.bind(this), response);
            });
    }

    evict(key: K): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.evictInternal(keyData);
    }

    evictAll(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(MapEvictAllCodec).then();
    }

    flush(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(MapFlushCodec).then();
    }

    lock(key: K, ttl = -1): Promise<void> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MapLockCodec, keyData, keyData, 0, ttl, 0).then();
    }

    isLocked(key: K): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MapIsLockedCodec, keyData, keyData)
            .then(MapIsLockedCodec.decodeResponse);
    }

    unlock(key: K): Promise<void> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MapUnlockCodec, keyData, keyData, 0, 0).then();
    }

    forceUnlock(key: K): Promise<void> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MapForceUnlockCodec, keyData, keyData, 0).then();
    }

    keySet(): Promise<K[]> {
        return this.encodeInvokeOnRandomTarget(MapKeySetCodec)
            .then((clientMessage) => {
                const response = MapKeySetCodec.decodeResponse(clientMessage);
                return response.map<K>(this.toObject.bind(this));
            });
    }

    loadAll(keys: K[] = null, replaceExistingValues = true): Promise<void> {
        if (keys == null) {
            return this.encodeInvokeOnRandomTarget(MapLoadAllCodec, replaceExistingValues).then();
        } else {
            const toData = this.toData.bind(this);
            const keysData: Data[] = keys.map<Data>(toData);
            return this.encodeInvokeOnRandomTarget(MapLoadGivenKeysCodec, keysData, replaceExistingValues).then();
        }
    }

    putIfAbsent(key: K, value: V, ttl = -1): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.putIfAbsentInternal(keyData, valueData, ttl);
    }

    putTransient(key: K, value: V, ttl = -1): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.putTransientInternal(keyData, valueData, ttl);
    }

    replace(key: K, newValue: V): Promise<V> {
        assertNotNull(key);
        assertNotNull(newValue);
        const keyData = this.toData(key);
        const newValueData = this.toData(newValue);
        return this.replaceInternal(keyData, newValueData);
    }

    replaceIfSame(key: K, oldValue: V, newValue: V): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(oldValue);
        assertNotNull(newValue);
        const keyData = this.toData(key);
        const newValueData = this.toData(newValue);
        const oldValueData = this.toData(oldValue);
        return this.replaceIfSameInternal(keyData, oldValueData, newValueData);
    }

    set(key: K, value: V, ttl = -1): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.setInternal(keyData, valueData, ttl);
    }

    values(): Promise<ReadOnlyLazyList<V>> {
        return this.encodeInvokeOnRandomTarget(MapValuesCodec)
            .then((clientMessage) => {
                const response = MapValuesCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList(response, this.client.getSerializationService());
            });
    }

    getEntryView(key: K): Promise<SimpleEntryView<K, V>> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MapGetEntryViewCodec, keyData, keyData, 0)
            .then((clientMessage) => {
                const response = MapGetEntryViewCodec.decodeResponse(clientMessage);
                const dataEntryView = response.response;
                if (dataEntryView == null) {
                    return null;
                }

                return new SimpleEntryView<K, V>(this.toObject(dataEntryView.key), this.toObject(dataEntryView.value),
                    dataEntryView.cost, dataEntryView.creationTime, dataEntryView.expirationTime, dataEntryView.hits,
                    dataEntryView.lastAccessTime, dataEntryView.lastStoredTime, dataEntryView.lastUpdateTime,
                    dataEntryView.version, dataEntryView.ttl, response.maxIdle);
            });
    }

    addIndex(indexConfig: IndexConfig): Promise<void> {
        assertNotNull(indexConfig);
        const normalizedConfig = IndexUtil.validateAndNormalize(this.name, indexConfig);
        return this.encodeInvokeOnRandomTarget(MapAddIndexCodec, normalizedConfig).then();
    }

    tryLock(key: K, timeout = 0, lease = -1): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MapTryLockCodec, keyData, keyData, 0, lease, timeout, 0)
            .then(MapTryLockCodec.decodeResponse);
    }

    tryPut(key: K, value: V, timeout: number): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.tryPutInternal(keyData, valueData, timeout);
    }

    tryRemove(key: K, timeout: number): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.tryRemoveInternal(keyData, timeout);
    }

    addEntryListener(listener: MapListener<K, V>, key: K, includeValue = false): Promise<string> {
        return this.addEntryListenerInternal(listener, undefined, key, includeValue);
    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(listenerId);
    }

    protected executeOnKeyInternal(keyData: Data, proData: Data): Promise<V> {
        return this.encodeInvokeOnKey(MapExecuteOnKeyCodec, keyData, proData, keyData, 1)
            .then((clientMessage) => {
                const response = MapExecuteOnKeyCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    protected containsKeyInternal(keyData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey(MapContainsKeyCodec, keyData, keyData, 0)
            .then(MapContainsKeyCodec.decodeResponse);
    }

    protected putInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return this.encodeInvokeOnKey(MapPutCodec, keyData, keyData, valueData, 0, ttl)
            .then((clientMessage) => {
                const response = MapPutCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    protected finalizePutAll(partitionsToKeys: { [id: string]: Array<[Data, Data]> }): void {
        // No-op
    }

    protected getInternal(keyData: Data): Promise<V> {
        return this.encodeInvokeOnKey(MapGetCodec, keyData, keyData, 0)
            .then((clientMessage) => {
                const response = MapGetCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    protected removeInternal(keyData: Data, value: V = null): Promise<V | boolean> {
        if (value == null) {
            return this.encodeInvokeOnKey(MapRemoveCodec, keyData, keyData, 0)
                .then((clientMessage) => {
                    const response = MapRemoveCodec.decodeResponse(clientMessage);
                    return this.toObject(response);
                });
        } else {
            const valueData = this.toData(value);
            return this.encodeInvokeOnKey(MapRemoveIfSameCodec, keyData, keyData, valueData, 0)
                .then(MapRemoveIfSameCodec.decodeResponse);
        }
    }

    protected getAllInternal(partitionsToKeys: { [id: string]: any }, result: any[] = []): Promise<Array<[Data, Data]>> {
        const partitionPromises: Array<Promise<Array<[Data, Data]>>> = [];
        for (const partition in partitionsToKeys) {
            partitionPromises.push(this.encodeInvokeOnPartition(MapGetAllCodec, Number(partition), partitionsToKeys[partition])
                .then(MapGetAllCodec.decodeResponse)
            );
        }
        const toObject = this.toObject.bind(this);
        const deserializeEntry = function (entry: [Data, Data]): any[] {
            return [toObject(entry[0]), toObject(entry[1])];
        };
        return Promise.all(partitionPromises).then(function (serializedEntryArrayArray: Array<Array<[Data, Data]>>): any[] {
            const serializedEntryArray = Array.prototype.concat.apply([], serializedEntryArrayArray);
            result.push(...(serializedEntryArray.map(deserializeEntry)));
            return serializedEntryArray;
        });
    }

    protected deleteInternal(keyData: Data): Promise<void> {
        return this.encodeInvokeOnKey(MapDeleteCodec, keyData, keyData, 0).then();
    }

    protected evictInternal(keyData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey(MapEvictCodec, keyData, keyData, 0)
            .then(MapEvictCodec.decodeResponse);
    }

    protected putIfAbsentInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return this.encodeInvokeOnKey(MapPutIfAbsentCodec, keyData, keyData, valueData, 0, ttl)
            .then((clientMessage) => {
                const response = MapPutIfAbsentCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    protected putTransientInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return this.encodeInvokeOnKey(MapPutTransientCodec, keyData, keyData, valueData, 0, ttl).then();
    }

    protected replaceInternal(keyData: Data, newValueData: Data): Promise<V> {
        return this.encodeInvokeOnKey(MapReplaceCodec, keyData, keyData, newValueData, 0)
            .then((clientMessage) => {
                const response = MapReplaceCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    protected replaceIfSameInternal(keyData: Data, oldValueData: Data, newValueData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey(MapReplaceIfSameCodec, keyData, keyData, oldValueData, newValueData, 0)
            .then(MapReplaceIfSameCodec.decodeResponse);
    }

    protected setInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return this.encodeInvokeOnKey(MapSetCodec, keyData, keyData, valueData, 0, ttl).then();
    }

    protected tryPutInternal(keyData: Data, valueData: Data, timeout: number): Promise<boolean> {
        return this.encodeInvokeOnKey(MapTryPutCodec, keyData, keyData, valueData, 0, timeout)
            .then(MapTryPutCodec.decodeResponse);
    }

    protected tryRemoveInternal(keyData: Data, timeout: number): Promise<boolean> {
        return this.encodeInvokeOnKey(MapTryRemoveCodec, keyData, keyData, 0, timeout)
            .then(MapTryRemoveCodec.decodeResponse);
    }

    private putAllInternal(pairs: Array<[K, V]>, triggerMapLoader: boolean): Promise<void> {
        const partitionService = this.client.getPartitionService();
        const partitionsToKeys: { [id: number]: Array<[Data, Data]> } = {};
        for (const pair of pairs) {
            const keyData = this.toData(pair[0]);
            const pId: number = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push([keyData, this.toData(pair[1])]);
        }

        const partitionPromises: Array<Promise<void>> = [];
        for (const partition in partitionsToKeys) {
            partitionPromises.push(
                this.encodeInvokeOnPartition(MapPutAllCodec, Number(partition), partitionsToKeys[partition], triggerMapLoader)
                    .then(() => this.finalizePutAll(partitionsToKeys)),
            );
        }
        return Promise.all(partitionPromises).then();
    }

    private addEntryListenerInternal(
        listener: MapListener<K, V>, predicate: Predicate, key: K, includeValue: boolean,
    ): Promise<string> {
        let flags: any = null;
        const conversionTable: { [funcName: string]: EventType } = {
            added: EventType.ADDED,
            mapCleared: EventType.CLEAR_ALL,
            evicted: EventType.EVICTED,
            mapEvicted: EventType.EVICT_ALL,
            merged: EventType.MERGED,
            removed: EventType.REMOVED,
            updated: EventType.UPDATED,
            expired: EventType.EXPIRED,
            loaded: EventType.LOADED,
        };
        for (const funcName in conversionTable) {
            if (listener[funcName]) {
                flags = flags | conversionTable[funcName];
            }
        }
        const toObject = this.toObject.bind(this);
        const entryEventHandler = (key: Data, value: Data, oldValue: Data, mergingValue: Data, eventType: number,
                                   uuid: UUID, numberOfAffectedEntries: number): void => {
            const member = this.client.getClusterService().getMember(uuid);
            const name = this.name;

            key = toObject(key);
            value = toObject(value);
            oldValue = toObject(oldValue);
            mergingValue = toObject(mergingValue);

            const entryEvent = new EntryEvent(name, key, value, oldValue, mergingValue, member);

            const mapEvent = new MapEvent(name, numberOfAffectedEntries, member);

            switch (eventType) {
                case EventType.ADDED:
                    listener.added.apply(null, [entryEvent]);
                    break;
                case EventType.REMOVED:
                    listener.removed.apply(null, [entryEvent]);
                    break;
                case EventType.UPDATED:
                    listener.updated.apply(null, [entryEvent]);
                    break;
                case EventType.EVICTED:
                    listener.evicted.apply(null, [entryEvent]);
                    break;
                case EventType.EVICT_ALL:
                    listener.mapEvicted.apply(null, [mapEvent]);
                    break;
                case EventType.CLEAR_ALL:
                    listener.mapCleared.apply(null, [mapEvent]);
                    break;
                case EventType.MERGED:
                    listener.merged.apply(null, [entryEvent]);
                    break;
                case EventType.EXPIRED:
                    listener.expired.apply(null, [entryEvent]);
                    break;
                case EventType.LOADED:
                    listener.loaded.apply(null, [entryEvent]);
                    break;
            }
        };
        let codec: ListenerMessageCodec;
        let listenerHandler: (message: ClientMessage, handler: EntryEventHander) => void;
        if (key && predicate) {
            const keyData = this.toData(key);
            const predicateData = this.toData(predicate);
            codec = this.createEntryListenerToKeyWithPredicate(this.name, keyData, predicateData, includeValue, flags);
            listenerHandler = MapAddEntryListenerToKeyWithPredicateCodec.handle;
        } else if (key && !predicate) {
            const keyData = this.toData(key);
            codec = this.createEntryListenerToKey(this.name, keyData, includeValue, flags);
            listenerHandler = MapAddEntryListenerToKeyCodec.handle;
        } else if (!key && predicate) {
            const predicateData = this.toData(predicate);
            codec = this.createEntryListenerWithPredicate(this.name, predicateData, includeValue, flags);
            listenerHandler = MapAddEntryListenerWithPredicateCodec.handle;
        } else {
            codec = this.createEntryListener(this.name, includeValue, flags);
            listenerHandler = MapAddEntryListenerCodec.handle;
        }
        return this.client.getListenerService()
            .registerListener(codec, (m: ClientMessage): void => {
                listenerHandler(m, entryEventHandler);
            });
    }

    private createEntryListenerToKey(name: string, keyData: Data, includeValue: boolean, flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerToKeyCodec.encodeRequest(name, keyData, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return MapAddEntryListenerToKeyCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListenerToKeyWithPredicate(name: string, keyData: Data, predicateData: Data, includeValue: boolean,
                                                  flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerToKeyWithPredicateCodec.encodeRequest(name, keyData, predicateData, includeValue,
                    flags, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return MapAddEntryListenerToKeyWithPredicateCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListenerWithPredicate(name: string, predicateData: Data, includeValue: boolean,
                                             flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerWithPredicateCodec.encodeRequest(name, predicateData, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return MapAddEntryListenerWithPredicateCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListener(name: string, includeValue: boolean, flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerCodec.encodeRequest(name, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return MapAddEntryListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private checkNotPagingPredicate(v: Predicate): void {
        if (v instanceof PagingPredicateImpl) {
            throw new RangeError('Paging predicate is not supported.');
        }
    }

}
