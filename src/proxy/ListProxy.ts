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
    UUID
} from '../core';

/** @internal */
export class ListProxy<E> extends PartitionSpecificProxy implements IList<E> {

    add(element: E): Promise<boolean> {
        return this.encodeInvoke(ListAddCodec, this.toData(element))
            .then(ListAddAllCodec.decodeResponse);
    }

    addAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListAddAllCodec, this.serializeList(elements))
            .then(ListAddAllCodec.decodeResponse);
    }

    addAllAt(index: number, elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListAddAllWithIndexCodec, index, this.serializeList(elements))
            .then(ListAddAllWithIndexCodec.decodeResponse);
    }

    addAt(index: number, element: E): Promise<void> {
        return this.encodeInvoke(ListAddWithIndexCodec, index, this.toData(element))
            .then(() => {});
    }

    clear(): Promise<void> {
        return this.encodeInvoke(ListClearCodec).then(() => {});
    }

    contains(entry: E): Promise<boolean> {
        return this.encodeInvoke(ListContainsCodec, this.toData(entry))
            .then(ListContainsCodec.decodeResponse);
    }

    containsAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListContainsAllCodec, this.serializeList(elements))
            .then(ListContainsAllCodec.decodeResponse);
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke(ListIsEmptyCodec)
            .then(ListIsEmptyCodec.decodeResponse);
    }

    remove(entry: E): Promise<boolean> {
        return this.encodeInvoke(ListRemoveCodec, this.toData(entry))
            .then(ListRemoveCodec.decodeResponse);
    }

    removeAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListCompareAndRemoveAllCodec, this.serializeList(elements))
            .then(ListCompareAndRemoveAllCodec.decodeResponse);
    }

    retainAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke(ListCompareAndRetainAllCodec, this.serializeList(elements))
            .then(ListCompareAndRetainAllCodec.decodeResponse);
    }

    removeAt(index: number): Promise<E> {
        return this.encodeInvoke(ListRemoveWithIndexCodec, index)
            .then((clientMessage) => {
                const response = ListRemoveWithIndexCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    get(index: number): Promise<E> {
        return this.encodeInvoke(ListGetCodec, index)
            .then((clientMessage) => {
                const response = ListGetCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    set(index: number, element: E): Promise<E> {
        return this.encodeInvoke(ListSetCodec, index, this.toData(element))
            .then((clientMessage) => {
                const response = ListSetCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    indexOf(element: E): Promise<number> {
        return this.encodeInvoke(ListIndexOfCodec, this.toData(element))
            .then(ListIndexOfCodec.decodeResponse);
    }

    lastIndexOf(element: E): Promise<number> {
        return this.encodeInvoke(ListLastIndexOfCodec, this.toData(element))
            .then(ListLastIndexOfCodec.decodeResponse);
    }

    size(): Promise<number> {
        return this.encodeInvoke(ListSizeCodec)
            .then(ListSizeCodec.decodeResponse);
    }

    subList(start: number, end: number): Promise<ReadOnlyLazyList<E>> {
        return this.encodeInvoke(ListSubCodec, start, end)
            .then((clientMessage) => {
                const response = ListSubCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList<E>(response, this.client.getSerializationService());
            });
    }

    toArray(): Promise<E[]> {
        return this.encodeInvoke(ListGetAllCodec)
            .then((clientMessage) => {
                const response = ListGetAllCodec.decodeResponse(clientMessage);
                return response.map<E>(this.toObject.bind(this));
            });
    }

    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string> {
        const listenerHandler = (message: ClientMessage): void => {
            ListAddListenerCodec.handle(message, (element: Data, uuid: UUID, eventType: number) => {
                const responseObject = element ? this.toObject(element) : null;

                const member = this.client.getClusterService().getMember(uuid);
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
                return ListAddListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ListRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
