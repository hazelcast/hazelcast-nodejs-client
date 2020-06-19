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

import * as Long from 'long';
import {MultiMapForceUnlockCodec} from '../codec/MultiMapForceUnlockCodec';
import {MultiMapIsLockedCodec} from '../codec/MultiMapIsLockedCodec';
import {MultiMapLockCodec} from '../codec/MultiMapLockCodec';
import {MultiMapTryLockCodec} from '../codec/MultiMapTryLockCodec';
import {MultiMapUnlockCodec} from '../codec/MultiMapUnlockCodec';
import {EventType} from '../core/EventType';
import {EntryEvent, EntryListener} from '../core/EntryListener';
import {ReadOnlyLazyList} from '../core/ReadOnlyLazyList';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {LockReferenceIdGenerator} from '../LockReferenceIdGenerator';
import {Data} from '../serialization/Data';
import {MultiMapAddEntryListenerCodec} from '../codec/MultiMapAddEntryListenerCodec';
import {MultiMapAddEntryListenerToKeyCodec} from '../codec/MultiMapAddEntryListenerToKeyCodec';
import {MultiMapClearCodec} from '../codec/MultiMapClearCodec';
import {MultiMapContainsEntryCodec} from '../codec/MultiMapContainsEntryCodec';
import {MultiMapContainsKeyCodec} from '../codec/MultiMapContainsKeyCodec';
import {MultiMapContainsValueCodec} from '../codec/MultiMapContainsValueCodec';
import {MultiMapEntrySetCodec} from '../codec/MultiMapEntrySetCodec';
import {MultiMapGetCodec} from '../codec/MultiMapGetCodec';
import {MultiMapKeySetCodec} from '../codec/MultiMapKeySetCodec';
import {MultiMapPutCodec} from '../codec/MultiMapPutCodec';
import {MultiMapRemoveCodec} from '../codec/MultiMapRemoveCodec';
import {MultiMapRemoveEntryCodec} from '../codec/MultiMapRemoveEntryCodec';
import {MultiMapRemoveEntryListenerCodec} from '../codec/MultiMapRemoveEntryListenerCodec';
import {MultiMapSizeCodec} from '../codec/MultiMapSizeCodec';
import {MultiMapValueCountCodec} from '../codec/MultiMapValueCountCodec';
import {MultiMapValuesCodec} from '../codec/MultiMapValuesCodec';
import {BaseProxy} from './BaseProxy';
import {MultiMap} from './MultiMap';
import {MapEvent} from '../core/MapListener';
import {ClientMessage} from '../ClientMessage';
import {UUID} from '../core/UUID';
import * as SerializationUtil from '../serialization/SerializationUtil';

export class MultiMapProxy<K, V> extends BaseProxy implements MultiMap<K, V> {

    private lockReferenceIdGenerator: LockReferenceIdGenerator = this.client.getLockReferenceIdGenerator();
    private deserializeList = <X>(items: Data[]): X[] => {
        return items.map<X>(this.toObject.bind(this));
        // tslint:disable-next-line:semicolon
    };

    /*tslint:disable:member-ordering*/
    put(key: K, value: V): Promise<boolean> {
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.encodeInvokeOnKey(MultiMapPutCodec, keyData, keyData, valueData, 1)
            .then((clientMessage) => {
                const response = MultiMapPutCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    get(key: K): Promise<ReadOnlyLazyList<V>> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapGetCodec, keyData, keyData, 1)
            .then((clientMessage) => {
                const response = MultiMapGetCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList<V>(response.response, this.client.getSerializationService());
            });
    }

    remove(key: K, value: V): Promise<boolean> {
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.encodeInvokeOnKey(MultiMapRemoveEntryCodec, keyData, keyData, valueData, 1)
            .then((clientMessage) => {
                const response = MultiMapRemoveEntryCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    removeAll(key: K): Promise<ReadOnlyLazyList<V>> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapRemoveCodec, keyData, keyData, 1)
            .then((clientMessage) => {
                const response = MultiMapRemoveCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList<V>(response.response, this.client.getSerializationService());
            });
    }

    keySet(): Promise<K[]> {
        return this.encodeInvokeOnRandomTarget(MultiMapKeySetCodec)
            .then((clientMessage) => {
                const response = MultiMapKeySetCodec.decodeResponse(clientMessage);
                return this.deserializeList(response.response);
            });
    }

    values(): Promise<ReadOnlyLazyList<V>> {
        return this.encodeInvokeOnRandomTarget(MultiMapValuesCodec)
            .then((clientMessage) => {
                const response = MultiMapValuesCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList<V>(response.response, this.client.getSerializationService());
            });
    }

    entrySet(): Promise<Array<[K, V]>> {
        return this.encodeInvokeOnRandomTarget(MultiMapEntrySetCodec)
            .then((clientMessage) => {
                const response = MultiMapEntrySetCodec.decodeResponse(clientMessage);
                return SerializationUtil.deserializeEntryList(this.toObject.bind(this), response.response);
            });
    }

    containsKey(key: K): Promise<boolean> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapContainsKeyCodec, keyData, keyData, 1)
            .then((clientMessage) => {
                const response = MultiMapContainsKeyCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    containsValue(value: V): Promise<boolean> {
        const valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget(MultiMapContainsValueCodec, valueData)
            .then((clientMessage) => {
                const response = MultiMapContainsValueCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    containsEntry(key: K, value: V): Promise<boolean> {
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.encodeInvokeOnKey(MultiMapContainsEntryCodec, keyData, keyData, valueData, 1)
            .then((clientMessage) => {
                const response = MultiMapContainsEntryCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    size(): Promise<number> {
        return this.encodeInvokeOnRandomTarget(MultiMapSizeCodec)
            .then((clientMessage) => {
                const response = MultiMapSizeCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(MultiMapClearCodec)
            .then(() => undefined);
    }

    valueCount(key: K): Promise<number> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapValueCountCodec, keyData, keyData, 1)
            .then((clientMessage) => {
                const response = MultiMapValueCountCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    addEntryListener(listener: EntryListener<K, V>, key?: K, includeValue = true): Promise<string> {
        const toObject = this.toObject.bind(this);

        /* tslint:disable: no-shadowed-variable */
        const entryEventHandler = (keyData: Data, valueData: Data, oldValueData: Data, mergingValueData: Data, eventType: number,
                                   uuid: UUID, numberOfAffectedEntries: number): void => {
            const member = this.client.getClusterService().getMember(uuid);
            const name = this.name;

            key = toObject(keyData);
            const value = toObject(valueData);
            const oldValue = toObject(oldValueData);
            const mergingValue = toObject(mergingValueData);

            const entryEvent = new EntryEvent(name, key, value, oldValue, mergingValue, member);

            const mapEvent = new MapEvent(name, numberOfAffectedEntries, member);

            // Multi map only supports these three event types
            switch (eventType) {
                case EventType.ADDED:
                    if (listener.added) {
                        listener.added.apply(null, [entryEvent]);
                    }
                    break;
                case EventType.REMOVED:
                    if (listener.removed) {
                        listener.removed.apply(null, [entryEvent]);
                    }
                    break;
                case EventType.CLEAR_ALL:
                    if (listener.mapCleared) {
                        listener.mapCleared.apply(null, [mapEvent]);
                    }
                    break;
            }
        };

        if (key) {
            const keyData = this.toData(key);
            const handler = (m: ClientMessage): void => {
                MultiMapAddEntryListenerToKeyCodec.handle(m, entryEventHandler);
            };
            const codec = this.createEntryListenerToKey(this.name, keyData, includeValue);

            return this.client.getListenerService().registerListener(codec, handler);
        } else {
            const listenerHandler = (m: ClientMessage): void => {
                MultiMapAddEntryListenerCodec.handle(m, entryEventHandler);
            };
            const codec = this.createEntryListener(this.name, includeValue);

            return this.client.getListenerService().registerListener(codec, listenerHandler);
        }
    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(listenerId);
    }

    lock(key: K, leaseMillis = -1): Promise<void> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapLockCodec, keyData, keyData, 1, leaseMillis, this.nextSequence())
            .then(() => undefined);
    }

    isLocked(key: K): Promise<boolean> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapIsLockedCodec, keyData, keyData)
            .then((clientMessage) => {
                const response = MultiMapIsLockedCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    tryLock(key: K, timeoutMillis = 0, leaseMillis = -1): Promise<boolean> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapTryLockCodec, keyData, keyData, 1, leaseMillis, timeoutMillis, this.nextSequence())
            .then((clientMessage) => {
                const response = MultiMapTryLockCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    unlock(key: K): Promise<void> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapUnlockCodec, keyData, keyData, 1, this.nextSequence())
            .then(() => undefined);
    }

    forceUnlock(key: K): Promise<void> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapForceUnlockCodec, keyData, keyData, this.nextSequence())
            .then(() => undefined);
    }

    private nextSequence(): Long {
        return this.lockReferenceIdGenerator.getNextReferenceId();
    }

    private createEntryListenerToKey(name: string, keyData: Data, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MultiMapAddEntryListenerToKeyCodec.encodeRequest(name, keyData, includeValue, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return MultiMapAddEntryListenerToKeyCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return MultiMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListener(name: string, includeValue: boolean): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MultiMapAddEntryListenerCodec.encodeRequest(name, includeValue, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return MultiMapAddEntryListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return MultiMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
