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

import {SetAddAllCodec} from '../codec/SetAddAllCodec';
import {SetAddCodec} from '../codec/SetAddCodec';
import {SetAddListenerCodec} from '../codec/SetAddListenerCodec';
import {SetClearCodec} from '../codec/SetClearCodec';
import {SetCompareAndRemoveAllCodec} from '../codec/SetCompareAndRemoveAllCodec';
import {SetCompareAndRetainAllCodec} from '../codec/SetCompareAndRetainAllCodec';
import {SetContainsAllCodec} from '../codec/SetContainsAllCodec';
import {SetContainsCodec} from '../codec/SetContainsCodec';
import {SetGetAllCodec} from '../codec/SetGetAllCodec';
import {SetIsEmptyCodec} from '../codec/SetIsEmptyCodec';
import {SetRemoveCodec} from '../codec/SetRemoveCodec';
import {SetRemoveListenerCodec} from '../codec/SetRemoveListenerCodec';
import {SetSizeCodec} from '../codec/SetSizeCodec';
import {ItemEvent, ItemEventType, ItemListener} from './ItemListener';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {ISet} from './ISet';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {ClientMessage} from '../protocol/ClientMessage';
import {SchemaNotReplicatedError, UUID} from '../core';

/** @internal */
export class SetProxy<E> extends PartitionSpecificProxy implements ISet<E> {

    add(entry: E): Promise<boolean> {
        let entryData: Data;
        try {
            entryData = this.toData(entry);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.add(entry));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(SetAddCodec, SetAddCodec.decodeResponse, entryData);
    }

    addAll(items: E[]): Promise<boolean> {
        let itemsData: Data[];
        try {
            itemsData = this.serializeList(items);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAll(items));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(SetAddAllCodec, SetAddAllCodec.decodeResponse, itemsData);
    }

    toArray(): Promise<E[]> {
        return this.encodeInvoke(SetGetAllCodec, (clientMessage) => {
            const response = SetGetAllCodec.decodeResponse(clientMessage);
            return response.map(this.toObject.bind(this));
        });
    }

    clear(): Promise<void> {
        return this.encodeInvoke(SetClearCodec, () => {});
    }

    contains(entry: E): Promise<boolean> {
        let entryData: Data;
        try {
            entryData = this.toData(entry);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.contains(entry));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(SetContainsCodec, SetContainsCodec.decodeResponse, entryData);
    }

    containsAll(items: E[]): Promise<boolean> {
        let itemsData: Data[];
        try {
            itemsData = this.serializeList(items);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsAll(items));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(SetContainsAllCodec, SetContainsAllCodec.decodeResponse, itemsData);
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke(SetIsEmptyCodec, SetIsEmptyCodec.decodeResponse);
    }

    remove(entry: E): Promise<boolean> {
        let entryData: Data;
        try {
            entryData = this.toData(entry);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(entry));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(SetRemoveCodec, SetRemoveCodec.decodeResponse, entryData);
    }

    removeAll(items: E[]): Promise<boolean> {
        let itemsData: Data[];
        try {
            itemsData = this.serializeList(items);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.removeAll(items));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(
            SetCompareAndRemoveAllCodec, SetCompareAndRemoveAllCodec.decodeResponse, itemsData
        );
    }

    retainAll(items: E[]): Promise<boolean> {
        let itemsData: Data[];
        try {
            itemsData = this.serializeList(items);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.retainAll(items));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(
            SetCompareAndRetainAllCodec, SetCompareAndRetainAllCodec.decodeResponse, itemsData
        );
    }

    size(): Promise<number> {
        return this.encodeInvoke(SetSizeCodec, SetSizeCodec.decodeResponse);
    }

    addItemListener(listener: ItemListener<E>, includeValue = true): Promise<string> {
        const handler = (message: ClientMessage): void => {
            SetAddListenerCodec.handle(message, (item: Data, uuid: UUID, eventType: number) => {
                const responseObject = this.toObject(item);
                const member = this.clusterService.getMember(uuid.toString());
                const name = this.name;
                const itemEvent = new ItemEvent(name, eventType, responseObject, member);

                if (eventType === ItemEventType.ADDED && listener.itemAdded) {
                    listener.itemAdded.apply(null, [itemEvent]);
                } else if (eventType === ItemEventType.REMOVED && listener.itemRemoved) {
                    listener.itemRemoved.apply(null, [itemEvent]);
                }
            });
        };
        const codec = this.createEntryListener(this.name, includeValue);
        return this.listenerService.registerListener(codec, handler);
    }

    removeItemListener(registrationId: string): Promise<boolean> {
        return this.listenerService.deregisterListener(registrationId);
    }



    private createEntryListener(name: string, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return SetAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return SetAddListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return SetRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
