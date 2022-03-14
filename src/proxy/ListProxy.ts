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

import {ListAddAllCodec} from '../codec/ListAddAllCodec';
import {ListAddAllWithIndexCodec} from '../codec/ListAddAllWithIndexCodec';
import {ListAddCodec} from '../codec/ListAddCodec';
import {ListAddListenerCodec} from '../codec/ListAddListenerCodec';
import {ListAddWithIndexCodec} from '../codec/ListAddWithIndexCodec';
import {ListClearCodec} from '../codec/ListClearCodec';
import {ListCompareAndRemoveAllCodec} from '../codec/ListCompareAndRemoveAllCodec';
import {ListCompareAndRetainAllCodec} from '../codec/ListCompareAndRetainAllCodec';
import {ListContainsAllCodec} from '../codec/ListContainsAllCodec';
import {ListContainsCodec} from '../codec/ListContainsCodec';
import {ListGetAllCodec} from '../codec/ListGetAllCodec';
import {ListGetCodec} from '../codec/ListGetCodec';
import {ListIndexOfCodec} from '../codec/ListIndexOfCodec';
import {ListIsEmptyCodec} from '../codec/ListIsEmptyCodec';
import {ListLastIndexOfCodec} from '../codec/ListLastIndexOfCodec';
import {ListRemoveCodec} from '../codec/ListRemoveCodec';
import {ListRemoveListenerCodec} from '../codec/ListRemoveListenerCodec';
import {ListRemoveWithIndexCodec} from '../codec/ListRemoveWithIndexCodec';
import {ListSetCodec} from '../codec/ListSetCodec';
import {ListSizeCodec} from '../codec/ListSizeCodec';
import {ListSubCodec} from '../codec/ListSubCodec';
import {ItemEvent, ItemEventType, ItemListener} from './ItemListener';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {IList} from './IList';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {ClientMessage} from '../protocol/ClientMessage';
import {
    ReadOnlyLazyList,
    SchemaNotReplicatedError,
    UUID
} from '../core';

/** @internal */
export class ListProxy<E> extends PartitionSpecificProxy implements IList<E> {

    add(element: E): Promise<boolean> {
        try {
            return this.encodeInvoke(ListAddCodec, ListAddAllCodec.decodeResponse, this.toData(element));
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.add(element));
            }
            return Promise.reject(e);
        }
    }

    addAll(elements: E[]): Promise<boolean> {
        try {
            return this.encodeInvoke(ListAddAllCodec, ListAddAllCodec.decodeResponse, this.serializeList(elements));
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAll(elements));
            }
            return Promise.reject(e);
        }
    }

    addAllAt(index: number, elements: E[]): Promise<boolean> {
        try {
            return this.encodeInvoke(
                ListAddAllWithIndexCodec, ListAddAllWithIndexCodec.decodeResponse, index, this.serializeList(elements)
            );
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAllAt(index, elements));
            }
            return Promise.reject(e);
        }
    }

    addAt(index: number, element: E): Promise<void> {
        try {
            return this.encodeInvoke(ListAddWithIndexCodec, () => {}, index, this.toData(element));
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAt(index, element));
            }
            return Promise.reject(e);
        }
    }

    clear(): Promise<void> {
        return this.encodeInvoke(ListClearCodec, () => {});
    }

    contains(entry: E): Promise<boolean> {
        try {
            return this.encodeInvoke(ListContainsCodec, ListContainsCodec.decodeResponse, this.toData(entry));
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.contains(entry));
            }
            return Promise.reject(e);
        }
    }

    containsAll(elements: E[]): Promise<boolean> {
        try {
            return this.encodeInvoke(ListContainsAllCodec, ListContainsAllCodec.decodeResponse, this.serializeList(elements));
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsAll(elements));
            }
            return Promise.reject(e);
        }
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke(ListIsEmptyCodec, ListIsEmptyCodec.decodeResponse);
    }

    remove(entry: E): Promise<boolean> {
        try {
            return this.encodeInvoke(ListRemoveCodec, ListRemoveCodec.decodeResponse, this.toData(entry));
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(entry));
            }
            return Promise.reject(e);
        }
    }

    removeAll(elements: E[]): Promise<boolean> {
        try {
            return this.encodeInvoke(
                ListCompareAndRemoveAllCodec, ListCompareAndRemoveAllCodec.decodeResponse, this.serializeList(elements)
            );
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.removeAll(elements));
            }
            return Promise.reject(e);
        }
    }

    retainAll(elements: E[]): Promise<boolean> {
        try {
            return this.encodeInvoke(
                ListCompareAndRetainAllCodec, ListCompareAndRetainAllCodec.decodeResponse, this.serializeList(elements)
            );
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.retainAll(elements));
            }
            return Promise.reject(e);
        }
    }

    removeAt(index: number): Promise<E> {
        return this.encodeInvoke(ListRemoveWithIndexCodec, (clientMessage) => {
            const response = ListRemoveWithIndexCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, index);
    }

    get(index: number): Promise<E> {
        return this.encodeInvoke(ListGetCodec, (clientMessage) => {
            const response = ListGetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, index);
    }

    set(index: number, element: E): Promise<E> {
        let elementData: Data;
        try {
            elementData = this.toData(element)
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.set(index, element));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(ListSetCodec, (clientMessage) => {
            const response = ListSetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, index, elementData);
    }

    indexOf(element: E): Promise<number> {
        let elementData: Data;
        try {
            elementData = this.toData(element)
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.indexOf(element));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(ListIndexOfCodec, ListIndexOfCodec.decodeResponse, elementData);
    }

    lastIndexOf(element: E): Promise<number> {
        let elementData: Data;
        try {
            elementData = this.toData(element)
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.lastIndexOf(element));
            }
            return Promise.reject(e);
        }
        return this.encodeInvoke(ListLastIndexOfCodec, ListLastIndexOfCodec.decodeResponse, elementData);
    }

    size(): Promise<number> {
        return this.encodeInvoke(ListSizeCodec, ListSizeCodec.decodeResponse);
    }

    subList(start: number, end: number): Promise<ReadOnlyLazyList<E>> {
        return this.encodeInvoke(ListSubCodec, (clientMessage) => {
            const response = ListSubCodec.decodeResponse(clientMessage);
            return new ReadOnlyLazyList<E>(response, this.serializationService);
        }, start, end);
    }

    toArray(): Promise<E[]> {
        return this.encodeInvoke(ListGetAllCodec, (clientMessage) => {
            const response = ListGetAllCodec.decodeResponse(clientMessage);
            return response.map<E>(this.toObject.bind(this));
        });
    }

    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string> {
        const listenerHandler = (message: ClientMessage): void => {
            ListAddListenerCodec.handle(message, (element: Data, uuid: UUID, eventType: number) => {
                const responseObject = element ? this.toObject(element) : null;

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
        const codec = this.createItemListener(this.name, includeValue);
        return this.listenerService.registerListener(codec, listenerHandler);
    }

    removeItemListener(registrationId: string): Promise<boolean> {
        return this.listenerService.deregisterListener(registrationId);
    }

    private createItemListener(name: string, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ListAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ListAddListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ListRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
