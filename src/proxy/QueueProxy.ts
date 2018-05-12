/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import {IQueue} from './IQueue';
import {ItemEventType, ItemListener} from '../core/ItemListener';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {QueueSizeCodec} from '../codec/QueueSizeCodec';
import {QueueOfferCodec} from '../codec/QueueOfferCodec';
import {QueuePeekCodec} from '../codec/QueuePeekCodec';
import * as Promise from 'bluebird';
import {QueuePollCodec} from '../codec/QueuePollCodec';
import {QueueRemainingCapacityCodec} from '../codec/QueueRemainingCapacityCodec';
import {QueueRemoveCodec} from '../codec/QueueRemoveCodec';
import {QueueContainsCodec} from '../codec/QueueContainsCodec';
import {QueueIteratorCodec} from '../codec/QueueIteratorCodec';
import {Data} from '../serialization/Data';
import {QueueClearCodec} from '../codec/QueueClearCodec';
import {QueueDrainToCodec} from '../codec/QueueDrainToCodec';
import {QueueDrainToMaxSizeCodec} from '../codec/QueueDrainToMaxSizeCodec';
import {QueueIsEmptyCodec} from '../codec/QueueIsEmptyCodec';
import {QueueTakeCodec} from '../codec/QueueTakeCodec';
import {QueueAddAllCodec} from '../codec/QueueAddAllCodec';
import {QueueContainsAllCodec} from '../codec/QueueContainsAllCodec';
import {QueuePutCodec} from '../codec/QueuePutCodec';
import {QueueCompareAndRemoveAllCodec} from '../codec/QueueCompareAndRemoveAllCodec';
import {QueueCompareAndRetainAllCodec} from '../codec/QueueCompareAndRetainAllCodec';
import {QueueAddListenerCodec} from '../codec/QueueAddListenerCodec';
import {QueueRemoveListenerCodec} from '../codec/QueueRemoveListenerCodec';
import {IllegalStateError} from '../HazelcastError';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import ClientMessage = require('../ClientMessage');

export class QueueProxy<E> extends PartitionSpecificProxy implements IQueue<E> {

    add(item: E): Promise<boolean> {
        return this.offer(item).then(function (ret) {
            if (ret) {
                return true;
            } else {
                throw new IllegalStateError('Queue is full.');
            }
        });
    }

    addAll(items: E[]): Promise<boolean> {
        var rawList: Data[] = [];
        var toData = this.toData.bind(this);
        items.forEach(function (item) {
            rawList.push(toData(item));
        });
        return this.encodeInvoke<boolean>(QueueAddAllCodec, rawList);
    }

    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string> {
        var handler = (message: ClientMessage) => {
            QueueAddListenerCodec.handle(message, (item: Data, uuid: string, eventType: number) => {
                var responseObject: E;
                if (item == null) {
                    responseObject = null;
                } else {
                    responseObject = this.toObject(item);
                }
                if (eventType === ItemEventType.ADDED) {
                    listener.itemAdded(responseObject, null, eventType);
                } else if (eventType === ItemEventType.REMOVED) {
                    listener.itemRemoved(responseObject, null, eventType);
                }
            });
        };
        let codec = this.createEntryListener(this.name, includeValue);
        return this.client.getListenerService().registerListener(codec, handler);
    }

    clear(): Promise<void> {
        return this.encodeInvoke<void>(QueueClearCodec);
    }

    contains(item: E): Promise<boolean> {
        var itemData = this.toData(item);
        return this.encodeInvoke<boolean>(QueueContainsCodec, itemData);
    }

    containsAll(items: E[]): Promise<boolean> {
        var toData = this.toData.bind(this);
        var rawItems: Data[] = items.map<Data>(toData);
        return this.encodeInvoke<boolean>(QueueContainsAllCodec, rawItems);
    }

    drainTo(arr: E[], maxElements: number = null): Promise<number> {
        var toObject = this.toObject.bind(this);
        var promise: Promise<any>;
        if (maxElements === null) {
            promise = this.encodeInvoke<any>(QueueDrainToCodec);
        } else {
            promise = this.encodeInvoke<any>(QueueDrainToMaxSizeCodec, maxElements);
        }
        return promise.then(function (rawArr: Data[]) {
            rawArr.forEach(function (rawItem) {
                arr.push(toObject(rawItem));
            });
            return rawArr.length;
        });
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke<boolean>(QueueIsEmptyCodec);
    }

    offer(item: E, time: number = 0): Promise<boolean> {
        var itemData = this.toData(item);
        return this.encodeInvoke<boolean>(QueueOfferCodec, itemData, time);
    }

    peek(): Promise<E> {
        return this.encodeInvoke<E>(QueuePeekCodec);
    }

    poll(time: number = 0): Promise<E> {
        return this.encodeInvoke<E>(QueuePollCodec, time);
    }

    put(item: E): Promise<void> {
        var itemData = this.toData(item);
        return this.encodeInvoke<void>(QueuePutCodec, itemData);
    }

    remainingCapacity(): Promise<number> {
        return this.encodeInvoke<number>(QueueRemainingCapacityCodec);
    }

    remove(item: E): Promise<boolean> {
        var itemData = this.toData(item);
        return this.encodeInvoke<boolean>(QueueRemoveCodec, itemData);
    }

    removeAll(items: E[]): Promise<boolean> {
        var toData = this.toData.bind(this);
        var rawItems = items.map<Data>(toData);
        return this.encodeInvoke<boolean>(QueueCompareAndRemoveAllCodec, rawItems);
    }

    removeItemListener(registrationId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(registrationId);
    }

    retainAll(items: E[]): Promise<boolean> {
        var toData = this.toData.bind(this);
        var rawItems = items.map<Data>(toData);
        return this.encodeInvoke<boolean>(QueueCompareAndRetainAllCodec, rawItems);
    }

    size(): Promise<number> {
        return this.encodeInvoke<number>(QueueSizeCodec);
    }

    take(): Promise<E> {
        return this.encodeInvoke<E>(QueueTakeCodec);
    }

    toArray(): Promise<E[]> {
        var arr: E[] = [];
        var toObject = this.toObject.bind(this);
        return this.encodeInvoke<Data[]>(QueueIteratorCodec).then(function (dataArray) {
            dataArray.forEach(function (data) {
                arr.push(toObject(data));
            });
            return arr;
        });
    }

    private createEntryListener(name: string, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest: function (localOnly: boolean): ClientMessage {
                return QueueAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse: function (msg: ClientMessage): string {
                return QueueAddListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest: function (listenerId: string): ClientMessage {
                return QueueRemoveListenerCodec.encodeRequest(name, listenerId);
            }
        };
    }
}
