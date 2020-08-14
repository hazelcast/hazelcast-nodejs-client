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
import {ReplicatedMapAddEntryListenerCodec} from '../codec/ReplicatedMapAddEntryListenerCodec';
import {ReplicatedMapAddEntryListenerToKeyCodec} from '../codec/ReplicatedMapAddEntryListenerToKeyCodec';
// eslint-disable-next-line max-len
import {ReplicatedMapAddEntryListenerToKeyWithPredicateCodec} from '../codec/ReplicatedMapAddEntryListenerToKeyWithPredicateCodec';
import {ReplicatedMapAddEntryListenerWithPredicateCodec} from '../codec/ReplicatedMapAddEntryListenerWithPredicateCodec';
import {ReplicatedMapClearCodec} from '../codec/ReplicatedMapClearCodec';
import {ReplicatedMapContainsKeyCodec} from '../codec/ReplicatedMapContainsKeyCodec';
import {ReplicatedMapContainsValueCodec} from '../codec/ReplicatedMapContainsValueCodec';
import {ReplicatedMapEntrySetCodec} from '../codec/ReplicatedMapEntrySetCodec';
import {ReplicatedMapGetCodec} from '../codec/ReplicatedMapGetCodec';
import {ReplicatedMapIsEmptyCodec} from '../codec/ReplicatedMapIsEmptyCodec';
import {ReplicatedMapKeySetCodec} from '../codec/ReplicatedMapKeySetCodec';
import {ReplicatedMapPutAllCodec} from '../codec/ReplicatedMapPutAllCodec';
import {ReplicatedMapPutCodec} from '../codec/ReplicatedMapPutCodec';
import {ReplicatedMapRemoveCodec} from '../codec/ReplicatedMapRemoveCodec';
import {ReplicatedMapRemoveEntryListenerCodec} from '../codec/ReplicatedMapRemoveEntryListenerCodec';
import {ReplicatedMapSizeCodec} from '../codec/ReplicatedMapSizeCodec';
import {ReplicatedMapValuesCodec} from '../codec/ReplicatedMapValuesCodec';
import {EventType} from '../core/EventType';
import {EntryEvent, EntryListener} from '../core/EntryListener';
import {Predicate} from '../core/Predicate';
import {ReadOnlyLazyList} from '../core/ReadOnlyLazyList';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {assertNotNull} from '../Util';
import {ListComparator} from '../core/Comparator';
import {ReplicatedMap} from './ReplicatedMap';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {MapEvent} from '../core/MapListener';
import Long = require('long');
import {UUID} from '../core/UUID';
import {ClientMessage} from '../ClientMessage';
import * as SerializationUtil from '../serialization/SerializationUtil';

export class ReplicatedMapProxy<K, V> extends PartitionSpecificProxy implements ReplicatedMap<K, V> {

    put(key: K, value: V, ttl: Long | number = 0): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);

        const valueData: Data = this.toData(value);
        const keyData: Data = this.toData(key);

        return this.encodeInvokeOnKey(ReplicatedMapPutCodec, keyData, keyData, valueData, ttl)
            .then((clientMessage) => {
                const response = ReplicatedMapPutCodec.decodeResponse(clientMessage);
                return this.toObject(response.response);
            });
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(ReplicatedMapClearCodec)
            .then(() => undefined);
    }

    get(key: K): Promise<V> {
        assertNotNull(key);

        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(ReplicatedMapGetCodec, keyData, keyData)
            .then((clientMessage) => {
                const response = ReplicatedMapGetCodec.decodeResponse(clientMessage);
                return this.toObject(response.response);
            });
    }

    containsKey(key: K): Promise<boolean> {
        assertNotNull(key);

        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(ReplicatedMapContainsKeyCodec, keyData, keyData)
            .then((clientMessage) => {
                const response = ReplicatedMapContainsKeyCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    containsValue(value: V): Promise<boolean> {
        assertNotNull(value);

        const valueData = this.toData(value);
        return this.encodeInvoke(ReplicatedMapContainsValueCodec, valueData)
            .then((clientMessage) => {
                const response = ReplicatedMapContainsValueCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    size(): Promise<number> {
        return this.encodeInvoke(ReplicatedMapSizeCodec)
            .then((clientMessage) => {
                const response = ReplicatedMapSizeCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke(ReplicatedMapIsEmptyCodec)
            .then((clientMessage) => {
                const response = ReplicatedMapIsEmptyCodec.decodeResponse(clientMessage);
                return response.response;
            });
    }

    remove(key: K): Promise<V> {
        assertNotNull(key);

        const keyData = this.toData(key);
        return this.encodeInvokeOnKey(ReplicatedMapRemoveCodec, keyData, keyData)
            .then((clientMessage) => {
                const response = ReplicatedMapRemoveCodec.decodeResponse(clientMessage);
                return this.toObject(response.response);
            });
    }

    putAll(pairs: Array<[K, V]>): Promise<void> {
        let pair: [K, V];
        let pairId: string;
        const entries: Array<[Data, Data]> = [];
        for (pairId in pairs) {
            pair = pairs[pairId];
            const keyData = this.toData(pair[0]);
            const valueData = this.toData(pair[1]);
            entries.push([keyData, valueData]);
        }

        return this.encodeInvokeOnRandomTarget(ReplicatedMapPutAllCodec, entries)
            .then(() => undefined);
    }

    keySet(): Promise<K[]> {
        const toObject = this.toObject.bind(this);
        return this.encodeInvoke(ReplicatedMapKeySetCodec)
            .then((clientMessage) => {
                const response = ReplicatedMapKeySetCodec.decodeResponse(clientMessage);
                return response.response.map(toObject);
            });
    }

    values(comparator?: ListComparator<V>): Promise<ReadOnlyLazyList<V>> {
        return this.encodeInvoke(ReplicatedMapValuesCodec)
            .then((clientMessage) => {
                const response = ReplicatedMapValuesCodec.decodeResponse(clientMessage);
                const valuesData = response.response;
                if (comparator) {
                    const desValues = valuesData.map(this.toObject.bind(this));
                    return new ReadOnlyLazyList(desValues.sort(comparator), this.client.getSerializationService());
                }
                return new ReadOnlyLazyList(valuesData, this.client.getSerializationService());
            });
    }

    entrySet(): Promise<Array<[K, V]>> {
        return this.encodeInvoke(ReplicatedMapEntrySetCodec)
            .then((clientMessage) => {
                const response = ReplicatedMapEntrySetCodec.decodeResponse(clientMessage);
                return SerializationUtil.deserializeEntryList(this.toObject.bind(this), response.response);
            });
    }

    addEntryListenerToKeyWithPredicate(listener: EntryListener<K, V>, key: K, predicate: Predicate): Promise<string> {
        return this.addEntryListenerInternal(listener, predicate, key);
    }

    addEntryListenerWithPredicate(listener: EntryListener<K, V>, predicate: Predicate): Promise<string> {
        return this.addEntryListenerInternal(listener, predicate, undefined);
    }

    addEntryListenerToKey(listener: EntryListener<K, V>, key: K): Promise<string> {
        return this.addEntryListenerInternal(listener, undefined, key);
    }

    addEntryListener(listener: EntryListener<K, V>): Promise<string> {
        return this.addEntryListenerInternal(listener, undefined, undefined);
    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(listenerId);
    }

    private addEntryListenerInternal(listener: EntryListener<K, V>, predicate: Predicate,
                                     key: K): Promise<string> {
        const toObject = this.toObject.bind(this);
        const entryEventHandler = (key: K, value: V, oldValue: V, mergingValue: V,
                                   event: number, uuid: UUID, numberOfAffectedEntries: number): void => {
            const member = this.client.getClusterService().getMember(uuid);
            const name = this.name;

            key = toObject(key);
            value = toObject(value);
            oldValue = toObject(oldValue);
            mergingValue = toObject(mergingValue);

            const entryEvent = new EntryEvent(name, key, value, oldValue, mergingValue, member);

            const mapEvent = new MapEvent(name, numberOfAffectedEntries, member);

            const entryEventToListenerMap: { [key: number]: string } = {
                [EventType.ADDED]: 'added',
                [EventType.REMOVED]: 'removed',
                [EventType.UPDATED]: 'updated',
                [EventType.EVICTED]: 'evicted',
            };

            const mapEventToListenerMap: { [key: number]: string } = {
                [EventType.CLEAR_ALL]: 'mapCleared',
            };

            const entryEventMethod = entryEventToListenerMap[event];
            const mapEventMethod = mapEventToListenerMap[event];
            if (listener.hasOwnProperty(entryEventMethod)) {
                listener[entryEventMethod].apply(null, [entryEvent]);
            } else if (listener.hasOwnProperty(mapEventMethod)) {
                listener[mapEventMethod].apply(null, [mapEvent]);
            }
        };
        let listenerHandler: Function;
        let codec: ListenerMessageCodec;
        if (key && predicate) {
            const keyData = this.toData(key);
            const predicateData = this.toData(predicate);
            codec = this.createEntryListenerToKeyWithPredicate(this.name, keyData, predicateData);
            listenerHandler = ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.handle;
        } else if (key && !predicate) {
            const keyData = this.toData(key);
            codec = this.createEntryListenerToKey(this.name, keyData);
            listenerHandler = ReplicatedMapAddEntryListenerToKeyCodec.handle;
        } else if (!key && predicate) {
            const predicateData = this.toData(predicate);
            codec = this.createEntryListenerWithPredicate(this.name, predicateData);
            listenerHandler = ReplicatedMapAddEntryListenerWithPredicateCodec.handle;
        } else {
            codec = this.createEntryListener(this.name);
            listenerHandler = ReplicatedMapAddEntryListenerCodec.handle;
        }
        return this.client.getListenerService().registerListener(codec,
            (m: ClientMessage) => {
                listenerHandler(m, entryEventHandler, toObject);
            });
    }

    private createEntryListener(name: string): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ReplicatedMapAddEntryListenerCodec.encodeRequest(name, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ReplicatedMapAddEntryListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ReplicatedMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListenerToKey(name: string, keyData: Data): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ReplicatedMapAddEntryListenerToKeyCodec.encodeRequest(name, keyData, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ReplicatedMapAddEntryListenerToKeyCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ReplicatedMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListenerWithPredicate(name: string, predicateData: Data): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ReplicatedMapAddEntryListenerWithPredicateCodec.encodeRequest(name, predicateData, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ReplicatedMapAddEntryListenerWithPredicateCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ReplicatedMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListenerToKeyWithPredicate(name: string, keyData: Data, predicateData: Data): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.encodeRequest(name, keyData, predicateData,
                    localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ReplicatedMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
