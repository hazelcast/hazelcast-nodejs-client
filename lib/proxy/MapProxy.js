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
exports.MapProxy = void 0;
const MapAddEntryListenerCodec_1 = require("../codec/MapAddEntryListenerCodec");
const MapAddEntryListenerToKeyCodec_1 = require("../codec/MapAddEntryListenerToKeyCodec");
const MapAddEntryListenerToKeyWithPredicateCodec_1 = require("../codec/MapAddEntryListenerToKeyWithPredicateCodec");
const MapAddEntryListenerWithPredicateCodec_1 = require("../codec/MapAddEntryListenerWithPredicateCodec");
const MapAddIndexCodec_1 = require("../codec/MapAddIndexCodec");
const MapAggregateCodec_1 = require("../codec/MapAggregateCodec");
const MapAggregateWithPredicateCodec_1 = require("../codec/MapAggregateWithPredicateCodec");
const MapClearCodec_1 = require("../codec/MapClearCodec");
const MapContainsKeyCodec_1 = require("../codec/MapContainsKeyCodec");
const MapContainsValueCodec_1 = require("../codec/MapContainsValueCodec");
const MapDeleteCodec_1 = require("../codec/MapDeleteCodec");
const MapEntriesWithPredicateCodec_1 = require("../codec/MapEntriesWithPredicateCodec");
const MapEntrySetCodec_1 = require("../codec/MapEntrySetCodec");
const MapEvictAllCodec_1 = require("../codec/MapEvictAllCodec");
const MapEvictCodec_1 = require("../codec/MapEvictCodec");
const MapExecuteOnAllKeysCodec_1 = require("../codec/MapExecuteOnAllKeysCodec");
const MapExecuteOnKeyCodec_1 = require("../codec/MapExecuteOnKeyCodec");
const MapExecuteOnKeysCodec_1 = require("../codec/MapExecuteOnKeysCodec");
const MapExecuteWithPredicateCodec_1 = require("../codec/MapExecuteWithPredicateCodec");
const MapFlushCodec_1 = require("../codec/MapFlushCodec");
const MapForceUnlockCodec_1 = require("../codec/MapForceUnlockCodec");
const MapGetAllCodec_1 = require("../codec/MapGetAllCodec");
const MapGetCodec_1 = require("../codec/MapGetCodec");
const MapGetEntryViewCodec_1 = require("../codec/MapGetEntryViewCodec");
const MapIsEmptyCodec_1 = require("../codec/MapIsEmptyCodec");
const MapIsLockedCodec_1 = require("../codec/MapIsLockedCodec");
const MapKeySetCodec_1 = require("../codec/MapKeySetCodec");
const MapKeySetWithPagingPredicateCodec_1 = require("../codec/MapKeySetWithPagingPredicateCodec");
const MapKeySetWithPredicateCodec_1 = require("../codec/MapKeySetWithPredicateCodec");
const MapLoadAllCodec_1 = require("../codec/MapLoadAllCodec");
const MapLoadGivenKeysCodec_1 = require("../codec/MapLoadGivenKeysCodec");
const MapLockCodec_1 = require("../codec/MapLockCodec");
const MapPutAllCodec_1 = require("../codec/MapPutAllCodec");
const MapPutCodec_1 = require("../codec/MapPutCodec");
const MapPutWithMaxIdleCodec_1 = require("../codec/MapPutWithMaxIdleCodec");
const MapPutIfAbsentCodec_1 = require("../codec/MapPutIfAbsentCodec");
const MapPutIfAbsentWithMaxIdleCodec_1 = require("../codec/MapPutIfAbsentWithMaxIdleCodec");
const MapPutTransientCodec_1 = require("../codec/MapPutTransientCodec");
const MapPutTransientWithMaxIdleCodec_1 = require("../codec/MapPutTransientWithMaxIdleCodec");
const MapRemoveCodec_1 = require("../codec/MapRemoveCodec");
const MapRemoveEntryListenerCodec_1 = require("../codec/MapRemoveEntryListenerCodec");
const MapRemoveIfSameCodec_1 = require("../codec/MapRemoveIfSameCodec");
const MapReplaceCodec_1 = require("../codec/MapReplaceCodec");
const MapReplaceIfSameCodec_1 = require("../codec/MapReplaceIfSameCodec");
const MapSetCodec_1 = require("../codec/MapSetCodec");
const MapSetWithMaxIdleCodec_1 = require("../codec/MapSetWithMaxIdleCodec");
const MapSetTtlCodec_1 = require("../codec/MapSetTtlCodec");
const MapSizeCodec_1 = require("../codec/MapSizeCodec");
const MapTryLockCodec_1 = require("../codec/MapTryLockCodec");
const MapTryPutCodec_1 = require("../codec/MapTryPutCodec");
const MapTryRemoveCodec_1 = require("../codec/MapTryRemoveCodec");
const MapUnlockCodec_1 = require("../codec/MapUnlockCodec");
const MapValuesCodec_1 = require("../codec/MapValuesCodec");
const MapValuesWithPagingPredicateCodec_1 = require("../codec/MapValuesWithPagingPredicateCodec");
const MapValuesWithPredicateCodec_1 = require("../codec/MapValuesWithPredicateCodec");
const EventType_1 = require("./EventType");
const SimpleEntryView_1 = require("../core/SimpleEntryView");
const MapListener_1 = require("./MapListener");
const Predicate_1 = require("../core/Predicate");
const ReadOnlyLazyList_1 = require("../core/ReadOnlyLazyList");
const DefaultPredicates_1 = require("../serialization/DefaultPredicates");
const Util_1 = require("../util/Util");
const BaseProxy_1 = require("./BaseProxy");
const EntryListener_1 = require("./EntryListener");
const IndexUtil_1 = require("../util/IndexUtil");
const PagingPredicateHolder_1 = require("../protocol/PagingPredicateHolder");
const MapEntriesWithPagingPredicateCodec_1 = require("../codec/MapEntriesWithPagingPredicateCodec");
const core_1 = require("../core");
const MapRemoveAllCodec_1 = require("../codec/MapRemoveAllCodec");
/** @internal */
class MapProxy extends BaseProxy_1.BaseProxy {
    aggregate(aggregator) {
        (0, Util_1.assertNotNull)(aggregator);
        let aggregatorData;
        try {
            aggregatorData = this.toData(aggregator);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.aggregate(aggregator));
            }
            throw e;
        }
        return this.encodeInvokeOnRandomTarget(MapAggregateCodec_1.MapAggregateCodec, (clientMessage) => {
            const response = MapAggregateCodec_1.MapAggregateCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, aggregatorData);
    }
    aggregateWithPredicate(aggregator, predicate) {
        (0, Util_1.assertNotNull)(aggregator);
        (0, Util_1.assertNotNull)(predicate);
        MapProxy.checkNotPagingPredicate(predicate);
        let aggregatorData, predicateData;
        try {
            aggregatorData = this.toData(aggregator);
            predicateData = this.toData(predicate);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.aggregateWithPredicate(aggregator, predicate));
            }
            throw e;
        }
        return this.encodeInvokeOnRandomTarget(MapAggregateWithPredicateCodec_1.MapAggregateWithPredicateCodec, (clientMessage) => {
            const response = MapAggregateWithPredicateCodec_1.MapAggregateWithPredicateCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, aggregatorData, predicateData);
    }
    executeOnKeys(keys, entryProcessor) {
        (0, Util_1.assertNotNull)(keys);
        (0, Util_1.assertArray)(keys);
        if (keys.length === 0) {
            return Promise.resolve([]);
        }
        else {
            let keysData;
            let proData;
            try {
                keysData = this.serializeList(keys);
                proData = this.toData(entryProcessor);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.executeOnKeys(keys, entryProcessor));
                }
                throw e;
            }
            return this.encodeInvokeOnRandomTarget(MapExecuteOnKeysCodec_1.MapExecuteOnKeysCodec, (clientMessage) => {
                const response = MapExecuteOnKeysCodec_1.MapExecuteOnKeysCodec.decodeResponse(clientMessage);
                return this.deserializeEntryList(response);
            }, proData, keysData);
        }
    }
    executeOnKey(key, entryProcessor) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(entryProcessor);
        let keyData, proData;
        try {
            keyData = this.toData(key);
            proData = this.toData(entryProcessor);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.executeOnKey(key, entryProcessor));
            }
            throw e;
        }
        return this.executeOnKeyInternal(keyData, proData);
    }
    executeOnEntries(entryProcessor, predicate) {
        (0, Util_1.assertNotNull)(entryProcessor);
        (0, Util_1.assertNotNull)(predicate);
        let proData;
        try {
            proData = this.toData(entryProcessor);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.executeOnEntries(entryProcessor, predicate));
            }
            throw e;
        }
        if (predicate === undefined) {
            return this.encodeInvokeOnRandomTarget(MapExecuteOnAllKeysCodec_1.MapExecuteOnAllKeysCodec, (clientMessage) => {
                const response = MapExecuteOnAllKeysCodec_1.MapExecuteOnAllKeysCodec.decodeResponse(clientMessage);
                return this.deserializeEntryList(response);
            }, proData);
        }
        else {
            let predData;
            try {
                predData = this.toData(predicate);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.executeOnEntries(entryProcessor, predicate));
                }
                throw e;
            }
            return this.encodeInvokeOnRandomTarget(MapExecuteWithPredicateCodec_1.MapExecuteWithPredicateCodec, (clientMessage) => {
                const response = MapExecuteWithPredicateCodec_1.MapExecuteWithPredicateCodec.decodeResponse(clientMessage);
                return this.deserializeEntryList(response);
            }, proData, predData);
        }
    }
    entrySetWithPredicate(predicate) {
        (0, Util_1.assertNotNull)(predicate);
        if (predicate instanceof DefaultPredicates_1.PagingPredicateImpl) {
            predicate.setIterationType(Predicate_1.IterationType.ENTRY);
            const serializationService = this.serializationService;
            let pagingPredicateHolder;
            try {
                pagingPredicateHolder = PagingPredicateHolder_1.PagingPredicateHolder.of(predicate, serializationService);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.entrySetWithPredicate(predicate));
                }
                throw e;
            }
            return this.encodeInvokeOnRandomTarget(MapEntriesWithPagingPredicateCodec_1.MapEntriesWithPagingPredicateCodec, (clientMessage) => {
                const response = MapEntriesWithPagingPredicateCodec_1.MapEntriesWithPagingPredicateCodec.decodeResponse(clientMessage);
                const anchorList = response.anchorDataList.asAnchorList(serializationService);
                const responseList = this.deserializeEntryList(response.response);
                predicate.setAnchorList(anchorList);
                return responseList;
            }, pagingPredicateHolder);
        }
        else {
            let pData;
            try {
                pData = this.toData(predicate);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.entrySetWithPredicate(predicate));
                }
                throw e;
            }
            return this.encodeInvokeOnRandomTarget(MapEntriesWithPredicateCodec_1.MapEntriesWithPredicateCodec, (clientMessage) => {
                const response = MapEntriesWithPredicateCodec_1.MapEntriesWithPredicateCodec.decodeResponse(clientMessage);
                return this.deserializeEntryList(response);
            }, pData);
        }
    }
    keySetWithPredicate(predicate) {
        (0, Util_1.assertNotNull)(predicate);
        if (predicate instanceof DefaultPredicates_1.PagingPredicateImpl) {
            predicate.setIterationType(Predicate_1.IterationType.KEY);
            const serializationService = this.serializationService;
            let pagingPredicateHolder;
            try {
                pagingPredicateHolder = PagingPredicateHolder_1.PagingPredicateHolder.of(predicate, serializationService);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.keySetWithPredicate(predicate));
                }
                throw e;
            }
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPagingPredicateCodec_1.MapKeySetWithPagingPredicateCodec, (clientMessage) => {
                const response = MapKeySetWithPagingPredicateCodec_1.MapKeySetWithPagingPredicateCodec.decodeResponse(clientMessage);
                const anchorList = response.anchorDataList.asAnchorList(serializationService);
                const responseList = this.deserializeList(response.response);
                predicate.setAnchorList(anchorList);
                return responseList;
            }, pagingPredicateHolder);
        }
        else {
            let predicateData;
            try {
                predicateData = this.toData(predicate);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.keySetWithPredicate(predicate));
                }
                throw e;
            }
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPredicateCodec_1.MapKeySetWithPredicateCodec, (clientMessage) => {
                const response = MapKeySetWithPredicateCodec_1.MapKeySetWithPredicateCodec.decodeResponse(clientMessage);
                return this.deserializeList(response);
            }, predicateData);
        }
    }
    valuesWithPredicate(predicate) {
        (0, Util_1.assertNotNull)(predicate);
        if (predicate instanceof DefaultPredicates_1.PagingPredicateImpl) {
            predicate.setIterationType(Predicate_1.IterationType.VALUE);
            const serializationService = this.serializationService;
            let pagingPredicateHolder;
            try {
                pagingPredicateHolder = PagingPredicateHolder_1.PagingPredicateHolder.of(predicate, serializationService);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.valuesWithPredicate(predicate));
                }
                throw e;
            }
            return this.encodeInvokeOnRandomTarget(MapValuesWithPagingPredicateCodec_1.MapValuesWithPagingPredicateCodec, (clientMessage) => {
                const response = MapValuesWithPagingPredicateCodec_1.MapValuesWithPagingPredicateCodec.decodeResponse(clientMessage);
                predicate.setAnchorList(response.anchorDataList.asAnchorList(serializationService));
                return new ReadOnlyLazyList_1.ReadOnlyLazyList(response.response, this.serializationService);
            }, pagingPredicateHolder);
        }
        else {
            let predicateData;
            try {
                predicateData = this.toData(predicate);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.valuesWithPredicate(predicate));
                }
                throw e;
            }
            return this.encodeInvokeOnRandomTarget(MapValuesWithPredicateCodec_1.MapValuesWithPredicateCodec, (clientMessage) => {
                const response = MapValuesWithPredicateCodec_1.MapValuesWithPredicateCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList_1.ReadOnlyLazyList(response, this.serializationService);
            }, predicateData);
        }
    }
    addEntryListenerWithPredicate(listener, predicate, key, includeValue = false) {
        return this.addEntryListenerInternal(listener, includeValue, key, predicate);
    }
    containsKey(key) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsKey(key));
            }
            throw e;
        }
        return this.containsKeyInternal(keyData);
    }
    containsValue(value) {
        (0, Util_1.assertNotNull)(value);
        let valueData;
        try {
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsValue(value));
            }
            throw e;
        }
        return this.encodeInvokeOnRandomTarget(MapContainsValueCodec_1.MapContainsValueCodec, MapContainsValueCodec_1.MapContainsValueCodec.decodeResponse, valueData);
    }
    put(key, value, ttl, maxIdle) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(value);
        let keyData, valueData;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.put(key, value, ttl, maxIdle));
            }
            throw e;
        }
        return this.putInternal(keyData, valueData, ttl, maxIdle);
    }
    putAll(pairs) {
        return this.putAllInternal(pairs, true);
    }
    setAll(pairs) {
        return this.putAllInternal(pairs, false);
    }
    get(key) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.get(key));
            }
            throw e;
        }
        return this.getInternal(keyData);
    }
    remove(key, value) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(value);
        let keyData;
        let valueData = undefined;
        try {
            keyData = this.toData(key);
            if (value !== undefined) {
                valueData = this.toData(value);
            }
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(key, value));
            }
            throw e;
        }
        return this.removeInternal(keyData, valueData);
    }
    removeAll(predicate) {
        (0, Util_1.assertNotNull)(predicate);
        return this.removeAllInternal(predicate);
    }
    size() {
        return this.encodeInvokeOnRandomTarget(MapSizeCodec_1.MapSizeCodec, MapSizeCodec_1.MapSizeCodec.decodeResponse);
    }
    clear() {
        return this.encodeInvokeOnRandomTarget(MapClearCodec_1.MapClearCodec, () => { });
    }
    isEmpty() {
        return this.encodeInvokeOnRandomTarget(MapIsEmptyCodec_1.MapIsEmptyCodec, MapIsEmptyCodec_1.MapIsEmptyCodec.decodeResponse);
    }
    getAll(keys) {
        (0, Util_1.assertNotNull)(keys);
        (0, Util_1.assertArray)(keys);
        const partitionService = this.partitionService;
        const partitionsToKeys = {};
        let key;
        for (const i in keys) {
            key = keys[i];
            let keyData;
            try {
                keyData = this.toData(key);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.getAll(keys));
                }
                throw e;
            }
            const pId = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push(keyData);
        }
        const result = [];
        return this.getAllInternal(partitionsToKeys, result).then(() => result);
    }
    delete(key) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.delete(key));
            }
            throw e;
        }
        return this.deleteInternal(keyData);
    }
    entrySet() {
        return this.encodeInvokeOnRandomTarget(MapEntrySetCodec_1.MapEntrySetCodec, (clientMessage) => {
            const response = MapEntrySetCodec_1.MapEntrySetCodec.decodeResponse(clientMessage);
            return this.deserializeEntryList(response);
        });
    }
    evict(key) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.evict(key));
            }
            throw e;
        }
        return this.evictInternal(keyData);
    }
    evictAll() {
        return this.encodeInvokeOnRandomTarget(MapEvictAllCodec_1.MapEvictAllCodec, () => { });
    }
    flush() {
        return this.encodeInvokeOnRandomTarget(MapFlushCodec_1.MapFlushCodec, () => { });
    }
    lock(key, leaseTime = -1) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.lock(key, leaseTime));
            }
            throw e;
        }
        return this.encodeInvokeOnKeyWithTimeout(Number.MAX_SAFE_INTEGER, MapLockCodec_1.MapLockCodec, keyData, () => { }, keyData, 0, leaseTime, 0);
    }
    isLocked(key) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.isLocked(key));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MapIsLockedCodec_1.MapIsLockedCodec, keyData, MapIsLockedCodec_1.MapIsLockedCodec.decodeResponse, keyData);
    }
    unlock(key) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.unlock(key));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MapUnlockCodec_1.MapUnlockCodec, keyData, () => { }, keyData, 0, 0);
    }
    forceUnlock(key) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.forceUnlock(key));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MapForceUnlockCodec_1.MapForceUnlockCodec, keyData, () => { }, keyData, 0);
    }
    keySet() {
        return this.encodeInvokeOnRandomTarget(MapKeySetCodec_1.MapKeySetCodec, (clientMessage) => {
            const response = MapKeySetCodec_1.MapKeySetCodec.decodeResponse(clientMessage);
            return this.deserializeList(response);
        });
    }
    loadAll(keys, replaceExistingValues = true) {
        if (keys === undefined) {
            return this.encodeInvokeOnRandomTarget(MapLoadAllCodec_1.MapLoadAllCodec, () => { }, replaceExistingValues);
        }
        else {
            let keysData;
            try {
                keysData = this.serializeList(keys);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.loadAll(keys, replaceExistingValues));
                }
                throw e;
            }
            return this.encodeInvokeOnRandomTarget(MapLoadGivenKeysCodec_1.MapLoadGivenKeysCodec, () => { }, keysData, replaceExistingValues);
        }
    }
    putIfAbsent(key, value, ttl, maxIdle) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(value);
        let keyData, valueData;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.putIfAbsent(key, value, ttl, maxIdle));
            }
            throw e;
        }
        return this.putIfAbsentInternal(keyData, valueData, ttl, maxIdle);
    }
    putTransient(key, value, ttl, maxIdle) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(value);
        let keyData, valueData;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.putTransient(key, value, ttl, maxIdle));
            }
            throw e;
        }
        return this.putTransientInternal(keyData, valueData, ttl, maxIdle);
    }
    replace(key, newValue) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(newValue);
        let newValueData, keyData;
        try {
            keyData = this.toData(key);
            newValueData = this.toData(newValue);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.replace(key, newValue));
            }
            throw e;
        }
        return this.replaceInternal(keyData, newValueData);
    }
    replaceIfSame(key, oldValue, newValue) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(oldValue);
        (0, Util_1.assertNotNull)(newValue);
        let newValueData, keyData, oldValueData;
        try {
            keyData = this.toData(key);
            newValueData = this.toData(newValue);
            oldValueData = this.toData(oldValue);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.replaceIfSame(key, oldValue, newValue));
            }
            throw e;
        }
        return this.replaceIfSameInternal(keyData, oldValueData, newValueData);
    }
    set(key, value, ttl, maxIdle) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(value);
        let keyData, valueData;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.set(key, value, ttl, maxIdle));
            }
            throw e;
        }
        return this.setInternal(keyData, valueData, ttl, maxIdle);
    }
    values() {
        return this.encodeInvokeOnRandomTarget(MapValuesCodec_1.MapValuesCodec, (clientMessage) => {
            const response = MapValuesCodec_1.MapValuesCodec.decodeResponse(clientMessage);
            return new ReadOnlyLazyList_1.ReadOnlyLazyList(response, this.serializationService);
        });
    }
    getEntryView(key) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.getEntryView(key));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MapGetEntryViewCodec_1.MapGetEntryViewCodec, keyData, (clientMessage) => {
            const response = MapGetEntryViewCodec_1.MapGetEntryViewCodec.decodeResponse(clientMessage);
            const dataEntryView = response.response;
            if (dataEntryView == null) {
                return null;
            }
            return new SimpleEntryView_1.SimpleEntryView(this.toObject(dataEntryView.key), this.toObject(dataEntryView.value), dataEntryView.cost, dataEntryView.creationTime, dataEntryView.expirationTime, dataEntryView.hits, dataEntryView.lastAccessTime, dataEntryView.lastStoredTime, dataEntryView.lastUpdateTime, dataEntryView.version, dataEntryView.ttl, response.maxIdle);
        }, keyData, 0);
    }
    addIndex(indexConfig) {
        (0, Util_1.assertNotNull)(indexConfig);
        const normalizedConfig = IndexUtil_1.IndexUtil.validateAndNormalize(this.name, indexConfig);
        return this.encodeInvokeOnRandomTarget(MapAddIndexCodec_1.MapAddIndexCodec, () => { }, normalizedConfig);
    }
    tryLock(key, timeout = 0, leaseTime = -1) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.tryLock(key, timeout, leaseTime));
            }
            throw e;
        }
        return this.encodeInvokeOnKeyWithTimeout(Number.MAX_SAFE_INTEGER, MapTryLockCodec_1.MapTryLockCodec, keyData, MapTryLockCodec_1.MapTryLockCodec.decodeResponse, keyData, 0, leaseTime, timeout, 0);
    }
    tryPut(key, value, timeout) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(value);
        (0, Util_1.assertNotNull)(timeout);
        let keyData, valueData;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.tryPut(key, value, timeout));
            }
            throw e;
        }
        return this.tryPutInternal(keyData, valueData, timeout);
    }
    tryRemove(key, timeout) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(timeout);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.tryRemove(key, timeout));
            }
            throw e;
        }
        return this.tryRemoveInternal(keyData, timeout);
    }
    addEntryListener(listener, key, includeValue = false) {
        return this.addEntryListenerInternal(listener, includeValue, key);
    }
    removeEntryListener(listenerId) {
        return this.listenerService.deregisterListener(listenerId);
    }
    setTtl(key, ttl) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(ttl);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.setTtl(key, ttl));
            }
            throw e;
        }
        return this.setTtlInternal(keyData, ttl);
    }
    executeOnKeyInternal(keyData, proData) {
        return this.encodeInvokeOnKey(MapExecuteOnKeyCodec_1.MapExecuteOnKeyCodec, keyData, (clientMessage) => {
            const response = MapExecuteOnKeyCodec_1.MapExecuteOnKeyCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, proData, keyData, 1);
    }
    containsKeyInternal(keyData) {
        return this.encodeInvokeOnKey(MapContainsKeyCodec_1.MapContainsKeyCodec, keyData, MapContainsKeyCodec_1.MapContainsKeyCodec.decodeResponse, keyData, 0);
    }
    putInternal(keyData, valueData, ttl = -1, maxIdle) {
        const handler = (clientMessage) => {
            const response = MapPutCodec_1.MapPutCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        };
        if (maxIdle !== undefined) {
            return this.encodeInvokeOnKey(MapPutWithMaxIdleCodec_1.MapPutWithMaxIdleCodec, keyData, handler, keyData, valueData, 0, ttl, maxIdle);
        }
        else {
            return this.encodeInvokeOnKey(MapPutCodec_1.MapPutCodec, keyData, handler, keyData, valueData, 0, ttl);
        }
    }
    finalizePutAll(_partitionsToKeys) {
        // No-op
    }
    getInternal(keyData) {
        return this.encodeInvokeOnKey(MapGetCodec_1.MapGetCodec, keyData, (clientMessage) => {
            const response = MapGetCodec_1.MapGetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData, 0);
    }
    removeInternal(keyData, valueData) {
        if (valueData === undefined) {
            return this.encodeInvokeOnKey(MapRemoveCodec_1.MapRemoveCodec, keyData, (clientMessage) => {
                const response = MapRemoveCodec_1.MapRemoveCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            }, keyData, 0);
        }
        else {
            return this.encodeInvokeOnKey(MapRemoveIfSameCodec_1.MapRemoveIfSameCodec, keyData, MapRemoveIfSameCodec_1.MapRemoveIfSameCodec.decodeResponse, keyData, valueData, 0);
        }
    }
    removeAllInternal(predicate) {
        let predicateData;
        try {
            predicateData = this.toData(predicate);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.removeAllInternal(predicate));
            }
            throw e;
        }
        return this.encodeInvokeOnRandomTarget(MapRemoveAllCodec_1.MapRemoveAllCodec, () => { }, predicateData);
    }
    getAllInternal(partitionsToKeys, result = []) {
        const partitionPromises = [];
        for (const partition in partitionsToKeys) {
            partitionPromises.push(this.encodeInvokeOnPartition(MapGetAllCodec_1.MapGetAllCodec, Number(partition), (clientMessage) => {
                const getAllResponse = MapGetAllCodec_1.MapGetAllCodec.decodeResponse(clientMessage);
                return this.deserializeEntryList(getAllResponse);
            }, partitionsToKeys[partition]));
        }
        return Promise.all(partitionPromises).then((entryArrayArray) => {
            const entryArray = Array.prototype.concat.apply([], entryArrayArray);
            result.push(...entryArray);
            return entryArray;
        });
    }
    deleteInternal(keyData) {
        return this.encodeInvokeOnKey(MapDeleteCodec_1.MapDeleteCodec, keyData, () => { }, keyData, 0);
    }
    evictInternal(keyData) {
        return this.encodeInvokeOnKey(MapEvictCodec_1.MapEvictCodec, keyData, MapEvictCodec_1.MapEvictCodec.decodeResponse, keyData, 0);
    }
    putIfAbsentInternal(keyData, valueData, ttl = -1, maxIdle) {
        const handler = (clientMessage) => {
            const response = MapPutIfAbsentCodec_1.MapPutIfAbsentCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        };
        if (maxIdle !== undefined) {
            return this.encodeInvokeOnKey(MapPutIfAbsentWithMaxIdleCodec_1.MapPutIfAbsentWithMaxIdleCodec, keyData, handler, keyData, valueData, 0, ttl, maxIdle);
        }
        else {
            return this.encodeInvokeOnKey(MapPutIfAbsentCodec_1.MapPutIfAbsentCodec, keyData, handler, keyData, valueData, 0, ttl);
        }
    }
    putTransientInternal(keyData, valueData, ttl = -1, maxIdle) {
        if (maxIdle !== undefined) {
            return this.encodeInvokeOnKey(MapPutTransientWithMaxIdleCodec_1.MapPutTransientWithMaxIdleCodec, keyData, () => { }, keyData, valueData, 0, ttl, maxIdle);
        }
        else {
            return this.encodeInvokeOnKey(MapPutTransientCodec_1.MapPutTransientCodec, keyData, () => { }, keyData, valueData, 0, ttl);
        }
    }
    replaceInternal(keyData, newValueData) {
        return this.encodeInvokeOnKey(MapReplaceCodec_1.MapReplaceCodec, keyData, (clientMessage) => {
            const response = MapReplaceCodec_1.MapReplaceCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData, newValueData, 0);
    }
    replaceIfSameInternal(keyData, oldValueData, newValueData) {
        return this.encodeInvokeOnKey(MapReplaceIfSameCodec_1.MapReplaceIfSameCodec, keyData, MapReplaceIfSameCodec_1.MapReplaceIfSameCodec.decodeResponse, keyData, oldValueData, newValueData, 0);
    }
    setInternal(keyData, valueData, ttl = -1, maxIdle) {
        if (maxIdle !== undefined) {
            return this.encodeInvokeOnKey(MapSetWithMaxIdleCodec_1.MapSetWithMaxIdleCodec, keyData, () => { }, keyData, valueData, 0, ttl, maxIdle);
        }
        else {
            return this.encodeInvokeOnKey(MapSetCodec_1.MapSetCodec, keyData, () => { }, keyData, valueData, 0, ttl);
        }
    }
    tryPutInternal(keyData, valueData, timeout) {
        return this.encodeInvokeOnKey(MapTryPutCodec_1.MapTryPutCodec, keyData, MapTryPutCodec_1.MapTryPutCodec.decodeResponse, keyData, valueData, 0, timeout);
    }
    tryRemoveInternal(keyData, timeout) {
        return this.encodeInvokeOnKey(MapTryRemoveCodec_1.MapTryRemoveCodec, keyData, MapTryRemoveCodec_1.MapTryRemoveCodec.decodeResponse, keyData, 0, timeout);
    }
    setTtlInternal(keyData, ttl) {
        return this.encodeInvokeOnKey(MapSetTtlCodec_1.MapSetTtlCodec, keyData, MapSetTtlCodec_1.MapSetTtlCodec.decodeResponse, keyData, ttl);
    }
    putAllInternal(pairs, triggerMapLoader) {
        const partitionService = this.partitionService;
        const partitionsToKeys = {};
        for (const pair of pairs) {
            (0, Util_1.assertNotNull)(pair[0]);
            (0, Util_1.assertNotNull)(pair[1]);
            try {
                const keyData = this.toData(pair[0]);
                const pId = partitionService.getPartitionId(keyData);
                if (!partitionsToKeys[pId]) {
                    partitionsToKeys[pId] = [];
                }
                partitionsToKeys[pId].push([keyData, this.toData(pair[1])]);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.putAllInternal(pairs, triggerMapLoader));
                }
                throw e;
            }
        }
        const partitionPromises = [];
        for (const partition in partitionsToKeys) {
            partitionPromises.push(this.encodeInvokeOnPartition(MapPutAllCodec_1.MapPutAllCodec, Number(partition), () => this.finalizePutAll(partitionsToKeys), partitionsToKeys[partition], triggerMapLoader));
        }
        return Promise.all(partitionPromises).then(() => { });
    }
    addEntryListenerInternal(listener, includeValue, key, predicate) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(predicate);
        let flags = null;
        const conversionTable = {
            added: EventType_1.EventType.ADDED,
            mapCleared: EventType_1.EventType.CLEAR_ALL,
            evicted: EventType_1.EventType.EVICTED,
            mapEvicted: EventType_1.EventType.EVICT_ALL,
            merged: EventType_1.EventType.MERGED,
            removed: EventType_1.EventType.REMOVED,
            updated: EventType_1.EventType.UPDATED,
            expired: EventType_1.EventType.EXPIRED,
            loaded: EventType_1.EventType.LOADED,
        };
        for (const funcName in conversionTable) {
            if (listener[funcName]) {
                flags = flags | conversionTable[funcName];
            }
        }
        const entryEventHandler = (key, value, oldValue, mergingValue, eventType, uuid, numberOfAffectedEntries) => {
            const member = this.clusterService.getMember(uuid.toString());
            const name = this.name;
            const entryEvent = new EntryListener_1.EntryEvent(name, this.toObject(key), this.toObject(value), this.toObject(oldValue), this.toObject(mergingValue), member);
            const mapEvent = new MapListener_1.MapEvent(name, numberOfAffectedEntries, member);
            switch (eventType) {
                case EventType_1.EventType.ADDED:
                    listener.added.apply(null, [entryEvent]);
                    break;
                case EventType_1.EventType.REMOVED:
                    listener.removed.apply(null, [entryEvent]);
                    break;
                case EventType_1.EventType.UPDATED:
                    listener.updated.apply(null, [entryEvent]);
                    break;
                case EventType_1.EventType.EVICTED:
                    listener.evicted.apply(null, [entryEvent]);
                    break;
                case EventType_1.EventType.EVICT_ALL:
                    listener.mapEvicted.apply(null, [mapEvent]);
                    break;
                case EventType_1.EventType.CLEAR_ALL:
                    listener.mapCleared.apply(null, [mapEvent]);
                    break;
                case EventType_1.EventType.MERGED:
                    listener.merged.apply(null, [entryEvent]);
                    break;
                case EventType_1.EventType.EXPIRED:
                    listener.expired.apply(null, [entryEvent]);
                    break;
                case EventType_1.EventType.LOADED:
                    listener.loaded.apply(null, [entryEvent]);
                    break;
            }
        };
        let codec;
        let listenerHandler;
        try {
            if (key !== undefined && predicate !== undefined) {
                const keyData = this.toData(key);
                const predicateData = this.toData(predicate);
                codec = this.createEntryListenerToKeyWithPredicate(this.name, keyData, predicateData, includeValue, flags);
                listenerHandler = MapAddEntryListenerToKeyWithPredicateCodec_1.MapAddEntryListenerToKeyWithPredicateCodec.handle;
            }
            else if (key !== undefined && predicate === undefined) {
                const keyData = this.toData(key);
                codec = this.createEntryListenerToKey(this.name, keyData, includeValue, flags);
                listenerHandler = MapAddEntryListenerToKeyCodec_1.MapAddEntryListenerToKeyCodec.handle;
            }
            else if (key === undefined && predicate !== undefined) {
                const predicateData = this.toData(predicate);
                codec = this.createEntryListenerWithPredicate(this.name, predicateData, includeValue, flags);
                listenerHandler = MapAddEntryListenerWithPredicateCodec_1.MapAddEntryListenerWithPredicateCodec.handle;
            }
            else {
                codec = this.createEntryListener(this.name, includeValue, flags);
                listenerHandler = MapAddEntryListenerCodec_1.MapAddEntryListenerCodec.handle;
            }
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addEntryListenerInternal(listener, includeValue, key, predicate));
            }
            throw e;
        }
        return this.listenerService.registerListener(codec, (m) => {
            listenerHandler(m, entryEventHandler);
        });
    }
    createEntryListenerToKey(name, keyData, includeValue, flags) {
        return {
            encodeAddRequest(localOnly) {
                return MapAddEntryListenerToKeyCodec_1.MapAddEntryListenerToKeyCodec.encodeRequest(name, keyData, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg) {
                return MapAddEntryListenerToKeyCodec_1.MapAddEntryListenerToKeyCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return MapRemoveEntryListenerCodec_1.MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
    createEntryListenerToKeyWithPredicate(name, keyData, predicateData, includeValue, flags) {
        return {
            encodeAddRequest(localOnly) {
                return MapAddEntryListenerToKeyWithPredicateCodec_1.MapAddEntryListenerToKeyWithPredicateCodec.encodeRequest(name, keyData, predicateData, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg) {
                return MapAddEntryListenerToKeyWithPredicateCodec_1.MapAddEntryListenerToKeyWithPredicateCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return MapRemoveEntryListenerCodec_1.MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
    createEntryListenerWithPredicate(name, predicateData, includeValue, flags) {
        return {
            encodeAddRequest(localOnly) {
                return MapAddEntryListenerWithPredicateCodec_1.MapAddEntryListenerWithPredicateCodec.encodeRequest(name, predicateData, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg) {
                return MapAddEntryListenerWithPredicateCodec_1.MapAddEntryListenerWithPredicateCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return MapRemoveEntryListenerCodec_1.MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
    createEntryListener(name, includeValue, flags) {
        return {
            encodeAddRequest(localOnly) {
                return MapAddEntryListenerCodec_1.MapAddEntryListenerCodec.encodeRequest(name, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg) {
                return MapAddEntryListenerCodec_1.MapAddEntryListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return MapRemoveEntryListenerCodec_1.MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
    static checkNotPagingPredicate(v) {
        if (v instanceof DefaultPredicates_1.PagingPredicateImpl) {
            throw new RangeError('Paging predicate is not supported.');
        }
    }
}
exports.MapProxy = MapProxy;
//# sourceMappingURL=MapProxy.js.map