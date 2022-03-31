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
import {
    Predicate,
    ReadOnlyLazyList,
    ListComparator,
    UUID,
    SchemaNotReplicatedError
} from '../core';
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
import {EventType} from './EventType';
import {EntryEvent, EntryEventListener, EntryListener} from './EntryListener';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {assertNotNull} from '../util/Util';
import {ReplicatedMap} from './ReplicatedMap';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {MapEvent, MapEventListener} from './MapListener';
import {ClientMessage} from '../protocol/ClientMessage';

type EntryEventHandler = (key: Data, value: Data, oldValue: Data, mergingValue: Data,
                          eventType: number, uuid: UUID, numberOfAffectedEntries: number) => void

/** @internal */
export class ReplicatedMapProxy<K, V> extends PartitionSpecificProxy implements ReplicatedMap<K, V> {

    put(key: K, value: V, ttl: Long | number = 0): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);

        let valueData: Data, keyData: Data;
        try {
            valueData = this.toData(value);
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.put(key, value, ttl));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(ReplicatedMapPutCodec, keyData, (clientMessage) => {
            const response = ReplicatedMapPutCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData, valueData, ttl);
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget(ReplicatedMapClearCodec, () => {});
    }

    get(key: K): Promise<V> {
        assertNotNull(key);
        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.get(key));
            }
            throw e;
        }

        return this.encodeInvokeOnKey(ReplicatedMapGetCodec, keyData, (clientMessage) => {
            const response = ReplicatedMapGetCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData);
    }

    containsKey(key: K): Promise<boolean> {
        assertNotNull(key);

        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsKey(key));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(
            ReplicatedMapContainsKeyCodec, keyData, ReplicatedMapContainsKeyCodec.decodeResponse, keyData
        );
    }

    containsValue(value: V): Promise<boolean> {
        assertNotNull(value);

        let valueData: Data;
        try {
            valueData = this.toData(value);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.containsValue(value));
            }
            throw e;
        }
        return this.encodeInvoke(ReplicatedMapContainsValueCodec, ReplicatedMapContainsValueCodec.decodeResponse, valueData);
    }

    size(): Promise<number> {
        return this.encodeInvoke(ReplicatedMapSizeCodec, ReplicatedMapSizeCodec.decodeResponse);
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke(ReplicatedMapIsEmptyCodec, ReplicatedMapIsEmptyCodec.decodeResponse);
    }

    remove(key: K): Promise<V> {
        assertNotNull(key);

        let keyData: Data;
        try {
            keyData = this.toData(key);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.remove(key));
            }
            throw e;
        }
        return this.encodeInvokeOnKey(ReplicatedMapRemoveCodec, keyData, (clientMessage) => {
            const response = ReplicatedMapRemoveCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, keyData);
    }

    putAll(pairs: Array<[K, V]>): Promise<void> {
        let pair: [K, V];
        let pairId: string;
        const entries: Array<[Data, Data]> = [];
        for (pairId in pairs) {
            pair = pairs[pairId];
            let keyData: Data, valueData: Data;
            try {
                keyData = this.toData(pair[0]);
                valueData = this.toData(pair[1]);
            } catch (e) {
                if (e instanceof SchemaNotReplicatedError) {
                    return this.registerSchema(e.schema, e.clazz).then(() => this.putAll(pairs));
                }
                throw e;
            }
            entries.push([keyData, valueData]);
        }

        return this.encodeInvokeOnRandomTarget(ReplicatedMapPutAllCodec, () => {}, entries);
    }

    keySet(): Promise<K[]> {
        return this.encodeInvoke(ReplicatedMapKeySetCodec, (clientMessage) => {
            const response = ReplicatedMapKeySetCodec.decodeResponse(clientMessage);
            return this.deserializeList(response);
        });
    }

    values(comparator?: ListComparator<V>): Promise<ReadOnlyLazyList<V>> {
        return this.encodeInvoke(ReplicatedMapValuesCodec, (clientMessage) => {
            const valuesData = ReplicatedMapValuesCodec.decodeResponse(clientMessage);
            if (comparator) {
                const desValues = this.deserializeList(valuesData);
                return new ReadOnlyLazyList(desValues.sort(comparator), this.serializationService);
            }
            return new ReadOnlyLazyList(valuesData, this.serializationService);
        });
    }

    entrySet(): Promise<Array<[K, V]>> {
        return this.encodeInvoke(ReplicatedMapEntrySetCodec, (clientMessage) => {
            const response = ReplicatedMapEntrySetCodec.decodeResponse(clientMessage);
            return this.deserializeEntryList(response);
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
        return this.listenerService.deregisterListener(listenerId);
    }

    private addEntryListenerInternal(listener: EntryListener<K, V>, predicate?: Predicate, key?: K): Promise<string> {
        const entryEventHandler = (key: Data, value: Data, oldValue: Data, mergingValue: Data,
                                   event: number, uuid: UUID, numberOfAffectedEntries: number): void => {
            const member = this.clusterService.getMember(uuid.toString());
            const name = this.name;

            const entryEvent = new EntryEvent<K,V>(
                name,
                this.toObject(key),
                this.toObject(value),
                this.toObject(oldValue),
                this.toObject(mergingValue),
                member
            );

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
                (listener[entryEventMethod] as EntryEventListener<K, V>).apply(null, [entryEvent]);
            } else if (listener.hasOwnProperty(mapEventMethod)) {
                (listener[mapEventMethod] as MapEventListener<K, V>).apply(null, [mapEvent]);
            }
        };
        let listenerHandler: (message: ClientMessage, handler: EntryEventHandler) => void;
        let codec: ListenerMessageCodec;

        try {
            if (key !== undefined && predicate !== undefined) {
                const keyData = this.toData(key);
                const predicateData = this.toData(predicate);
                codec = this.createEntryListenerToKeyWithPredicate(this.name, keyData, predicateData);
                listenerHandler = ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.handle;
            } else if (key !== undefined && predicate === undefined) {
                const keyData = this.toData(key);
                codec = this.createEntryListenerToKey(this.name, keyData);
                listenerHandler = ReplicatedMapAddEntryListenerToKeyCodec.handle;
            } else if (key === undefined && predicate !== undefined) {
                const predicateData = this.toData(predicate);
                codec = this.createEntryListenerWithPredicate(this.name, predicateData);
                listenerHandler = ReplicatedMapAddEntryListenerWithPredicateCodec.handle;
            } else {
                codec = this.createEntryListener(this.name);
                listenerHandler = ReplicatedMapAddEntryListenerCodec.handle;
            }
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addEntryListenerInternal(listener, predicate, key));
            }
            throw e;
        }

        return this.listenerService.registerListener(codec,
            (m: ClientMessage) => {
                listenerHandler(m, entryEventHandler);
            });
    }

    private createEntryListener(name: string): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return ReplicatedMapAddEntryListenerCodec.encodeRequest(name, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): UUID {
                return ReplicatedMapAddEntryListenerCodec.decodeResponse(msg);
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
                return ReplicatedMapAddEntryListenerToKeyCodec.decodeResponse(msg);
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
                return ReplicatedMapAddEntryListenerWithPredicateCodec.decodeResponse(msg);
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
                return ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.decodeResponse(msg);
            },
            encodeRemoveRequest(listenerId: UUID): ClientMessage {
                return ReplicatedMapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }
}
