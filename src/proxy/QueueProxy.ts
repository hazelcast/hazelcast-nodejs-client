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
/** @ignore *//** */

import * as Promise from 'bluebird';
import {QueueAddAllCodec} from '../codec/QueueAddAllCodec';
import {QueueAddListenerCodec} from '../codec/QueueAddListenerCodec';
import {QueueClearCodec} from '../codec/QueueClearCodec';
import {QueueCompareAndRemoveAllCodec} from '../codec/QueueCompareAndRemoveAllCodec';
import {QueueCompareAndRetainAllCodec} from '../codec/QueueCompareAndRetainAllCodec';
import {QueueContainsAllCodec} from '../codec/QueueContainsAllCodec';
import {QueueContainsCodec} from '../codec/QueueContainsCodec';
import {QueueDrainToCodec} from '../codec/QueueDrainToCodec';
import {QueueDrainToMaxSizeCodec} from '../codec/QueueDrainToMaxSizeCodec';
import {QueueIsEmptyCodec} from '../codec/QueueIsEmptyCodec';
import {QueueIteratorCodec} from '../codec/QueueIteratorCodec';
import {QueueOfferCodec} from '../codec/QueueOfferCodec';
import {QueuePeekCodec} from '../codec/QueuePeekCodec';
import {QueuePollCodec} from '../codec/QueuePollCodec';
import {QueuePutCodec} from '../codec/QueuePutCodec';
import {QueueRemainingCapacityCodec} from '../codec/QueueRemainingCapacityCodec';
import {QueueRemoveCodec} from '../codec/QueueRemoveCodec';
import {QueueRemoveListenerCodec} from '../codec/QueueRemoveListenerCodec';
import {QueueSizeCodec} from '../codec/QueueSizeCodec';
import {QueueTakeCodec} from '../codec/QueueTakeCodec';
import {ItemEvent, ItemEventType, ItemListener} from './ItemListener';
import {IllegalStateError, UUID} from '../core';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {IQueue} from './IQueue';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {ClientMessage} from '../protocol/ClientMessage';

/** @internal */
export class QueueProxy<E> extends PartitionSpecificProxy implements IQueue<E> {

    add(item: E): Promise<boolean> {
        return this.offer(item).then(function (ret): boolean {
            if (ret) {
                return true;
            } else {
                throw new IllegalStateError('Queue is full.');
            }
        });
    }

    addAll(items: E[]): Promise<boolean> {
        const rawList: Data[] = [];
        const toData = this.toData.bind(this);
        items.forEach(function (item): void {
            rawList.push(toData(item));
        });
        return this.encodeInvoke(QueueAddAllCodec, rawList)
            .then((clientMessage) => {
                const response = QueueAddAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string> {
        const handler = (message: ClientMessage): void => {
            QueueAddListenerCodec.handle(message, (item: Data, uuid: UUID, eventType: number) => {
                let responseObject: E;
                if (item == null) {
                    responseObject = null;
                } else {
                    responseObject = this.toObject(item);
                }

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
        const codec = this.createEntryListener(this.name, includeValue);
        return this.client.getListenerService().registerListener(codec, handler);
    }

    clear(): Promise<void> {
        return this.encodeInvoke(QueueClearCodec).then();
    }

    contains(item: E): Promise<boolean> {
        const itemData = this.toData(item);
        return this.encodeInvoke(QueueContainsCodec, itemData)
            .then((clientMessage) => {
                const response = QueueContainsCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    containsAll(items: E[]): Promise<boolean> {
        const toData = this.toData.bind(this);
        const rawItems: Data[] = items.map<Data>(toData);
        return this.encodeInvoke(QueueContainsAllCodec, rawItems)
            .then((clientMessage) => {
                const response = QueueContainsAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    drainTo(arr: E[], maxElements: number = null): Promise<number> {
        const toObject = this.toObject.bind(this);
        let promise: Promise<any>;
        if (maxElements === null) {
            promise = this.encodeInvoke(QueueDrainToCodec)
                .then((clientMessage) => {
                    const response = QueueDrainToCodec.decodeResponse(clientMessage);
                    return response.response;
                });
        } else {
            promise = this.encodeInvoke(QueueDrainToMaxSizeCodec, maxElements)
                .then((clientMessage) => {
                    const response = QueueDrainToMaxSizeCodec.decodeResponse(clientMessage);
                    return response.response;
                });
        }
        return promise.then(function (rawArr: Data[]): number {
            rawArr.forEach(function (rawItem): void {
                arr.push(toObject(rawItem));
            });
            return rawArr.length;
        });
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke(QueueIsEmptyCodec)
            .then((clientMessage) => {
                const response = QueueIsEmptyCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    offer(item: E, time = 0): Promise<boolean> {
        const itemData = this.toData(item);
        return this.encodeInvoke(QueueOfferCodec, itemData, time)
            .then((clientMessage) => {
                const response = QueueOfferCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    peek(): Promise<E> {
        return this.encodeInvoke(QueuePeekCodec)
            .then((clientMessage) => {
                const response = QueuePeekCodec.decodeResponse(clientMessage);
                return this.toObject(response.response);
            });
    }

    poll(time = 0): Promise<E> {
        return this.encodeInvoke(QueuePollCodec, time)
            .then((clientMessage) => {
                const response = QueuePollCodec.decodeResponse(clientMessage);
                return this.toObject(response.response);
            });
    }

    put(item: E): Promise<void> {
        const itemData = this.toData(item);
        return this.encodeInvoke(QueuePutCodec, itemData).then();
    }

    remainingCapacity(): Promise<number> {
        return this.encodeInvoke(QueueRemainingCapacityCodec)
            .then((clientMessage) => {
                const response = QueueRemainingCapacityCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    remove(item: E): Promise<boolean> {
        const itemData = this.toData(item);
        return this.encodeInvoke(QueueRemoveCodec, itemData)
            .then((clientMessage) => {
                const response = QueueRemoveCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    removeAll(items: E[]): Promise<boolean> {
        const toData = this.toData.bind(this);
        const rawItems = items.map<Data>(toData);
        return this.encodeInvoke(QueueCompareAndRemoveAllCodec, rawItems)
            .then((clientMessage) => {
                const response = QueueCompareAndRemoveAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    removeItemListener(registrationId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(registrationId);
    }

    retainAll(items: E[]): Promise<boolean> {
        const toData = this.toData.bind(this);
        const rawItems = items.map<Data>(toData);
        return this.encodeInvoke(QueueCompareAndRetainAllCodec, rawItems)
            .then((clientMessage) => {
                const response = QueueCompareAndRetainAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    size(): Promise<number> {
        return this.encodeInvoke(QueueSizeCodec)
            .then((clientMessage) => {
                const response = QueueSizeCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    take(): Promise<E> {
        return this.encodeInvoke(QueueTakeCodec)
            .then((clientMessage) => {
                const response = QueueTakeCodec.decodeResponse(clientMessage);
                return this.toObject(response.response);
            });
    }

    toArray(): Promise<E[]> {
        return this.encodeInvoke(QueueIteratorCodec)
            .then((clientMessage) => {
                const response = QueueIteratorCodec.decodeResponse(clientMessage);
                return response.response.map(this.toObject.bind(this));
            });
    }

    private createEntryListener(name: string, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return QueueAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return QueueAddListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return QueueRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
