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

import * as Long from 'long';
import {MultiMapForceUnlockCodec} from '../codec/MultiMapForceUnlockCodec';
import {MultiMapIsLockedCodec} from '../codec/MultiMapIsLockedCodec';
import {MultiMapLockCodec} from '../codec/MultiMapLockCodec';
import {MultiMapTryLockCodec} from '../codec/MultiMapTryLockCodec';
import {MultiMapUnlockCodec} from '../codec/MultiMapUnlockCodec';
import {EventType} from './EventType';
import {EntryEvent, EntryListener} from './EntryListener';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
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
import {MapEvent} from './MapListener';
import {ClientMessage} from '../protocol/ClientMessage';
import {
    ReadOnlyLazyList,
    UUID
} from '../core';
import * as SerializationUtil from '../serialization/SerializationUtil';
import {MultiMapPutAllCodec} from '../codec/MultiMapPutAllCodec';

/** @internal */
export class MultiMapProxy<K, V> extends BaseProxy implements MultiMap<K, V> {

    private lockReferenceIdGenerator = this.client.getLockReferenceIdGenerator();
    private deserializeList = <X>(items: Data[]): X[] => {
        return items.map<X>(this.toObject.bind(this));
    };

    put(key: K, value: V): Promise<boolean> {
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.encodeInvokeOnKey(MultiMapPutCodec, keyData, keyData, valueData, 1)
            .then(MultiMapPutCodec.decodeResponse);
    }

    get(key: K): Promise<ReadOnlyLazyList<V>> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapGetCodec, keyData, keyData, 1)
            .then((clientMessage) => {
                const response = MultiMapGetCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList<V>(response, this.client.getSerializationService());
            });
    }

    remove(key: K, value: V): Promise<boolean> {
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.encodeInvokeOnKey(MultiMapRemoveEntryCodec, keyData, keyData, valueData, 1)
            .then(MultiMapRemoveEntryCodec.decodeResponse);
    }

    removeAll(key: K): Promise<ReadOnlyLazyList<V>> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapRemoveCodec, keyData, keyData, 1)
            .then((clientMessage) => {
                const response = MultiMapRemoveCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList<V>(response, this.client.getSerializationService());
            });
    }

    keySet(): Promise<K[]> {
        return this.encodeInvokeOnRandomTarget(MultiMapKeySetCodec)
            .then((clientMessage) => {
                const response = MultiMapKeySetCodec.decodeResponse(clientMessage);
                return this.deserializeList(response);
            });
    }

    values(): Promise<ReadOnlyLazyList<V>> {
        return this.encodeInvokeOnRandomTarget(MultiMapValuesCodec)
            .then((clientMessage) => {
                const response = MultiMapValuesCodec.decodeResponse(clientMessage);
                return new ReadOnlyLazyList<V>(response, this.client.getSerializationService());
            });
    }

    entrySet(): Promise<Array<[K, V]>> {
        return this.encodeInvokeOnRandomTarget(MultiMapEntrySetCodec)
            .then((clientMessage) => {
                const response = MultiMapEntrySetCodec.decodeResponse(clientMessage);
                return SerializationUtil.deserializeEntryList(this.toObject.bind(this), response);
            });
    }

    containsKey(key: K): Promise<boolean> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapContainsKeyCodec, keyData, keyData, 1)
            .then(MultiMapContainsKeyCodec.decodeResponse);
    }

    containsValue(value: V): Promise<boolean> {
        const valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget(MultiMapContainsValueCodec, valueData)
            .then(MultiMapContainsValueCodec.decodeResponse);
    }

    containsEntry(key: K, value: V): Promise<boolean> {
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.encodeInvokeOnKey(MultiMapContainsEntryCodec, keyData, keyData, valueData, 1)
            .then(MultiMapContainsEntryCodec.decodeResponse);
    }

    size(): Promise<number> {
        return this.encodeInvokeOnRandomTarget(MultiMapSizeCodec)
            .then(MultiMapSizeCodec.decodeResponse);
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(MultiMapClearCodec).then(() => {});
    }

    valueCount(key: K): Promise<number> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapValueCountCodec, keyData, keyData, 1)
            .then(MultiMapValueCountCodec.decodeResponse);
    }

    addEntryListener(listener: EntryListener<K, V>, key?: K, includeValue = true): Promise<string> {
        const toObject = this.toObject.bind(this);

        const entryEventHandler = (keyData: Data,
                                   valueData: Data,
                                   oldValueData: Data,
                                   mergingValueData: Data,
                                   eventType: number,
                                   uuid: UUID,
                                   numberOfAffectedEntries: number): void => {
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
        return this.encodeInvokeOnKey(
            MultiMapLockCodec, keyData, keyData, 1, leaseMillis, this.nextSequence()
        ).then(() => {});
    }

    isLocked(key: K): Promise<boolean> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapIsLockedCodec, keyData, keyData)
            .then(MultiMapIsLockedCodec.decodeResponse);
    }

    tryLock(key: K, timeoutMillis = 0, leaseMillis = -1): Promise<boolean> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(
            MultiMapTryLockCodec, keyData, keyData, 1, leaseMillis,timeoutMillis, this.nextSequence()
        ).then(MultiMapTryLockCodec.decodeResponse);
    }

    unlock(key: K): Promise<void> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapUnlockCodec, keyData, keyData, 1, this.nextSequence())
            .then(() => {});
    }

    forceUnlock(key: K): Promise<void> {
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(MultiMapForceUnlockCodec, keyData, keyData, this.nextSequence())
            .then(() => {});
    }

    putAll(pairs: Array<[K, V[]]>): Promise<void> {
        if (pairs.length === 0) {
            return Promise.resolve();
        }

        const dataPairs: Array<[Data, Data[]]> = [];
        for (const pair of pairs) {
            const valuesData = SerializationUtil.serializeList(this.toData.bind(this), pair[1]);
            dataPairs.push([this.toData(pair[0]), valuesData]);
        }

        const partitionService = this.client.getPartitionService();
        const partitionToDataPairs = new Map<number, Array<[Data, Data[]]>>();

        for (const dataPair of dataPairs) {
            const partitionId = partitionService.getPartitionId(dataPair[0]);
            let partitionedDataPairs = partitionToDataPairs.get(partitionId);
            if (partitionedDataPairs == null) {
                partitionedDataPairs = [];
                partitionToDataPairs.set(partitionId, partitionedDataPairs);
            }

            partitionedDataPairs.push(dataPair);
        }

        const partitionPromises: Array<Promise<ClientMessage>> = [];
        partitionToDataPairs.forEach((pair, partitionId) => {
           partitionPromises.push(this.encodeInvokeOnPartition(MultiMapPutAllCodec, partitionId, pair));
        });

        return Promise.all(partitionPromises).then(() => {});
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
                return MultiMapAddEntryListenerToKeyCodec.decodeResponse(msg);
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
                return MultiMapAddEntryListenerCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return MultiMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
