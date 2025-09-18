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
exports.MultiMapProxy = void 0;
const MultiMapForceUnlockCodec_1 = require("../codec/MultiMapForceUnlockCodec");
const MultiMapIsLockedCodec_1 = require("../codec/MultiMapIsLockedCodec");
const MultiMapLockCodec_1 = require("../codec/MultiMapLockCodec");
const MultiMapTryLockCodec_1 = require("../codec/MultiMapTryLockCodec");
const MultiMapUnlockCodec_1 = require("../codec/MultiMapUnlockCodec");
const EventType_1 = require("./EventType");
const EntryListener_1 = require("./EntryListener");
const MultiMapAddEntryListenerCodec_1 = require("../codec/MultiMapAddEntryListenerCodec");
const MultiMapAddEntryListenerToKeyCodec_1 = require("../codec/MultiMapAddEntryListenerToKeyCodec");
const MultiMapClearCodec_1 = require("../codec/MultiMapClearCodec");
const MultiMapContainsEntryCodec_1 = require("../codec/MultiMapContainsEntryCodec");
const MultiMapContainsKeyCodec_1 = require("../codec/MultiMapContainsKeyCodec");
const MultiMapContainsValueCodec_1 = require("../codec/MultiMapContainsValueCodec");
const MultiMapEntrySetCodec_1 = require("../codec/MultiMapEntrySetCodec");
const MultiMapGetCodec_1 = require("../codec/MultiMapGetCodec");
const MultiMapKeySetCodec_1 = require("../codec/MultiMapKeySetCodec");
const MultiMapPutCodec_1 = require("../codec/MultiMapPutCodec");
const MultiMapRemoveCodec_1 = require("../codec/MultiMapRemoveCodec");
const MultiMapRemoveEntryCodec_1 = require("../codec/MultiMapRemoveEntryCodec");
const MultiMapRemoveEntryListenerCodec_1 = require("../codec/MultiMapRemoveEntryListenerCodec");
const MultiMapSizeCodec_1 = require("../codec/MultiMapSizeCodec");
const MultiMapValueCountCodec_1 = require("../codec/MultiMapValueCountCodec");
const MultiMapValuesCodec_1 = require("../codec/MultiMapValuesCodec");
const BaseProxy_1 = require("./BaseProxy");
const MapListener_1 = require("./MapListener");
const core_1 = require("../core");
const MultiMapPutAllCodec_1 = require("../codec/MultiMapPutAllCodec");
/** @internal */
class MultiMapProxy extends BaseProxy_1.BaseProxy {
    constructor(serviceName, name, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, lockReferenceIdGenerator, connectionRegistry, schemaService) {
        super(serviceName, name, proxyManager, partitionService, invocationService, serializationService, listenerService, clusterService, connectionRegistry, schemaService);
        this.lockReferenceIdGenerator = lockReferenceIdGenerator;
    }
    put(key, value) {
        let keyData, valueData;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.put(key, value));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MultiMapPutCodec_1.MultiMapPutCodec, keyData, MultiMapPutCodec_1.MultiMapPutCodec.decodeResponse, keyData, valueData, 1);
    }
    get(key) {
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
        return this.encodeInvokeOnKey(MultiMapGetCodec_1.MultiMapGetCodec, keyData, (clientMessage) => {
            const response = MultiMapGetCodec_1.MultiMapGetCodec.decodeResponse(clientMessage);
            return new core_1.ReadOnlyLazyList(response, this.serializationService);
        }, keyData, 1);
    }
    remove(key, value) {
        let keyData, valueData;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(key, value));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MultiMapRemoveEntryCodec_1.MultiMapRemoveEntryCodec, keyData, MultiMapRemoveEntryCodec_1.MultiMapRemoveEntryCodec.decodeResponse, keyData, valueData, 1);
    }
    removeAll(key) {
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.removeAll(key));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MultiMapRemoveCodec_1.MultiMapRemoveCodec, keyData, (clientMessage) => {
            const response = MultiMapRemoveCodec_1.MultiMapRemoveCodec.decodeResponse(clientMessage);
            return new core_1.ReadOnlyLazyList(response, this.serializationService);
        }, keyData, 1);
    }
    keySet() {
        return this.encodeInvokeOnRandomTarget(MultiMapKeySetCodec_1.MultiMapKeySetCodec, (clientMessage) => {
            const response = MultiMapKeySetCodec_1.MultiMapKeySetCodec.decodeResponse(clientMessage);
            return this.deserializeList(response);
        });
    }
    values() {
        return this.encodeInvokeOnRandomTarget(MultiMapValuesCodec_1.MultiMapValuesCodec, (clientMessage) => {
            const response = MultiMapValuesCodec_1.MultiMapValuesCodec.decodeResponse(clientMessage);
            return new core_1.ReadOnlyLazyList(response, this.serializationService);
        });
    }
    entrySet() {
        return this.encodeInvokeOnRandomTarget(MultiMapEntrySetCodec_1.MultiMapEntrySetCodec, (clientMessage) => {
            const response = MultiMapEntrySetCodec_1.MultiMapEntrySetCodec.decodeResponse(clientMessage);
            return this.deserializeEntryList(response);
        });
    }
    containsKey(key) {
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
        return this.encodeInvokeOnKey(MultiMapContainsKeyCodec_1.MultiMapContainsKeyCodec, keyData, MultiMapContainsKeyCodec_1.MultiMapContainsKeyCodec.decodeResponse, keyData, 1);
    }
    containsValue(value) {
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
        return this.encodeInvokeOnRandomTarget(MultiMapContainsValueCodec_1.MultiMapContainsValueCodec, MultiMapContainsValueCodec_1.MultiMapContainsValueCodec.decodeResponse, valueData);
    }
    containsEntry(key, value) {
        let keyData, valueData;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsEntry(key, value));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MultiMapContainsEntryCodec_1.MultiMapContainsEntryCodec, keyData, MultiMapContainsEntryCodec_1.MultiMapContainsEntryCodec.decodeResponse, keyData, valueData, 1);
    }
    size() {
        return this.encodeInvokeOnRandomTarget(MultiMapSizeCodec_1.MultiMapSizeCodec, MultiMapSizeCodec_1.MultiMapSizeCodec.decodeResponse);
    }
    clear() {
        return this.encodeInvokeOnRandomTarget(MultiMapClearCodec_1.MultiMapClearCodec, () => { });
    }
    valueCount(key) {
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.valueCount(key));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MultiMapValueCountCodec_1.MultiMapValueCountCodec, keyData, MultiMapValueCountCodec_1.MultiMapValueCountCodec.decodeResponse, keyData, 1);
    }
    addEntryListener(listener, key, includeValue = true) {
        const entryEventHandler = (keyData, valueData, oldValueData, mergingValueData, eventType, uuid, numberOfAffectedEntries) => {
            const member = this.clusterService.getMember(uuid.toString());
            const name = this.name;
            key = this.toObject(keyData);
            const value = this.toObject(valueData);
            const oldValue = this.toObject(oldValueData);
            const mergingValue = this.toObject(mergingValueData);
            const entryEvent = new EntryListener_1.EntryEvent(name, key, value, oldValue, mergingValue, member);
            const mapEvent = new MapListener_1.MapEvent(name, numberOfAffectedEntries, member);
            // Multi map only supports these three event types
            switch (eventType) {
                case EventType_1.EventType.ADDED:
                    if (listener.added) {
                        listener.added.apply(null, [entryEvent]);
                    }
                    break;
                case EventType_1.EventType.REMOVED:
                    if (listener.removed) {
                        listener.removed.apply(null, [entryEvent]);
                    }
                    break;
                case EventType_1.EventType.CLEAR_ALL:
                    if (listener.mapCleared) {
                        listener.mapCleared.apply(null, [mapEvent]);
                    }
                    break;
            }
        };
        if (key !== undefined) {
            let keyData;
            try {
                keyData = this.toData(key);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.addEntryListener(listener, key, includeValue));
                }
                throw e;
            }
            const handler = (m) => {
                MultiMapAddEntryListenerToKeyCodec_1.MultiMapAddEntryListenerToKeyCodec.handle(m, entryEventHandler);
            };
            const codec = this.createEntryListenerToKey(this.name, keyData, includeValue);
            return this.listenerService.registerListener(codec, handler);
        }
        else {
            const listenerHandler = (m) => {
                MultiMapAddEntryListenerCodec_1.MultiMapAddEntryListenerCodec.handle(m, entryEventHandler);
            };
            const codec = this.createEntryListener(this.name, includeValue);
            return this.listenerService.registerListener(codec, listenerHandler);
        }
    }
    removeEntryListener(listenerId) {
        return this.listenerService.deregisterListener(listenerId);
    }
    lock(key, leaseMillis = -1) {
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.lock(key, leaseMillis));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MultiMapLockCodec_1.MultiMapLockCodec, keyData, () => { }, keyData, 1, leaseMillis, this.nextSequence());
    }
    isLocked(key) {
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
        return this.encodeInvokeOnKey(MultiMapIsLockedCodec_1.MultiMapIsLockedCodec, keyData, MultiMapIsLockedCodec_1.MultiMapIsLockedCodec.decodeResponse, keyData);
    }
    tryLock(key, timeoutMillis = 0, leaseMillis = -1) {
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.tryLock(key, timeoutMillis, leaseMillis));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(MultiMapTryLockCodec_1.MultiMapTryLockCodec, keyData, MultiMapTryLockCodec_1.MultiMapTryLockCodec.decodeResponse, keyData, 1, leaseMillis, timeoutMillis, this.nextSequence());
    }
    unlock(key) {
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
        return this.encodeInvokeOnKey(MultiMapUnlockCodec_1.MultiMapUnlockCodec, keyData, () => { }, keyData, 1, this.nextSequence());
    }
    forceUnlock(key) {
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
        return this.encodeInvokeOnKey(MultiMapForceUnlockCodec_1.MultiMapForceUnlockCodec, keyData, () => { }, keyData, this.nextSequence());
    }
    putAll(pairs) {
        if (pairs.length === 0) {
            return Promise.resolve();
        }
        const dataPairs = [];
        for (const pair of pairs) {
            try {
                const valuesData = this.serializeList(pair[1]);
                dataPairs.push([this.toData(pair[0]), valuesData]);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.putAll(pairs));
                }
                throw e;
            }
        }
        const partitionService = this.partitionService;
        const partitionToDataPairs = new Map();
        for (const dataPair of dataPairs) {
            const partitionId = partitionService.getPartitionId(dataPair[0]);
            let partitionedDataPairs = partitionToDataPairs.get(partitionId);
            if (partitionedDataPairs == null) {
                partitionedDataPairs = [];
                partitionToDataPairs.set(partitionId, partitionedDataPairs);
            }
            partitionedDataPairs.push(dataPair);
        }
        const partitionPromises = [];
        partitionToDataPairs.forEach((pair, partitionId) => {
            partitionPromises.push(this.encodeInvokeOnPartition(MultiMapPutAllCodec_1.MultiMapPutAllCodec, partitionId, () => { }, pair));
        });
        return Promise.all(partitionPromises).then(() => { });
    }
    nextSequence() {
        return this.lockReferenceIdGenerator.getNextReferenceId();
    }
    createEntryListenerToKey(name, keyData, includeValue) {
        return {
            encodeAddRequest(localOnly) {
                return MultiMapAddEntryListenerToKeyCodec_1.MultiMapAddEntryListenerToKeyCodec.encodeRequest(name, keyData, includeValue, localOnly);
            },
            decodeAddResponse(msg) {
                return MultiMapAddEntryListenerToKeyCodec_1.MultiMapAddEntryListenerToKeyCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return MultiMapRemoveEntryListenerCodec_1.MultiMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
    createEntryListener(name, includeValue) {
        return {
            encodeAddRequest(localOnly) {
                return MultiMapAddEntryListenerCodec_1.MultiMapAddEntryListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg) {
                return MultiMapAddEntryListenerCodec_1.MultiMapAddEntryListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return MultiMapRemoveEntryListenerCodec_1.MultiMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
exports.MultiMapProxy = MultiMapProxy;
//# sourceMappingURL=MultiMapProxy.js.map