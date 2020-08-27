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
import {UUID} from '../core';

/** @internal */
export class SetProxy<E> extends PartitionSpecificProxy implements ISet<E> {

    add(entry: E): Promise<boolean> {
        return this.encodeInvoke(SetAddCodec, this.toData(entry))
            .then((clientMessage) => {
                const response = SetAddCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    addAll(items: E[]): Promise<boolean> {
        return this.encodeInvoke(SetAddAllCodec, this.serializeList(items))
            .then((clientMessage) => {
                const response = SetAddAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    toArray(): Promise<E[]> {
        return this.encodeInvoke(SetGetAllCodec)
            .then((clientMessage) => {
                const response = SetGetAllCodec.decodeResponse(clientMessage);
                return response.response.map(this.toObject.bind(this));
            });
    }

    clear(): Promise<void> {
        return this.encodeInvoke(SetClearCodec).then();
    }

    contains(entry: E): Promise<boolean> {
        return this.encodeInvoke(SetContainsCodec, this.toData(entry))
            .then((clientMessage) => {
                const response = SetContainsCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    containsAll(items: E[]): Promise<boolean> {
        return this.encodeInvoke(SetContainsAllCodec, this.serializeList(items))
            .then((clientMessage) => {
                const response = SetContainsAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke(SetIsEmptyCodec)
            .then((clientMessage) => {
                const response = SetIsEmptyCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    remove(entry: E): Promise<boolean> {
        return this.encodeInvoke(SetRemoveCodec, this.toData(entry))
            .then((clientMessage) => {
                const response = SetRemoveCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    removeAll(items: E[]): Promise<boolean> {
        return this.encodeInvoke(SetCompareAndRemoveAllCodec, this.serializeList(items))
            .then((clientMessage) => {
                const response = SetCompareAndRemoveAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    retainAll(items: E[]): Promise<boolean> {
        return this.encodeInvoke(SetCompareAndRetainAllCodec, this.serializeList(items))
            .then((clientMessage) => {
                const response = SetCompareAndRetainAllCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    size(): Promise<number> {
        return this.encodeInvoke(SetSizeCodec)
            .then((clientMessage) => {
                const response = SetSizeCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    addItemListener(listener: ItemListener<E>, includeValue = true): Promise<string> {
        const handler = (message: ClientMessage): void => {
            SetAddListenerCodec.handle(message, (item: Data, uuid: UUID, eventType: number) => {
                const responseObject = this.toObject(item);
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

    removeItemListener(registrationId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(registrationId);
    }

    private serializeList(input: any[]): Data[] {
        return input.map((each) => {
            return this.toData(each);
        });
    }

    private createEntryListener(name: string, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return SetAddListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return SetAddListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return SetRemoveListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
