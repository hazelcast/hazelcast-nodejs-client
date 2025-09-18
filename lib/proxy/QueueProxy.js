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
exports.QueueProxy = void 0;
const QueueAddAllCodec_1 = require("../codec/QueueAddAllCodec");
const QueueAddListenerCodec_1 = require("../codec/QueueAddListenerCodec");
const QueueClearCodec_1 = require("../codec/QueueClearCodec");
const QueueCompareAndRemoveAllCodec_1 = require("../codec/QueueCompareAndRemoveAllCodec");
const QueueCompareAndRetainAllCodec_1 = require("../codec/QueueCompareAndRetainAllCodec");
const QueueContainsAllCodec_1 = require("../codec/QueueContainsAllCodec");
const QueueContainsCodec_1 = require("../codec/QueueContainsCodec");
const QueueDrainToCodec_1 = require("../codec/QueueDrainToCodec");
const QueueDrainToMaxSizeCodec_1 = require("../codec/QueueDrainToMaxSizeCodec");
const QueueIsEmptyCodec_1 = require("../codec/QueueIsEmptyCodec");
const QueueIteratorCodec_1 = require("../codec/QueueIteratorCodec");
const QueueOfferCodec_1 = require("../codec/QueueOfferCodec");
const QueuePeekCodec_1 = require("../codec/QueuePeekCodec");
const QueuePollCodec_1 = require("../codec/QueuePollCodec");
const QueuePutCodec_1 = require("../codec/QueuePutCodec");
const QueueRemainingCapacityCodec_1 = require("../codec/QueueRemainingCapacityCodec");
const QueueRemoveCodec_1 = require("../codec/QueueRemoveCodec");
const QueueRemoveListenerCodec_1 = require("../codec/QueueRemoveListenerCodec");
const QueueSizeCodec_1 = require("../codec/QueueSizeCodec");
const QueueTakeCodec_1 = require("../codec/QueueTakeCodec");
const ItemListener_1 = require("./ItemListener");
const core_1 = require("../core");
const PartitionSpecificProxy_1 = require("./PartitionSpecificProxy");
/** @internal */
class QueueProxy extends PartitionSpecificProxy_1.PartitionSpecificProxy {
    add(item) {
        return this.offer(item).then((ret) => {
            if (ret) {
                return true;
            }
            else {
                throw new core_1.IllegalStateError('Queue is full.');
            }
        });
    }
    addAll(items) {
        let rawList;
        try {
            rawList = this.serializeList(items);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAll(items));
            }
            throw e;
        }
        return this.encodeInvoke(QueueAddAllCodec_1.QueueAddAllCodec, QueueAddAllCodec_1.QueueAddAllCodec.decodeResponse, rawList);
    }
    addItemListener(listener, includeValue) {
        const handler = (message) => {
            QueueAddListenerCodec_1.QueueAddListenerCodec.handle(message, (item, uuid, eventType) => {
                let responseObject;
                if (item == null) {
                    responseObject = null;
                }
                else {
                    responseObject = this.toObject(item);
                }
                const member = this.clusterService.getMember(uuid.toString());
                const name = this.name;
                const itemEvent = new ItemListener_1.ItemEvent(name, eventType, responseObject, member);
                if (eventType === ItemListener_1.ItemEventType.ADDED && listener.itemAdded) {
                    listener.itemAdded.apply(null, [itemEvent]);
                }
                else if (eventType === ItemListener_1.ItemEventType.REMOVED && listener.itemRemoved) {
                    listener.itemRemoved.apply(null, [itemEvent]);
                }
            });
        };
        const codec = this.createEntryListener(this.name, includeValue);
        return this.listenerService.registerListener(codec, handler);
    }
    clear() {
        return this.encodeInvoke(QueueClearCodec_1.QueueClearCodec, () => { });
    }
    contains(item) {
        let itemData;
        try {
            itemData = this.toData(item);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.contains(item));
            }
            throw e;
        }
        return this.encodeInvoke(QueueContainsCodec_1.QueueContainsCodec, QueueContainsCodec_1.QueueContainsCodec.decodeResponse, itemData);
    }
    containsAll(items) {
        let rawItems;
        try {
            rawItems = this.serializeList(items);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsAll(items));
            }
            throw e;
        }
        return this.encodeInvoke(QueueContainsAllCodec_1.QueueContainsAllCodec, QueueContainsAllCodec_1.QueueContainsAllCodec.decodeResponse, rawItems);
    }
    drainTo(arr, maxElements) {
        let promise;
        if (maxElements === undefined) {
            promise = this.encodeInvoke(QueueDrainToCodec_1.QueueDrainToCodec, QueueDrainToCodec_1.QueueDrainToCodec.decodeResponse);
        }
        else {
            promise = this.encodeInvoke(QueueDrainToMaxSizeCodec_1.QueueDrainToMaxSizeCodec, QueueDrainToMaxSizeCodec_1.QueueDrainToMaxSizeCodec.decodeResponse, maxElements);
        }
        return promise.then((rawArr) => {
            const deserializedArr = this.deserializeList(rawArr);
            deserializedArr.forEach((item) => {
                arr.push(item);
            });
            return rawArr.length;
        });
    }
    isEmpty() {
        return this.encodeInvoke(QueueIsEmptyCodec_1.QueueIsEmptyCodec, QueueIsEmptyCodec_1.QueueIsEmptyCodec.decodeResponse);
    }
    offer(item, time = 0) {
        let itemData;
        try {
            itemData = this.toData(item);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.offer(item, time));
            }
            throw e;
        }
        return this.encodeInvoke(QueueOfferCodec_1.QueueOfferCodec, QueueOfferCodec_1.QueueOfferCodec.decodeResponse, itemData, time);
    }
    peek() {
        return this.encodeInvoke(QueuePeekCodec_1.QueuePeekCodec, (clientMessage) => {
            const response = QueuePeekCodec_1.QueuePeekCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        });
    }
    poll(time = 0) {
        return this.encodeInvoke(QueuePollCodec_1.QueuePollCodec, (clientMessage) => {
            const response = QueuePollCodec_1.QueuePollCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, time);
    }
    put(item) {
        let itemData;
        try {
            itemData = this.toData(item);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.put(item));
            }
            throw e;
        }
        return this.encodeInvoke(QueuePutCodec_1.QueuePutCodec, () => { }, itemData);
    }
    remainingCapacity() {
        return this.encodeInvoke(QueueRemainingCapacityCodec_1.QueueRemainingCapacityCodec, QueueRemainingCapacityCodec_1.QueueRemainingCapacityCodec.decodeResponse);
    }
    remove(item) {
        let itemData;
        try {
            itemData = this.toData(item);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(item));
            }
            throw e;
        }
        return this.encodeInvoke(QueueRemoveCodec_1.QueueRemoveCodec, QueueRemoveCodec_1.QueueRemoveCodec.decodeResponse, itemData);
    }
    removeAll(items) {
        let rawItems;
        try {
            rawItems = this.serializeList(items);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.removeAll(items));
            }
            throw e;
        }
        return this.encodeInvoke(QueueCompareAndRemoveAllCodec_1.QueueCompareAndRemoveAllCodec, QueueCompareAndRemoveAllCodec_1.QueueCompareAndRemoveAllCodec.decodeResponse, rawItems);
    }
    removeItemListener(registrationId) {
        return this.listenerService.deregisterListener(registrationId);
    }
    retainAll(items) {
        let rawItems;
        try {
            rawItems = this.serializeList(items);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.retainAll(items));
            }
            throw e;
        }
        return this.encodeInvoke(QueueCompareAndRetainAllCodec_1.QueueCompareAndRetainAllCodec, QueueCompareAndRetainAllCodec_1.QueueCompareAndRetainAllCodec.decodeResponse, rawItems);
    }
    size() {
        return this.encodeInvoke(QueueSizeCodec_1.QueueSizeCodec, QueueSizeCodec_1.QueueSizeCodec.decodeResponse);
    }
    take() {
        return this.encodeInvoke(QueueTakeCodec_1.QueueTakeCodec, (clientMessage) => {
            const response = QueueTakeCodec_1.QueueTakeCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        });
    }
    toArray() {
        return this.encodeInvoke(QueueIteratorCodec_1.QueueIteratorCodec, (clientMessage) => {
            const response = QueueIteratorCodec_1.QueueIteratorCodec.decodeResponse(clientMessage);
            return this.deserializeList(response);
        });
    }
    createEntryListener(name, includeValue) {
        return {
            encodeAddRequest(localOnly) {
                return QueueAddListenerCodec_1.QueueAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg) {
                return QueueAddListenerCodec_1.QueueAddListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return QueueRemoveListenerCodec_1.QueueRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
exports.QueueProxy = QueueProxy;
//# sourceMappingURL=QueueProxy.js.map