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
exports.ReplicatedMapProxy = void 0;
const core_1 = require("../core");
const ReplicatedMapAddEntryListenerCodec_1 = require("../codec/ReplicatedMapAddEntryListenerCodec");
const ReplicatedMapAddEntryListenerToKeyCodec_1 = require("../codec/ReplicatedMapAddEntryListenerToKeyCodec");
// eslint-disable-next-line max-len
const ReplicatedMapAddEntryListenerToKeyWithPredicateCodec_1 = require("../codec/ReplicatedMapAddEntryListenerToKeyWithPredicateCodec");
const ReplicatedMapAddEntryListenerWithPredicateCodec_1 = require("../codec/ReplicatedMapAddEntryListenerWithPredicateCodec");
const ReplicatedMapClearCodec_1 = require("../codec/ReplicatedMapClearCodec");
const ReplicatedMapContainsKeyCodec_1 = require("../codec/ReplicatedMapContainsKeyCodec");
const ReplicatedMapContainsValueCodec_1 = require("../codec/ReplicatedMapContainsValueCodec");
const ReplicatedMapEntrySetCodec_1 = require("../codec/ReplicatedMapEntrySetCodec");
const ReplicatedMapGetCodec_1 = require("../codec/ReplicatedMapGetCodec");
const ReplicatedMapIsEmptyCodec_1 = require("../codec/ReplicatedMapIsEmptyCodec");
const ReplicatedMapKeySetCodec_1 = require("../codec/ReplicatedMapKeySetCodec");
const ReplicatedMapPutAllCodec_1 = require("../codec/ReplicatedMapPutAllCodec");
const ReplicatedMapPutCodec_1 = require("../codec/ReplicatedMapPutCodec");
const ReplicatedMapRemoveCodec_1 = require("../codec/ReplicatedMapRemoveCodec");
const ReplicatedMapRemoveEntryListenerCodec_1 = require("../codec/ReplicatedMapRemoveEntryListenerCodec");
const ReplicatedMapSizeCodec_1 = require("../codec/ReplicatedMapSizeCodec");
const ReplicatedMapValuesCodec_1 = require("../codec/ReplicatedMapValuesCodec");
const EventType_1 = require("./EventType");
const EntryListener_1 = require("./EntryListener");
const Util_1 = require("../util/Util");
const PartitionSpecificProxy_1 = require("./PartitionSpecificProxy");
const MapListener_1 = require("./MapListener");
/** @internal */
class ReplicatedMapProxy extends PartitionSpecificProxy_1.PartitionSpecificProxy {
    put(key, value, ttl = 0) {
        (0, Util_1.assertNotNull)(key);
        (0, Util_1.assertNotNull)(value);
        let valueData, keyData;
        try {
            valueData = this.toData(value);
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.put(key, value, ttl));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(ReplicatedMapPutCodec_1.ReplicatedMapPutCodec, keyData, (clientMessage) => {
            const response = ReplicatedMapPutCodec_1.ReplicatedMapPutCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData, valueData, ttl);
    }
    clear() {
        return this.encodeInvokeOnRandomTarget(ReplicatedMapClearCodec_1.ReplicatedMapClearCodec, () => { });
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
        return this.encodeInvokeOnKey(ReplicatedMapGetCodec_1.ReplicatedMapGetCodec, keyData, (clientMessage) => {
            const response = ReplicatedMapGetCodec_1.ReplicatedMapGetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData);
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
        return this.encodeInvokeOnKey(ReplicatedMapContainsKeyCodec_1.ReplicatedMapContainsKeyCodec, keyData, ReplicatedMapContainsKeyCodec_1.ReplicatedMapContainsKeyCodec.decodeResponse, keyData);
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
        return this.encodeInvoke(ReplicatedMapContainsValueCodec_1.ReplicatedMapContainsValueCodec, ReplicatedMapContainsValueCodec_1.ReplicatedMapContainsValueCodec.decodeResponse, valueData);
    }
    size() {
        return this.encodeInvoke(ReplicatedMapSizeCodec_1.ReplicatedMapSizeCodec, ReplicatedMapSizeCodec_1.ReplicatedMapSizeCodec.decodeResponse);
    }
    isEmpty() {
        return this.encodeInvoke(ReplicatedMapIsEmptyCodec_1.ReplicatedMapIsEmptyCodec, ReplicatedMapIsEmptyCodec_1.ReplicatedMapIsEmptyCodec.decodeResponse);
    }
    remove(key) {
        (0, Util_1.assertNotNull)(key);
        let keyData;
        try {
            keyData = this.toData(key);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(key));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(ReplicatedMapRemoveCodec_1.ReplicatedMapRemoveCodec, keyData, (clientMessage) => {
            const response = ReplicatedMapRemoveCodec_1.ReplicatedMapRemoveCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData);
    }
    putAll(pairs) {
        let pair;
        let pairId;
        const entries = [];
        for (pairId in pairs) {
            pair = pairs[pairId];
            let keyData, valueData;
            try {
                keyData = this.toData(pair[0]);
                valueData = this.toData(pair[1]);
            }
            catch (e) {
                if (e instanceof core_1.SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.putAll(pairs));
                }
                throw e;
            }
            entries.push([keyData, valueData]);
        }
        return this.encodeInvokeOnRandomTarget(ReplicatedMapPutAllCodec_1.ReplicatedMapPutAllCodec, () => { }, entries);
    }
    keySet() {
        return this.encodeInvoke(ReplicatedMapKeySetCodec_1.ReplicatedMapKeySetCodec, (clientMessage) => {
            const response = ReplicatedMapKeySetCodec_1.ReplicatedMapKeySetCodec.decodeResponse(clientMessage);
            return this.deserializeList(response);
        });
    }
    values(comparator) {
        return this.encodeInvoke(ReplicatedMapValuesCodec_1.ReplicatedMapValuesCodec, (clientMessage) => {
            const valuesData = ReplicatedMapValuesCodec_1.ReplicatedMapValuesCodec.decodeResponse(clientMessage);
            if (comparator) {
                const desValues = this.deserializeList(valuesData);
                return new core_1.ReadOnlyLazyList(desValues.sort(comparator), this.serializationService);
            }
            return new core_1.ReadOnlyLazyList(valuesData, this.serializationService);
        });
    }
    entrySet() {
        return this.encodeInvoke(ReplicatedMapEntrySetCodec_1.ReplicatedMapEntrySetCodec, (clientMessage) => {
            const response = ReplicatedMapEntrySetCodec_1.ReplicatedMapEntrySetCodec.decodeResponse(clientMessage);
            return this.deserializeEntryList(response);
        });
    }
    addEntryListenerToKeyWithPredicate(listener, key, predicate) {
        return this.addEntryListenerInternal(listener, predicate, key);
    }
    addEntryListenerWithPredicate(listener, predicate) {
        return this.addEntryListenerInternal(listener, predicate, undefined);
    }
    addEntryListenerToKey(listener, key) {
        return this.addEntryListenerInternal(listener, undefined, key);
    }
    addEntryListener(listener) {
        return this.addEntryListenerInternal(listener, undefined, undefined);
    }
    removeEntryListener(listenerId) {
        return this.listenerService.deregisterListener(listenerId);
    }
    addEntryListenerInternal(listener, predicate, key) {
        const entryEventHandler = (key, value, oldValue, mergingValue, event, uuid, numberOfAffectedEntries) => {
            const member = this.clusterService.getMember(uuid.toString());
            const name = this.name;
            const entryEvent = new EntryListener_1.EntryEvent(name, this.toObject(key), this.toObject(value), this.toObject(oldValue), this.toObject(mergingValue), member);
            const mapEvent = new MapListener_1.MapEvent(name, numberOfAffectedEntries, member);
            const entryEventToListenerMap = {
                [EventType_1.EventType.ADDED]: 'added',
                [EventType_1.EventType.REMOVED]: 'removed',
                [EventType_1.EventType.UPDATED]: 'updated',
                [EventType_1.EventType.EVICTED]: 'evicted',
            };
            const mapEventToListenerMap = {
                [EventType_1.EventType.CLEAR_ALL]: 'mapCleared',
            };
            const entryEventMethod = entryEventToListenerMap[event];
            const mapEventMethod = mapEventToListenerMap[event];
            if (listener.hasOwnProperty(entryEventMethod)) {
                listener[entryEventMethod].apply(null, [entryEvent]);
            }
            else if (listener.hasOwnProperty(mapEventMethod)) {
                listener[mapEventMethod].apply(null, [mapEvent]);
            }
        };
        let listenerHandler;
        let codec;
        try {
            if (key !== undefined && predicate !== undefined) {
                const keyData = this.toData(key);
                const predicateData = this.toData(predicate);
                codec = this.createEntryListenerToKeyWithPredicate(this.name, keyData, predicateData);
                listenerHandler = ReplicatedMapAddEntryListenerToKeyWithPredicateCodec_1.ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.handle;
            }
            else if (key !== undefined && predicate === undefined) {
                const keyData = this.toData(key);
                codec = this.createEntryListenerToKey(this.name, keyData);
                listenerHandler = ReplicatedMapAddEntryListenerToKeyCodec_1.ReplicatedMapAddEntryListenerToKeyCodec.handle;
            }
            else if (key === undefined && predicate !== undefined) {
                const predicateData = this.toData(predicate);
                codec = this.createEntryListenerWithPredicate(this.name, predicateData);
                listenerHandler = ReplicatedMapAddEntryListenerWithPredicateCodec_1.ReplicatedMapAddEntryListenerWithPredicateCodec.handle;
            }
            else {
                codec = this.createEntryListener(this.name);
                listenerHandler = ReplicatedMapAddEntryListenerCodec_1.ReplicatedMapAddEntryListenerCodec.handle;
            }
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addEntryListenerInternal(listener, predicate, key));
            }
            throw e;
        }
        return this.listenerService.registerListener(codec, (m) => {
            listenerHandler(m, entryEventHandler);
        });
    }
    createEntryListener(name) {
        return {
            encodeAddRequest(localOnly) {
                return ReplicatedMapAddEntryListenerCodec_1.ReplicatedMapAddEntryListenerCodec.encodeRequest(name, localOnly);
            },
            decodeAddResponse(msg) {
                return ReplicatedMapAddEntryListenerCodec_1.ReplicatedMapAddEntryListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return ReplicatedMapRemoveEntryListenerCodec_1.ReplicatedMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
    createEntryListenerToKey(name, keyData) {
        return {
            encodeAddRequest(localOnly) {
                return ReplicatedMapAddEntryListenerToKeyCodec_1.ReplicatedMapAddEntryListenerToKeyCodec.encodeRequest(name, keyData, localOnly);
            },
            decodeAddResponse(msg) {
                return ReplicatedMapAddEntryListenerToKeyCodec_1.ReplicatedMapAddEntryListenerToKeyCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return ReplicatedMapRemoveEntryListenerCodec_1.ReplicatedMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
    createEntryListenerWithPredicate(name, predicateData) {
        return {
            encodeAddRequest(localOnly) {
                return ReplicatedMapAddEntryListenerWithPredicateCodec_1.ReplicatedMapAddEntryListenerWithPredicateCodec.encodeRequest(name, predicateData, localOnly);
            },
            decodeAddResponse(msg) {
                return ReplicatedMapAddEntryListenerWithPredicateCodec_1.ReplicatedMapAddEntryListenerWithPredicateCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return ReplicatedMapRemoveEntryListenerCodec_1.ReplicatedMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
    createEntryListenerToKeyWithPredicate(name, keyData, predicateData) {
        return {
            encodeAddRequest(localOnly) {
                return ReplicatedMapAddEntryListenerToKeyWithPredicateCodec_1.ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.encodeRequest(name, keyData, predicateData, localOnly);
            },
            decodeAddResponse(msg) {
                return ReplicatedMapAddEntryListenerToKeyWithPredicateCodec_1.ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return ReplicatedMapRemoveEntryListenerCodec_1.ReplicatedMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
exports.ReplicatedMapProxy = ReplicatedMapProxy;
//# sourceMappingURL=ReplicatedMapProxy.js.map