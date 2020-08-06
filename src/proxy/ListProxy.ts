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

import * as Promise from 'bluebird';
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
import {ItemEventImpl, ItemEventType, ItemListener} from '../core/ItemListener';
import {ReadOnlyLazyListImpl} from '../core/ReadOnlyLazyList';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {IList} from './IList';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {ClientMessage} from '../ClientMessage';
import {UUID} from '../core/UUID';

export class ListProxy<E> extends PartitionSpecificProxy implements IList<E> {

    add(element: E): Promise<boolean> {
        return this.encodeInvoke(ListAddCodec, this.toData(element))
            .then((clientMessage) => {
                const response = ListAddAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    addAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListAddAllCodec, this.serializeList(elements))
            .then((clientMessage) => {
                const response = ListAddAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    addAllAt(index: number, elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListAddAllWithIndexCodec, index, this.serializeList(elements))
            .then((clientMessage) => {
                const response = ListAddAllWithIndexCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    addAt(index: number, element: E): Promise<void> {
        return this.encodeInvoke(ListAddWithIndexCodec, index, this.toData(element))
            .then(() => undefined);
    }

    clear(): Promise<void> {
        return this.encodeInvoke(ListClearCodec)
            .then(() => undefined);
    }

    contains(entry: E): Promise<boolean> {
        return this.encodeInvoke(ListContainsCodec, this.toData(entry))
            .then((clientMessage) => {
                const response = ListContainsCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    containsAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListContainsAllCodec, this.serializeList(elements))
            .then((clientMessage) => {
                const response = ListContainsAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke(ListIsEmptyCodec)
            .then((clientMessage) => {
                const response = ListIsEmptyCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    remove(entry: E): Promise<boolean> {
        return this.encodeInvoke(ListRemoveCodec, this.toData(entry))
            .then((clientMessage) => {
                const response = ListRemoveCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    removeAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListCompareAndRemoveAllCodec, this.serializeList(elements))
            .then((clientMessage) => {
                const response = ListCompareAndRemoveAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    retainAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListCompareAndRetainAllCodec, this.serializeList(elements))
            .then((clientMessage) => {
                const response = ListCompareAndRetainAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    removeAt(index: number): Promise<E> {
        return this.encodeInvoke(ListRemoveWithIndexCodec, index)
            .then((clientMessage) => {
                const response = ListRemoveWithIndexCodec.decodeResponse(clientMessage);
                return this.toObject(response.response);
            });
    }

    get(index: number): Promise<E> {
        return this.encodeInvoke(ListGetCodec, index)
            .then((clientMessage) => {
                const response = ListGetCodec.decodeResponse(clientMessage);
                return this.toObject(response.response);
            });
    }

    set(index: number, element: E): Promise<E> {
        return this.encodeInvoke(ListSetCodec, index, this.toData(element))
            .then((clientMessage) => {
                const response = ListSetCodec.decodeResponse(clientMessage);
                return this.toObject(response.response);
            });
    }

    indexOf(element: E): Promise<number> {
        return this.encodeInvoke(ListIndexOfCodec, this.toData(element))
            .then((clientMessage) => {
                const response = ListIndexOfCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    lastIndexOf(element: E): Promise<number> {
        return this.encodeInvoke(ListLastIndexOfCodec, this.toData(element))
            .then((clientMessage) => {
                const response = ListLastIndexOfCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    size(): Promise<number> {
        return this.encodeInvoke(ListSizeCodec)
            .then((clientMessage) => {
                const response = ListSizeCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    subList(start: number, end: number): Promise<ReadOnlyLazyListImpl<E>> {
        return this.encodeInvoke(ListSubCodec, start, end)
            .then((clientMessage) => {
                const response = ListSubCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyListImpl<E>(response.response, this.client.getSerializationService());
            });
    }

    toArray(): Promise<E[]> {
        return this.encodeInvoke(ListGetAllCodec)
            .then((clientMessage) => {
                const response = ListGetAllCodec.decodeResponse(clientMessage);
                return response.response.map<E>(this.toObject.bind(this));
            });
    }

    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string> {
        const listenerHandler = (message: ClientMessage): void => {
            ListAddListenerCodec.handle(message, (element: Data, uuid: UUID, eventType: number) => {
                const responseObject = element ? this.toObject(element) : null;

                const member = this.client.getClusterService().getMember(uuid);
                const name = this.name;
                const itemEvent = new ItemEventImpl(name, eventType, responseObject, member);

                if (eventType === ItemEventType.ADDED && listener.itemAdded) {
                    listener.itemAdded.apply(null, [itemEvent]);
                } else if (eventType === ItemEventType.REMOVED && listener.itemRemoved) {
                    listener.itemRemoved.apply(null, [itemEvent]);
                }
            });
        };
        const codec = this.createItemListener(this.name, includeValue);
        return this.client.getListenerService().registerListener(codec, listenerHandler);
    }

    removeItemListener(registrationId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(registrationId);
    }

    private serializeList(input: E[]): Data[] {
        return input.map((each) => {
            return this.toData(each);
        });
    }

    private createItemListener(name: string, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ListAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ListAddListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ListRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
