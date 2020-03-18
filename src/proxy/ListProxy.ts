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
import {ItemEvent, ItemEventType, ItemListener} from '../core/ItemListener';
import {ReadOnlyLazyList} from '../core/ReadOnlyLazyList';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {IList} from './IList';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import ClientMessage = require('../ClientMessage');

export class ListProxy<E> extends PartitionSpecificProxy implements IList<E> {

    add(element: E): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListAddCodec, this.toData(element));
    }

    addAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListAddAllCodec, this.serializeList(elements));
    }

    addAllAt(index: number, elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListAddAllWithIndexCodec, index, this.serializeList(elements));
    }

    addAt(index: number, element: E): Promise<void> {
        return this.encodeInvoke<void>(ListAddWithIndexCodec, index, this.toData(element));
    }

    clear(): Promise<void> {
        return this.encodeInvoke<void>(ListClearCodec);
    }

    contains(entry: E): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListContainsCodec, this.toData(entry));
    }

    containsAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListContainsAllCodec, this.serializeList(elements));
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListIsEmptyCodec);
    }

    remove(entry: E): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListRemoveCodec, this.toData(entry));
    }

    removeAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListCompareAndRemoveAllCodec, this.serializeList(elements));
    }

    retainAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListCompareAndRetainAllCodec, this.serializeList(elements));
    }

    removeAt(index: number): Promise<E> {
        return this.encodeInvoke<E>(ListRemoveWithIndexCodec, index);
    }

    get(index: number): Promise<E> {
        return this.encodeInvoke<E>(ListGetCodec, index);
    }

    set(index: number, element: E): Promise<E> {
        return this.encodeInvoke<E>(ListSetCodec, index, this.toData(element));
    }

    indexOf(element: E): Promise<number> {
        return this.encodeInvoke<number>(ListIndexOfCodec, this.toData(element));
    }

    lastIndexOf(element: E): Promise<number> {
        return this.encodeInvoke<number>(ListLastIndexOfCodec, this.toData(element));
    }

    size(): Promise<number> {
        return this.encodeInvoke<number>(ListSizeCodec);
    }

    subList(start: number, end: number): Promise<ReadOnlyLazyList<E>> {
        return this.encodeInvoke(ListSubCodec, start, end).then((encoded: Data[]) => {
            return new ReadOnlyLazyList<E>(encoded, this.client.getSerializationService());
        });
    }

    toArray(): Promise<E[]> {
        return this.encodeInvoke(ListGetAllCodec).then((elements: Data[]) => {
            return elements.map((element) => {
                return this.toObject(element);
            });
        });
    }

    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string> {
        const listenerHandler = (message: ClientMessage) => {
            ListAddListenerCodec.handle(message, (element: Data, uuid: string, eventType: number) => {
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
            decodeAddResponse(msg: ClientMessage): string {
                return ListAddListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: string): ClientMessage {
                return ListRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
