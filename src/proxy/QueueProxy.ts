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
/** @ignore *//** */

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
import {IllegalStateError, SchemaNotReplicatedError, UUID} from '../core';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {IQueue} from './IQueue';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {ClientMessage} from '../protocol/ClientMessage';

/** @internal */
export class QueueProxy<E> extends PartitionSpecificProxy implements IQueue<E> {

    add(item: E): Promise<boolean> {
        return this.offer(item).then((ret: boolean) => {
            if (ret) {
                return true;
            } else {
                throw new IllegalStateError('Queue is full.');
            }
        });
    }

    addAll(items: E[]): Promise<boolean> {
        let rawList: Data[];
        try {
            rawList = this.serializeList(items);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAll(items));
            }
            throw e;
        }
        return this.encodeInvoke(QueueAddAllCodec, QueueAddAllCodec.decodeResponse, rawList);
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

    clear(): Promise<void> {
        return this.encodeInvoke(QueueClearCodec, () => {});
    }

    contains(item: E): Promise<boolean> {
        let itemData: Data;
        try {
            itemData = this.toData(item);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.contains(item));
            }
            throw e;
        }

        return this.encodeInvoke(QueueContainsCodec, QueueContainsCodec.decodeResponse, itemData);
    }

    containsAll(items: E[]): Promise<boolean> {
        let rawItems: Data[];
        try {
            rawItems = this.serializeList(items);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsAll(items));
            }
            throw e;
        }

        return this.encodeInvoke(QueueContainsAllCodec, QueueContainsAllCodec.decodeResponse, rawItems);
    }

    drainTo(arr: E[], maxElements?: number): Promise<number> {
        let promise: Promise<any>;
        if (maxElements === undefined) {
            promise = this.encodeInvoke(QueueDrainToCodec, QueueDrainToCodec.decodeResponse);
        } else {
            promise = this.encodeInvoke(QueueDrainToMaxSizeCodec, QueueDrainToMaxSizeCodec.decodeResponse, maxElements);
        }
        return promise.then((rawArr: Data[]) => {
            const deserializedArr = this.deserializeList(rawArr);
            deserializedArr.forEach((item: any) => {
                arr.push(item);
            });
            return rawArr.length;
        });
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke(QueueIsEmptyCodec, QueueIsEmptyCodec.decodeResponse);
    }

    offer(item: E, time = 0): Promise<boolean> {
        let itemData: Data;
        try {
            itemData = this.toData(item);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.offer(item, time));
            }
            throw e;
        }
        return this.encodeInvoke(QueueOfferCodec, QueueOfferCodec.decodeResponse, itemData, time);
    }

    peek(): Promise<E> {
        return this.encodeInvoke(QueuePeekCodec, (clientMessage) => {
            const response = QueuePeekCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        });
    }

    poll(time = 0): Promise<E> {
        return this.encodeInvoke(QueuePollCodec, (clientMessage) => {
            const response = QueuePollCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, time);
    }

    put(item: E): Promise<void> {
        let itemData: Data;
        try {
            itemData = this.toData(item);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.put(item));
            }
            throw e;
        }
        return this.encodeInvoke(QueuePutCodec, () => {}, itemData);
    }

    remainingCapacity(): Promise<number> {
        return this.encodeInvoke(QueueRemainingCapacityCodec, QueueRemainingCapacityCodec.decodeResponse);
    }

    remove(item: E): Promise<boolean> {
        let itemData: Data;
        try {
            itemData = this.toData(item);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(item));
            }
            throw e;
        }

        return this.encodeInvoke(QueueRemoveCodec, QueueRemoveCodec.decodeResponse, itemData);
    }

    removeAll(items: E[]): Promise<boolean> {
        let rawItems: Data[];
        try {
            rawItems = this.serializeList(items);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.removeAll(items));
            }
            throw e;
        }

        return this.encodeInvoke(QueueCompareAndRemoveAllCodec, QueueCompareAndRemoveAllCodec.decodeResponse, rawItems);
    }

    removeItemListener(registrationId: string): Promise<boolean> {
        return this.listenerService.deregisterListener(registrationId);
    }

    retainAll(items: E[]): Promise<boolean> {
        let rawItems: Data[];
        try {
            rawItems = this.serializeList(items);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.retainAll(items));
            }
            throw e;
        }

        return this.encodeInvoke(QueueCompareAndRetainAllCodec, QueueCompareAndRetainAllCodec.decodeResponse, rawItems);
    }

    size(): Promise<number> {
        return this.encodeInvoke(QueueSizeCodec, QueueSizeCodec.decodeResponse);
    }

    take(): Promise<E> {
        return this.encodeInvoke(QueueTakeCodec, (clientMessage) => {
            const response = QueueTakeCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        });
    }

    toArray(): Promise<E[]> {
        return this.encodeInvoke(QueueIteratorCodec, (clientMessage) => {
            const response = QueueIteratorCodec.decodeResponse(clientMessage);
            return this.deserializeList(response);
        });
    }

    private createEntryListener(name: string, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return QueueAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return QueueAddListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return QueueRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
