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
    SchemaNotReplicatedError,
    UUID
} from '../core';
import {MultiMapPutAllCodec} from '../codec/MultiMapPutAllCodec';
import {LockReferenceIdGenerator} from './LockReferenceIdGenerator';
import {ProxyManager} from './ProxyManager';
import {PartitionService} from '../PartitionService';
import {InvocationService} from '../invocation/InvocationService';
import {SerializationService} from '../serialization/SerializationService';
import {ConnectionRegistry} from '../network/ConnectionRegistry';
import {ListenerService} from '../listener/ListenerService';
import {ClusterService} from '../invocation/ClusterService';
import {SchemaService} from '../serialization/compact/SchemaService';

/** @internal */
export class MultiMapProxy<K, V> extends BaseProxy implements MultiMap<K, V> {

    constructor(
        serviceName: string,
        name: string,
        proxyManager: ProxyManager,
        partitionService: PartitionService,
        invocationService: InvocationService,
        serializationService: SerializationService,
        listenerService: ListenerService,
        clusterService: ClusterService,
        private lockReferenceIdGenerator: LockReferenceIdGenerator,
        connectionRegistry: ConnectionRegistry,
        schemaService: SchemaService
    ) {
        super(
            serviceName,
            name,
            proxyManager,
            partitionService,
            invocationService,
            serializationService,
            listenerService,
            clusterService,
            connectionRegistry,
            schemaService
        );
    }

    put(key: K, value: V): Promise<boolean> {
        let keyData: Data, valueData: Data;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.put(key, value));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(MultiMapPutCodec, keyData, MultiMapPutCodec.decodeResponse, keyData, valueData, 1);
    }

    get(key: K): Promise<ReadOnlyLazyList<V>> {
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.get(key));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(MultiMapGetCodec, keyData, (clientMessage) => {
            const response = MultiMapGetCodec.decodeResponse(clientMessage);
            return new ReadOnlyLazyList<V>(this.deserializeList(response));
        }, keyData, 1);
    }

    remove(key: K, value: V): Promise<boolean> {
        let keyData: Data, valueData: Data;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(key, value));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(
            MultiMapRemoveEntryCodec, keyData, MultiMapRemoveEntryCodec.decodeResponse, keyData, valueData, 1
        );
    }

    removeAll(key: K): Promise<ReadOnlyLazyList<V>> {
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.removeAll(key));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(MultiMapRemoveCodec, keyData, (clientMessage) => {
            const response = MultiMapRemoveCodec.decodeResponse(clientMessage);
            return new ReadOnlyLazyList<V>(this.deserializeList(response));
        }, keyData, 1);
    }

    keySet(): Promise<K[]> {
        return this.encodeInvokeOnRandomTarget(MultiMapKeySetCodec, (clientMessage) => {
            const response = MultiMapKeySetCodec.decodeResponse(clientMessage);
            return this.deserializeList(response);
        });
    }

    values(): Promise<ReadOnlyLazyList<V>> {
        return this.encodeInvokeOnRandomTarget(MultiMapValuesCodec, (clientMessage) => {
            const response = MultiMapValuesCodec.decodeResponse(clientMessage);
            return new ReadOnlyLazyList<V>(this.deserializeList(response));
        });
    }

    entrySet(): Promise<Array<[K, V]>> {
        return this.encodeInvokeOnRandomTarget(MultiMapEntrySetCodec, (clientMessage) => {
            const response = MultiMapEntrySetCodec.decodeResponse(clientMessage);
            return this.deserializeEntryList(this.toObject.bind(this), response);
        });
    }

    containsKey(key: K): Promise<boolean> {
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsKey(key));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(MultiMapContainsKeyCodec, keyData, MultiMapContainsKeyCodec.decodeResponse, keyData, 1);
    }

    containsValue(value: V): Promise<boolean> {
        let valueData: Data;
        try {
            valueData = this.toData(value);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsValue(value));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnRandomTarget(MultiMapContainsValueCodec, MultiMapContainsValueCodec.decodeResponse, valueData);
    }

    containsEntry(key: K, value: V): Promise<boolean> {
        let keyData: Data, valueData: Data;
        try {
            keyData = this.toData(key);
            valueData = this.toData(value);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsEntry(key, value));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(
            MultiMapContainsEntryCodec, keyData, MultiMapContainsEntryCodec.decodeResponse, keyData, valueData, 1
        );
    }

    size(): Promise<number> {
        return this.encodeInvokeOnRandomTarget(MultiMapSizeCodec, MultiMapSizeCodec.decodeResponse);
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(MultiMapClearCodec, () => {});
    }

    valueCount(key: K): Promise<number> {
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.valueCount(key));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(MultiMapValueCountCodec, keyData, MultiMapValueCountCodec.decodeResponse, keyData, 1);
    }

    addEntryListener(listener: EntryListener<K, V>, key?: K, includeValue = true): Promise<string> {
        const entryEventHandler = (keyData: Data,
                                   valueData: Data,
                                   oldValueData: Data,
                                   mergingValueData: Data,
                                   eventType: number,
                                   uuid: UUID,
                                   numberOfAffectedEntries: number): void => {
            const member = this.clusterService.getMember(uuid.toString());
            const name = this.name;

            key = this.toObject(keyData);
            const value = this.toObject(valueData);
            const oldValue = this.toObject(oldValueData);
            const mergingValue = this.toObject(mergingValueData);

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
            let keyData: Data;
            try {
                keyData = this.toData(key);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.addEntryListener(listener, key, includeValue));
                }
                return Promise.reject(e);
            }
            const handler = (m: ClientMessage): void => {
                MultiMapAddEntryListenerToKeyCodec.handle(m, entryEventHandler);
            };
            const codec = this.createEntryListenerToKey(this.name, keyData, includeValue);

            return this.listenerService.registerListener(codec, handler);
        } else {
            const listenerHandler = (m: ClientMessage): void => {
                MultiMapAddEntryListenerCodec.handle(m, entryEventHandler);
            };
            const codec = this.createEntryListener(this.name, includeValue);

            return this.listenerService.registerListener(codec, listenerHandler);
        }
    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.listenerService.deregisterListener(listenerId);
    }

    lock(key: K, leaseMillis = -1): Promise<void> {
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.lock(key, leaseMillis));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(
            MultiMapLockCodec, keyData, () => {}, keyData, 1, leaseMillis, this.nextSequence()
        );
    }

    isLocked(key: K): Promise<boolean> {
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.isLocked(key));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(MultiMapIsLockedCodec, keyData, MultiMapIsLockedCodec.decodeResponse, keyData);
    }

    tryLock(key: K, timeoutMillis = 0, leaseMillis = -1): Promise<boolean> {
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.tryLock(key, timeoutMillis, leaseMillis));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(
            MultiMapTryLockCodec,
            keyData,
            MultiMapTryLockCodec.decodeResponse,
            keyData,
            1,
            leaseMillis,timeoutMillis,
            this.nextSequence()
        );
    }

    unlock(key: K): Promise<void> {
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.unlock(key));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(MultiMapUnlockCodec, keyData, () => {}, keyData, 1, this.nextSequence());
    }

    forceUnlock(key: K): Promise<void> {
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.forceUnlock(key));
            }
            return Promise.reject(e);
        }
        return this.encodeInvokeOnKey(MultiMapForceUnlockCodec, keyData, () => {}, keyData, this.nextSequence());
    }

    putAll(pairs: Array<[K, V[]]>): Promise<void> {
        if (pairs.length === 0) {
            return Promise.resolve();
        }

        const dataPairs: Array<[Data, Data[]]> = [];
        for (const pair of pairs) {
            try {
                const valuesData = this.serializeList(pair[1]);
                dataPairs.push([this.toData(pair[0]), valuesData]);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.putAll(pairs));
                }
                return Promise.reject(e);
            }
        }

        const partitionService = this.partitionService;
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

        const partitionPromises: Array<Promise<void>> = [];
        partitionToDataPairs.forEach((pair, partitionId) => {
           partitionPromises.push(this.encodeInvokeOnPartition(MultiMapPutAllCodec, partitionId, () => {}, pair));
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
