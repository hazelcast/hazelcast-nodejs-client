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
import {MapPutWithMaxIdleCodec} from '../codec/MapPutWithMaxIdleCodec';
import {MapPutIfAbsentCodec} from '../codec/MapPutIfAbsentCodec';
import {MapPutIfAbsentWithMaxIdleCodec} from '../codec/MapPutIfAbsentWithMaxIdleCodec';
import {MapPutTransientCodec} from '../codec/MapPutTransientCodec';
import {MapPutTransientWithMaxIdleCodec} from '../codec/MapPutTransientWithMaxIdleCodec';
import {MapRemoveCodec} from '../codec/MapRemoveCodec';
import {MapRemoveEntryListenerCodec} from '../codec/MapRemoveEntryListenerCodec';
import {MapRemoveIfSameCodec} from '../codec/MapRemoveIfSameCodec';
import {MapReplaceCodec} from '../codec/MapReplaceCodec';
import {MapReplaceIfSameCodec} from '../codec/MapReplaceIfSameCodec';
import {MapSetCodec} from '../codec/MapSetCodec';
import {MapSetWithMaxIdleCodec} from '../codec/MapSetWithMaxIdleCodec';
import {MapSetTtlCodec} from '../codec/MapSetTtlCodec';
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
import * as Long from 'long';
import {SchemaNotReplicatedError} from '../core';

type EntryEventHandler = (key: Data, value: Data, oldValue: Data, mergingValue: Data, eventType: number,
                          uuid: UUID, numberOfAffectedEntries: number) => void;

/** @internal */
export class MapProxy<K, V> extends BaseProxy implements IMap<K, V> {
    aggregate<R>(aggregator: Aggregator<R>): Promise<R> {
        assertNotNull(aggregator);
        const aggregatorData = this.toData(aggregator);
        return this.encodeInvokeOnRandomTarget(MapAggregateCodec, (clientMessage) => {
            const response = MapAggregateCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, aggregatorData);
    }

    aggregateWithPredicate<R>(aggregator: Aggregator<R>, predicate: Predicate): Promise<R> {
        assertNotNull(aggregator);
        assertNotNull(predicate);
        MapProxy.checkNotPagingPredicate(predicate);
        const aggregatorData = this.toData(aggregator);
        const predicateData = this.toData(predicate);
        return this.encodeInvokeOnRandomTarget(MapAggregateWithPredicateCodec, (clientMessage) => {
            const response = MapAggregateWithPredicateCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, aggregatorData, predicateData);
    }

    executeOnKeys(keys: K[], entryProcessor: IdentifiedDataSerializable | Portable): Promise<any[]> {
        assertNotNull(keys);
        assertArray(keys);
        if (keys.length === 0) {
            return Promise.resolve([]);
        } else {
            try {
                const toObject = this.toObject.bind(this);
                const keysData = this.serializeList(keys);
                const proData = this.toData(entryProcessor);
                return this.encodeInvokeOnRandomTarget(MapExecuteOnKeysCodec, (clientMessage) => {
                    const response = MapExecuteOnKeysCodec.decodeResponse(clientMessage);
                    return this.deserializeEntryList(toObject, response);
                }, proData, keysData);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.executeOnKeys(keys, entryProcessor));
                }
                return Promise.reject(e);
            }
        }
    }

    executeOnKey(key: K, entryProcessor: IdentifiedDataSerializable | Portable): Promise<V> {
        assertNotNull(key);
        assertNotNull(entryProcessor);
        try {
            const keyData = this.toData(key);
            const proData = this.toData(entryProcessor);
            return this.executeOnKeyInternal(keyData, proData);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.executeOnKey(key, entryProcessor));
            }
            return Promise.reject(e);
        }
    }

    executeOnEntries(entryProcessor: IdentifiedDataSerializable | Portable, predicate: Predicate = null): Promise<Array<[K, V]>> {
        assertNotNull(entryProcessor);
        let proData;
        const toObject = this.toObject.bind(this);
        try {
            proData = this.toData(entryProcessor);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.executeOnEntries(entryProcessor, predicate));
            }
            return Promise.reject(e);
        }

        if (predicate == null) {
            return this.encodeInvokeOnRandomTarget(MapExecuteOnAllKeysCodec, (clientMessage) => {
                const response = MapExecuteOnAllKeysCodec.decodeResponse(clientMessage);
                return this.deserializeEntryList(toObject, response);
            }, proData);
        } else {
            const predData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapExecuteWithPredicateCodec, (clientMessage) => {
                const response = MapExecuteWithPredicateCodec.decodeResponse(clientMessage);
                return this.deserializeEntryList(toObject, response);
            }, proData, predData);
        }

    }

    entrySetWithPredicate(predicate: Predicate): Promise<any[]> {
        assertNotNull(predicate);

        const toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicateImpl) {
            predicate.setIterationType(IterationType.ENTRY);
            const serializationService = this.serializationService;
            let pagingPredicateHolder;
            try {
                pagingPredicateHolder = PagingPredicateHolder.of(predicate, serializationService);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.entrySetWithPredicate(predicate));
                }
                return Promise.reject(e);
            }
            return this.encodeInvokeOnRandomTarget(MapEntriesWithPagingPredicateCodec, (clientMessage) => {
                const response = MapEntriesWithPagingPredicateCodec.decodeResponse(clientMessage);
                predicate.setAnchorList(response.anchorDataList.asAnchorList(serializationService));
                return this.deserializeEntryList(toObject, response.response);
            }, pagingPredicateHolder);
        } else {
            const pData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapEntriesWithPredicateCodec, (clientMessage) => {
                const response = MapEntriesWithPredicateCodec.decodeResponse(clientMessage);
                return this.deserializeEntryList(toObject, response);
            }, pData);
        }
    }

    keySetWithPredicate(predicate: Predicate): Promise<K[]> {
        assertNotNull(predicate);

        const toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicateImpl) {
            predicate.setIterationType(IterationType.KEY);
            const serializationService = this.serializationService;
            let pagingPredicateHolder;
            try {
                pagingPredicateHolder = PagingPredicateHolder.of(predicate, serializationService);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.keySetWithPredicate(predicate));
                }
                return Promise.reject(e);
            }
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPagingPredicateCodec, (clientMessage) => {
                const response = MapKeySetWithPagingPredicateCodec.decodeResponse(clientMessage);
                predicate.setAnchorList(response.anchorDataList.asAnchorList(serializationService));
                return response.response.map<K>(toObject);
            }, pagingPredicateHolder);
        } else {
            const predicateData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPredicateCodec, (clientMessage) => {
                const response = MapKeySetWithPredicateCodec.decodeResponse(clientMessage);
                return response.map<K>(toObject);
            }, predicateData);
        }
    }

    valuesWithPredicate(predicate: Predicate): Promise<ReadOnlyLazyList<V>> {
        assertNotNull(predicate);
        if (predicate instanceof PagingPredicateImpl) {
            predicate.setIterationType(IterationType.VALUE);
            const serializationService = this.serializationService;
            let pagingPredicateHolder;
            try {
                pagingPredicateHolder = PagingPredicateHolder.of(predicate, serializationService);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.valuesWithPredicate(predicate));
                }
                return Promise.reject(e);
            }
            return this.encodeInvokeOnRandomTarget(MapValuesWithPagingPredicateCodec, (clientMessage) => {
                const response = MapValuesWithPagingPredicateCodec.decodeResponse(clientMessage);
                predicate.setAnchorList(response.anchorDataList.asAnchorList(serializationService));
                return new ReadOnlyLazyList(response.response, serializationService);
            }, pagingPredicateHolder);
        } else {
            const predicateData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapValuesWithPredicateCodec, (clientMessage) => {
                const response = MapValuesWithPredicateCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList(response, this.serializationService);
            }, predicateData);
        }
    }

    addEntryListenerWithPredicate(listener: MapListener<K, V>, predicate: Predicate, key: K,
                                  includeValue: boolean): Promise<string> {
        return this.addEntryListenerInternal(listener, predicate, key, includeValue);
    }

    containsKey(key: K): Promise<boolean> {
        assertNotNull(key);
        try {
            const keyData = this.toData(key);
            return this.containsKeyInternal(keyData);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsKey(key));
            }
            return Promise.reject(e);
        }
    }

    containsValue(value: V): Promise<boolean> {
        assertNotNull(value);
        try {
            const valueData = this.toData(value);
            return this.encodeInvokeOnRandomTarget(MapContainsValueCodec, MapContainsValueCodec.decodeResponse, valueData);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsValue(value));
            }
            return Promise.reject(e);
        }
    }

    put(key: K, value: V, ttl?: number | Long, maxIdle?: number | Long): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        try {
            const keyData: Data = this.toData(key);
            const valueData: Data = this.toData(value);
            return this.putInternal(keyData, valueData, ttl, maxIdle);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.put(key, value, ttl, maxIdle));
            }
            return Promise.reject(e);
        }
    }

    putAll(pairs: Array<[K, V]>): Promise<void> {
        return this.putAllInternal(pairs, true);
    }

    setAll(pairs: Array<[K, V]>): Promise<void> {
        return this.putAllInternal(pairs, false);
    }

    get(key: K): Promise<V> {
        assertNotNull(key);
        try {
            const keyData = this.toData(key);
            return this.getInternal(keyData);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.get(key));
            }
            return Promise.reject(e);
        }
    }

    remove(key: K, value: V = null): Promise<V | boolean> {
        assertNotNull(key);
        try {
            const keyData = this.toData(key);
            return this.removeInternal(keyData, value);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(key, value));
            }
            return Promise.reject(e);
        }
    }

    size(): Promise<number> {
        return this.encodeInvokeOnRandomTarget(MapSizeCodec, MapSizeCodec.decodeResponse);
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(MapClearCodec, () => {});
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvokeOnRandomTarget(MapIsEmptyCodec, MapIsEmptyCodec.decodeResponse);
    }

    getAll(keys: K[]): Promise<any[]> {
        assertNotNull(keys);
        assertArray(keys);
        const partitionService = this.partitionService;
        const partitionsToKeys: { [id: string]: Data[] } = {};
        let key: K;
        for (const i in keys) {
            key = keys[i];
            let keyData;
            try {
                keyData = this.toData(key);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.getAll(keys));
                }
                return Promise.reject(e);
            }
            const pId: number = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push(keyData);
        }
        const result: Array<[any, any]> = [];
        return this.getAllInternal(partitionsToKeys, result).then(() => result);
    }

    delete(key: K): Promise<void> {
        assertNotNull(key);
        try {
            const keyData = this.toData(key);
            return this.deleteInternal(keyData);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.delete(key));
            }
            return Promise.reject(e);
        }
    }

    entrySet(): Promise<any[]> {
        return this.encodeInvokeOnRandomTarget(MapEntrySetCodec, (clientMessage) => {
            const response = MapEntrySetCodec.decodeResponse(clientMessage);
            return this.deserializeEntryList(this.toObject.bind(this), response);
        });
    }

    evict(key: K): Promise<boolean> {
        assertNotNull(key);
        try {
            const keyData = this.toData(key);
            return this.evictInternal(keyData);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.evict(key));
            }
            return Promise.reject(e);
        }
    }

    evictAll(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(MapEvictAllCodec, () => {});
    }

    flush(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(MapFlushCodec, () => {});
    }

    lock(key: K, leaseTime = -1): Promise<void> {
        assertNotNull(key);
        try {
            const keyData = this.toData(key);
            return this.encodeInvokeOnKeyWithTimeout(
                Number.MAX_SAFE_INTEGER, MapLockCodec, keyData, () => {}, keyData, 0, leaseTime, 0
        );} catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.lock(key, leaseTime));
            }
            return Promise.reject(e);
        }

    }

    isLocked(key: K): Promise<boolean> {
        assertNotNull(key);
        try {
            const keyData = this.toData(key);
            return this.encodeInvokeOnKey(MapIsLockedCodec, keyData, MapIsLockedCodec.decodeResponse, keyData);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.isLocked(key));
            }
            return Promise.reject(e);
        }
    }

    unlock(key: K): Promise<void> {
        assertNotNull(key);
        try {
            const keyData = this.toData(key);
            return this.encodeInvokeOnKey(MapUnlockCodec, keyData, () => {}, keyData, 0, 0);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.unlock(key));
            }
            return Promise.reject(e);
        }
    }

    forceUnlock(key: K): Promise<void> {
        assertNotNull(key);
        try {
            const keyData = this.toData(key);
            return this.encodeInvokeOnKey(MapForceUnlockCodec, keyData, () => {}, keyData, 0);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.forceUnlock(key));
            }
            return Promise.reject(e);
        }
    }

    keySet(): Promise<K[]> {
        return this.encodeInvokeOnRandomTarget(MapKeySetCodec, (clientMessage) => {
            const response = MapKeySetCodec.decodeResponse(clientMessage);
            return response.map<K>(this.toObject.bind(this));
        });
    }

    loadAll(keys: K[] = null, replaceExistingValues = true): Promise<void> {
        if (keys == null) {
            return this.encodeInvokeOnRandomTarget(MapLoadAllCodec, () => {}, replaceExistingValues);
        } else {
            try {
                const keysData: Data[] = keys.map<Data>(v => this.toData(v));
                return this.encodeInvokeOnRandomTarget(MapLoadGivenKeysCodec, () => {}, keysData, replaceExistingValues);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.loadAll(keys, replaceExistingValues));
                }
                return Promise.reject(e);
            }
        }
    }

    putIfAbsent(key: K, value: V, ttl?: number | Long, maxIdle?: number | Long): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        try {
            const keyData = this.toData(key);
            const valueData = this.toData(value);
            return this.putIfAbsentInternal(keyData, valueData, ttl, maxIdle);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.putIfAbsent(key, value, ttl, maxIdle));
            }
            return Promise.reject(e);
        }
    }


    putTransient(key: K, value: V, ttl?: number | Long, maxIdle?: number | Long): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        try {
            const keyData = this.toData(key);
            const valueData = this.toData(value);
            return this.putTransientInternal(keyData, valueData, ttl, maxIdle);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.putTransient(key, value, ttl, maxIdle));
            }
            return Promise.reject(e);
        }
    }

    replace(key: K, newValue: V): Promise<V> {
        assertNotNull(key);
        assertNotNull(newValue);
        try {
            const keyData = this.toData(key);
            const newValueData = this.toData(newValue);
            return this.replaceInternal(keyData, newValueData);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.replace(key, newValue));
            }
            return Promise.reject(e);
        }
    }

    replaceIfSame(key: K, oldValue: V, newValue: V): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(oldValue);
        assertNotNull(newValue);
        try {
            const keyData = this.toData(key);
            const newValueData = this.toData(newValue);
            const oldValueData = this.toData(oldValue);
            return this.replaceIfSameInternal(keyData, oldValueData, newValueData);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.replaceIfSame(key, oldValue, newValue));
            }
            return Promise.reject(e);
        }
    }

    set(key: K, value: V, ttl?: number | Long, maxIdle?: number | Long): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        try {
            const keyData: Data = this.toData(key);
            const valueData: Data = this.toData(value);
            return this.setInternal(keyData, valueData, ttl, maxIdle);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.set(key, value, ttl, maxIdle));
            }
            return Promise.reject(e);
        }
    }

    values(): Promise<ReadOnlyLazyList<V>> {
        return this.encodeInvokeOnRandomTarget(MapValuesCodec, (clientMessage) => {
            const response = MapValuesCodec.decodeResponse(clientMessage);
            return new ReadOnlyLazyList(response, this.serializationService);
        });
    }

    getEntryView(key: K): Promise<SimpleEntryView<K, V>> {
        assertNotNull(key);
        let keyData;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.getEntryView(key));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(MapGetEntryViewCodec, keyData, (clientMessage) => {
            const response = MapGetEntryViewCodec.decodeResponse(clientMessage);
            const dataEntryView = response.response;
            if (dataEntryView == null) {
                return null;
            }

            return new SimpleEntryView<K, V>(this.toObject(dataEntryView.key), this.toObject(dataEntryView.value),
                dataEntryView.cost, dataEntryView.creationTime, dataEntryView.expirationTime, dataEntryView.hits,
                dataEntryView.lastAccessTime, dataEntryView.lastStoredTime, dataEntryView.lastUpdateTime,
                dataEntryView.version, dataEntryView.ttl, response.maxIdle);
        }, keyData, 0);
    }

    addIndex(indexConfig: IndexConfig): Promise<void> {
        assertNotNull(indexConfig);
        const normalizedConfig = IndexUtil.validateAndNormalize(this.name, indexConfig);
        return this.encodeInvokeOnRandomTarget(MapAddIndexCodec, () => {}, normalizedConfig);
    }

    tryLock(key: K, timeout = 0, leaseTime = -1): Promise<boolean> {
        assertNotNull(key);
        let keyData;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.tryLock(key, timeout, leaseTime));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKeyWithTimeout(
            Number.MAX_SAFE_INTEGER, MapTryLockCodec, keyData, MapTryLockCodec.decodeResponse, keyData, 0, leaseTime, timeout, 0
        );
    }

    tryPut(key: K, value: V, timeout: number): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(value);
        assertNotNull(timeout);
        try {
            const keyData = this.toData(key);
            const valueData = this.toData(value);
            return this.tryPutInternal(keyData, valueData, timeout);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.tryPut(key, value, timeout));
            }
            return Promise.reject(e);
        }
    }

    tryRemove(key: K, timeout: number): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(timeout);
        let keyData;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.tryRemove(key, timeout));
            }
            return Promise.reject(e);
        }
        return this.tryRemoveInternal(keyData, timeout);
    }

    addEntryListener(listener: MapListener<K, V>, key: K, includeValue = false): Promise<string> {
        return this.addEntryListenerInternal(listener, undefined, key, includeValue);
    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.listenerService.deregisterListener(listenerId);
    }

    setTtl(key: K, ttl: number): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(ttl);
        let keyData;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.setTtl(key, ttl));
            }
            return Promise.reject(e);
        }
        return this.setTtlInternal(keyData, ttl);
    }

    protected executeOnKeyInternal(keyData: Data, proData: Data): Promise<V> {
        return this.encodeInvokeOnKey(MapExecuteOnKeyCodec, keyData, (clientMessage) => {
            const response = MapExecuteOnKeyCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, proData, keyData, 1);
    }

    protected containsKeyInternal(keyData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey(MapContainsKeyCodec, keyData, MapContainsKeyCodec.decodeResponse, keyData, 0);
    }

    protected putInternal(keyData: Data,
                          valueData: Data,
                          ttl: number | Long = -1,
                          maxIdle?: number | Long): Promise<V> {
        let request: Promise<V>;
        const handler = (clientMessage: ClientMessage) => {
            const response = MapPutCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        };
        if (maxIdle !== undefined) {
            request = this.encodeInvokeOnKey(MapPutWithMaxIdleCodec,
                keyData, handler, keyData, valueData, 0, ttl, maxIdle);
        } else {
            request = this.encodeInvokeOnKey(MapPutCodec,
                keyData, handler, keyData, valueData, 0, ttl);
        }
        return request;
    }

    protected finalizePutAll(_partitionsToKeys: { [id: string]: Array<[Data, Data]> }): void {
        // No-op
    }

    protected getInternal(keyData: Data): Promise<V> {
        return this.encodeInvokeOnKey(MapGetCodec, keyData, (clientMessage: ClientMessage) => {
            const response = MapGetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData, 0);
    }

    protected removeInternal(keyData: Data, value: V = null): Promise<V | boolean> {
        if (value == null) {
            return this.encodeInvokeOnKey(MapRemoveCodec, keyData, (clientMessage) => {
                const response = MapRemoveCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            }, keyData, 0)
        } else {
            const valueData = this.toData(value);
            return this.encodeInvokeOnKey(
                MapRemoveIfSameCodec, keyData, MapRemoveIfSameCodec.decodeResponse, keyData, valueData, 0
            );
        }
    }

    protected getAllInternal(partitionsToKeys: { [id: string]: Data[] },
                             result: Array<[any, any]> = []): Promise<Array<[Data, Data]>> {
        const partitionPromises: Array<Promise<Array<[Data, Data]>>> = [];
        for (const partition in partitionsToKeys) {
            partitionPromises.push(
                this.encodeInvokeOnPartition(
                    MapGetAllCodec, Number(partition), MapGetAllCodec.decodeResponse, partitionsToKeys[partition]
                )
            );
        }
        const toObject = this.toObject.bind(this);
        const deserializeEntry = function (entry: [Data, Data]): [any, any] {
            return [toObject(entry[0]), toObject(entry[1])];
        };
        return Promise.all(partitionPromises)
            .then(function (serializedEntryArrayArray: Array<Array<[Data, Data]>>): any[] {
                const serializedEntryArray = Array.prototype.concat.apply([], serializedEntryArrayArray);
                result.push(...(serializedEntryArray.map(deserializeEntry)));
                return serializedEntryArray;
            });
    }

    protected deleteInternal(keyData: Data): Promise<void> {
        return this.encodeInvokeOnKey(MapDeleteCodec, keyData, () => {}, keyData, 0);
    }

    protected evictInternal(keyData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey(MapEvictCodec, keyData, MapEvictCodec.decodeResponse, keyData, 0);
    }

    protected putIfAbsentInternal(keyData: Data,
                                  valueData: Data,
                                  ttl: number | Long = -1,
                                  maxIdle?: number | Long): Promise<V> {
        const handler = (clientMessage: ClientMessage) => {
            const response = MapPutIfAbsentCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        };

        if (maxIdle !== undefined) {
            return this.encodeInvokeOnKey(MapPutIfAbsentWithMaxIdleCodec,
                keyData, handler, keyData, valueData, 0, ttl, maxIdle);
        } else {
            return this.encodeInvokeOnKey(MapPutIfAbsentCodec,
                keyData, handler, keyData, valueData, 0, ttl);
        }
    }

    protected putTransientInternal(keyData: Data,
                                   valueData: Data,
                                   ttl: number | Long = -1,
                                   maxIdle?: number | Long): Promise<void> {
        if (maxIdle !== undefined) {
            return this.encodeInvokeOnKey(MapPutTransientWithMaxIdleCodec,
                keyData, () => {}, keyData, valueData, 0, ttl, maxIdle);
        } else {
            return this.encodeInvokeOnKey(MapPutTransientCodec,
                keyData, () => {}, keyData, valueData, 0, ttl)
        }
    }

    protected replaceInternal(keyData: Data, newValueData: Data): Promise<V> {
        return this.encodeInvokeOnKey(MapReplaceCodec, keyData, (clientMessage) => {
            const response = MapReplaceCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData, newValueData, 0);
    }

    protected replaceIfSameInternal(keyData: Data, oldValueData: Data, newValueData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey(
            MapReplaceIfSameCodec, keyData, MapReplaceIfSameCodec.decodeResponse, keyData, oldValueData, newValueData, 0
        );
    }

    protected setInternal(keyData: Data,
                          valueData: Data,
                          ttl: number | Long = -1,
                          maxIdle?: number | Long): Promise<void> {
        if (maxIdle !== undefined) {
            return this.encodeInvokeOnKey(MapSetWithMaxIdleCodec,
                keyData, () => {}, keyData, valueData, 0, ttl, maxIdle);
        } else {
            return this.encodeInvokeOnKey(MapSetCodec,
                keyData, () => {}, keyData, valueData, 0, ttl);
        }
    }

    protected tryPutInternal(keyData: Data, valueData: Data, timeout: number): Promise<boolean> {
        return this.encodeInvokeOnKey(MapTryPutCodec, keyData, MapTryPutCodec.decodeResponse, keyData, valueData, 0, timeout);
    }

    protected tryRemoveInternal(keyData: Data, timeout: number): Promise<boolean> {
        return this.encodeInvokeOnKey(MapTryRemoveCodec, keyData, MapTryRemoveCodec.decodeResponse, keyData, 0, timeout);
    }

    protected setTtlInternal(keyData: Data, ttl: number): Promise<boolean> {
        return this.encodeInvokeOnKey(MapSetTtlCodec, keyData, MapSetTtlCodec.decodeResponse, keyData, ttl);
    }

    private putAllInternal(pairs: Array<[K, V]>, triggerMapLoader: boolean): Promise<void> {
        const partitionService = this.partitionService;
        const partitionsToKeys: { [id: number]: Array<[Data, Data]> } = {};
        for (const pair of pairs) {
            assertNotNull(pair[0]);
            assertNotNull(pair[1]);
            try {
                const keyData = this.toData(pair[0]);
                const pId: number = partitionService.getPartitionId(keyData);
                if (!partitionsToKeys[pId]) {
                    partitionsToKeys[pId] = [];
                }
                partitionsToKeys[pId].push([keyData, this.toData(pair[1])]);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.putAllInternal(pairs, triggerMapLoader));
                }
                return Promise.reject(e);
            }
        }

        const partitionPromises: Array<Promise<void>> = [];
        for (const partition in partitionsToKeys) {
            partitionPromises.push(
                this.encodeInvokeOnPartition(
                    MapPutAllCodec,
                    Number(partition),
                    () => this.finalizePutAll(partitionsToKeys),
                    partitionsToKeys[partition],
                    triggerMapLoader
                )
            );
        }
        return Promise.all(partitionPromises).then(() => {});
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
        const entryEventHandler = (key: Data, value: Data, oldValue: Data, mergingValue: Data, eventType: number,
                                   uuid: UUID, numberOfAffectedEntries: number): void => {
            const member = this.clusterService.getMember(uuid.toString());
            const name = this.name;

            const entryEvent = new EntryEvent(
                name,
                this.toObject(key),
                this.toObject(value),
                this.toObject(oldValue),
                this.toObject(mergingValue),
                member
            );

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
        let listenerHandler: (message: ClientMessage, handler: EntryEventHandler) => void;
        try {
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
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(
                    () => this.addEntryListenerInternal(listener, predicate, key, includeValue)
                );
            }
            return Promise.reject(e);
        }

        return this.listenerService.registerListener(codec, (m: ClientMessage): void => {
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

    private static checkNotPagingPredicate(v: Predicate): void {
        if (v instanceof PagingPredicateImpl) {
            throw new RangeError('Paging predicate is not supported.');
        }
    }
}
