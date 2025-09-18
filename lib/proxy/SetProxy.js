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
exports.SetProxy = void 0;
const SetAddAllCodec_1 = require("../codec/SetAddAllCodec");
const SetAddCodec_1 = require("../codec/SetAddCodec");
const SetAddListenerCodec_1 = require("../codec/SetAddListenerCodec");
const SetClearCodec_1 = require("../codec/SetClearCodec");
const SetCompareAndRemoveAllCodec_1 = require("../codec/SetCompareAndRemoveAllCodec");
const SetCompareAndRetainAllCodec_1 = require("../codec/SetCompareAndRetainAllCodec");
const SetContainsAllCodec_1 = require("../codec/SetContainsAllCodec");
const SetContainsCodec_1 = require("../codec/SetContainsCodec");
const SetGetAllCodec_1 = require("../codec/SetGetAllCodec");
const SetIsEmptyCodec_1 = require("../codec/SetIsEmptyCodec");
const SetRemoveCodec_1 = require("../codec/SetRemoveCodec");
const SetRemoveListenerCodec_1 = require("../codec/SetRemoveListenerCodec");
const SetSizeCodec_1 = require("../codec/SetSizeCodec");
const ItemListener_1 = require("./ItemListener");
const PartitionSpecificProxy_1 = require("./PartitionSpecificProxy");
const core_1 = require("../core");
/** @internal */
class SetProxy extends PartitionSpecificProxy_1.PartitionSpecificProxy {
    add(entry) {
        let entryData;
        try {
            entryData = this.toData(entry);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.add(entry));
            }
            throw e;
        }
        return this.encodeInvoke(SetAddCodec_1.SetAddCodec, SetAddCodec_1.SetAddCodec.decodeResponse, entryData);
    }
    addAll(items) {
        let itemsData;
        try {
            itemsData = this.serializeList(items);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAll(items));
            }
            throw e;
        }
        return this.encodeInvoke(SetAddAllCodec_1.SetAddAllCodec, SetAddAllCodec_1.SetAddAllCodec.decodeResponse, itemsData);
    }
    toArray() {
        return this.encodeInvoke(SetGetAllCodec_1.SetGetAllCodec, (clientMessage) => {
            const response = SetGetAllCodec_1.SetGetAllCodec.decodeResponse(clientMessage);
            return this.deserializeList(response);
        });
    }
    clear() {
        return this.encodeInvoke(SetClearCodec_1.SetClearCodec, () => { });
    }
    contains(entry) {
        let entryData;
        try {
            entryData = this.toData(entry);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.contains(entry));
            }
            throw e;
        }
        return this.encodeInvoke(SetContainsCodec_1.SetContainsCodec, SetContainsCodec_1.SetContainsCodec.decodeResponse, entryData);
    }
    containsAll(items) {
        let itemsData;
        try {
            itemsData = this.serializeList(items);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsAll(items));
            }
            throw e;
        }
        return this.encodeInvoke(SetContainsAllCodec_1.SetContainsAllCodec, SetContainsAllCodec_1.SetContainsAllCodec.decodeResponse, itemsData);
    }
    isEmpty() {
        return this.encodeInvoke(SetIsEmptyCodec_1.SetIsEmptyCodec, SetIsEmptyCodec_1.SetIsEmptyCodec.decodeResponse);
    }
    remove(entry) {
        let entryData;
        try {
            entryData = this.toData(entry);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(entry));
            }
            throw e;
        }
        return this.encodeInvoke(SetRemoveCodec_1.SetRemoveCodec, SetRemoveCodec_1.SetRemoveCodec.decodeResponse, entryData);
    }
    removeAll(items) {
        let itemsData;
        try {
            itemsData = this.serializeList(items);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.removeAll(items));
            }
            throw e;
        }
        return this.encodeInvoke(SetCompareAndRemoveAllCodec_1.SetCompareAndRemoveAllCodec, SetCompareAndRemoveAllCodec_1.SetCompareAndRemoveAllCodec.decodeResponse, itemsData);
    }
    retainAll(items) {
        let itemsData;
        try {
            itemsData = this.serializeList(items);
        }
        catch (e) {
            if (e instanceof core_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.retainAll(items));
            }
            throw e;
        }
        return this.encodeInvoke(SetCompareAndRetainAllCodec_1.SetCompareAndRetainAllCodec, SetCompareAndRetainAllCodec_1.SetCompareAndRetainAllCodec.decodeResponse, itemsData);
    }
    size() {
        return this.encodeInvoke(SetSizeCodec_1.SetSizeCodec, SetSizeCodec_1.SetSizeCodec.decodeResponse);
    }
    addItemListener(listener, includeValue = true) {
        const handler = (message) => {
            SetAddListenerCodec_1.SetAddListenerCodec.handle(message, (item, uuid, eventType) => {
                const responseObject = this.toObject(item);
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
    removeItemListener(registrationId) {
        return this.listenerService.deregisterListener(registrationId);
    }
    createEntryListener(name, includeValue) {
        return {
            encodeAddRequest(localOnly) {
                return SetAddListenerCodec_1.SetAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg) {
                return SetAddListenerCodec_1.SetAddListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId) {
                return SetRemoveListenerCodec_1.SetRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
exports.SetProxy = SetProxy;
//# sourceMappingURL=SetProxy.js.map