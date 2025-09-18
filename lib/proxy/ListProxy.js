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
exports.ListProxy = void 0;
const ListAddAllCodec_1 = require("../codec/ListAddAllCodec");
const ListAddAllWithIndexCodec_1 = require("../codec/ListAddAllWithIndexCodec");
const ListAddCodec_1 = require("../codec/ListAddCodec");
const ListAddListenerCodec_1 = require("../codec/ListAddListenerCodec");
const ListAddWithIndexCodec_1 = require("../codec/ListAddWithIndexCodec");
const ListClearCodec_1 = require("../codec/ListClearCodec");
const ListCompareAndRemoveAllCodec_1 = require("../codec/ListCompareAndRemoveAllCodec");
const ListCompareAndRetainAllCodec_1 = require("../codec/ListCompareAndRetainAllCodec");
const ListContainsAllCodec_1 = require("../codec/ListContainsAllCodec");
const ListContainsCodec_1 = require("../codec/ListContainsCodec");
const ListGetAllCodec_1 = require("../codec/ListGetAllCodec");
const ListGetCodec_1 = require("../codec/ListGetCodec");
const ListIndexOfCodec_1 = require("../codec/ListIndexOfCodec");
const ListIsEmptyCodec_1 = require("../codec/ListIsEmptyCodec");
const ListLastIndexOfCodec_1 = require("../codec/ListLastIndexOfCodec");
const ListRemoveCodec_1 = require("../codec/ListRemoveCodec");
const ListRemoveListenerCodec_1 = require("../codec/ListRemoveListenerCodec");
const ListRemoveWithIndexCodec_1 = require("../codec/ListRemoveWithIndexCodec");
const ListSetCodec_1 = require("../codec/ListSetCodec");
const ListSizeCodec_1 = require("../codec/ListSizeCodec");
const ListSubCodec_1 = require("../codec/ListSubCodec");
const ItemListener_1 = require("./ItemListener");
const PartitionSpecificProxy_1 = require("./PartitionSpecificProxy");
const core_1 = require("../core");
/** @internal */
class ListProxy extends PartitionSpecificProxy_1.PartitionSpecificProxy {
    add(element) {
        try {
            return this.encodeInvoke(ListAddCodec_1.ListAddCodec, ListAddCodec_1.ListAddCodec.decodeResponse, this.toData(element));
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.add(element));
            }
            throw e;
        }
    }
    addAll(elements) {
        try {
            return this.encodeInvoke(ListAddAllCodec_1.ListAddAllCodec, ListAddAllCodec_1.ListAddAllCodec.decodeResponse, this.serializeList(elements));
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAll(elements));
            }
            throw e;
        }
    }
    addAllAt(index, elements) {
        try {
            return this.encodeInvoke(ListAddAllWithIndexCodec_1.ListAddAllWithIndexCodec, ListAddAllWithIndexCodec_1.ListAddAllWithIndexCodec.decodeResponse, index, this.serializeList(elements));
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAllAt(index, elements));
            }
            throw e;
        }
    }
    addAt(index, element) {
        try {
            return this.encodeInvoke(ListAddWithIndexCodec_1.ListAddWithIndexCodec, () => { }, index, this.toData(element));
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAt(index, element));
            }
            throw e;
        }
    }
    clear() {
        return this.encodeInvoke(ListClearCodec_1.ListClearCodec, () => { });
    }
    contains(entry) {
        try {
            return this.encodeInvoke(ListContainsCodec_1.ListContainsCodec, ListContainsCodec_1.ListContainsCodec.decodeResponse, this.toData(entry));
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.contains(entry));
            }
            throw e;
        }
    }
    containsAll(elements) {
        try {
            return this.encodeInvoke(ListContainsAllCodec_1.ListContainsAllCodec, ListContainsAllCodec_1.ListContainsAllCodec.decodeResponse, this.serializeList(elements));
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsAll(elements));
            }
            throw e;
        }
    }
    isEmpty() {
        return this.encodeInvoke(ListIsEmptyCodec_1.ListIsEmptyCodec, ListIsEmptyCodec_1.ListIsEmptyCodec.decodeResponse);
    }
    remove(entry) {
        try {
            return this.encodeInvoke(ListRemoveCodec_1.ListRemoveCodec, ListRemoveCodec_1.ListRemoveCodec.decodeResponse, this.toData(entry));
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(entry));
            }
            throw e;
        }
    }
    removeAll(elements) {
        try {
            return this.encodeInvoke(ListCompareAndRemoveAllCodec_1.ListCompareAndRemoveAllCodec, ListCompareAndRemoveAllCodec_1.ListCompareAndRemoveAllCodec.decodeResponse, this.serializeList(elements));
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.removeAll(elements));
            }
            throw e;
        }
    }
    retainAll(elements) {
        try {
            return this.encodeInvoke(ListCompareAndRetainAllCodec_1.ListCompareAndRetainAllCodec, ListCompareAndRetainAllCodec_1.ListCompareAndRetainAllCodec.decodeResponse, this.serializeList(elements));
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.retainAll(elements));
            }
            throw e;
        }
    }
    removeAt(index) {
        return this.encodeInvoke(ListRemoveWithIndexCodec_1.ListRemoveWithIndexCodec, (clientMessage) => {
            const response = ListRemoveWithIndexCodec_1.ListRemoveWithIndexCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, index);
    }
    get(index) {
        return this.encodeInvoke(ListGetCodec_1.ListGetCodec, (clientMessage) => {
            const response = ListGetCodec_1.ListGetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, index);
    }
    set(index, element) {
        let elementData;
        try {
            elementData = this.toData(element);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.set(index, element));
            }
            throw e;
        }
        return this.encodeInvoke(ListSetCodec_1.ListSetCodec, (clientMessage) => {
            const response = ListSetCodec_1.ListSetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, index, elementData);
    }
    indexOf(element) {
        let elementData;
        try {
            elementData = this.toData(element);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.indexOf(element));
            }
            throw e;
        }
        return this.encodeInvoke(ListIndexOfCodec_1.ListIndexOfCodec, ListIndexOfCodec_1.ListIndexOfCodec.decodeResponse, elementData);
    }
    lastIndexOf(element) {
        let elementData;
        try {
            elementData = this.toData(element);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.lastIndexOf(element));
            }
            throw e;
        }
        return this.encodeInvoke(ListLastIndexOfCodec_1.ListLastIndexOfCodec, ListLastIndexOfCodec_1.ListLastIndexOfCodec.decodeResponse, elementData);
    }
    size() {
        return this.encodeInvoke(ListSizeCodec_1.ListSizeCodec, ListSizeCodec_1.ListSizeCodec.decodeResponse);
    }
    subList(start, end) {
        return this.encodeInvoke(ListSubCodec_1.ListSubCodec, (clientMessage) => {
            const response = ListSubCodec_1.ListSubCodec.decodeResponse(clientMessage);
            return new core_1.ReadOnlyLazyList(response, this.serializationService);
        }, start, end);
    }
    toArray() {
        return this.encodeInvoke(ListGetAllCodec_1.ListGetAllCodec, (clientMessage) => {
            const response = ListGetAllCodec_1.ListGetAllCodec.decodeResponse(clientMessage);
            return this.deserializeList(response);
        });
    }
    addItemListener(listener, includeValue) {
        const listenerHandler = (message) => {
            ListAddListenerCodec_1.ListAddListenerCodec.handle(message, (element, uuid, eventType) => {
                const responseObject = element ? this.toObject(element) : null;
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
        const codec = this.createItemListener(this.name, includeValue);
        return this.listenerService.registerListener(codec, listenerHandler);
    }
    removeItemListener(registrationId) {
        return this.listenerService.deregisterListener(registrationId);
    }
    createItemListener(name, includeValue) {
        return {
            encodeAddRequest(localOnly) {
                return ListAddListenerCodec_1.ListAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg) {
                return ListAddListenerCodec_1.ListAddListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return ListRemoveListenerCodec_1.ListRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
exports.ListProxy = ListProxy;
//# sourceMappingURL=ListProxy.js.map