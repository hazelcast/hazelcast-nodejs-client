import * as Promise from 'bluebird';
import {IReplicatedMap} from './IReplicatedMap';
import {assertNotNull} from '../Util';
import {Data} from '../serialization/Data';
import {ReplicatedMapPutCodec} from '../codec/ReplicatedMapPutCodec';
import {ReplicatedMapClearCodec} from '../codec/ReplicatedMapClearCodec';
import {ReplicatedMapGetCodec} from '../codec/ReplicatedMapGetCodec';
import {ReplicatedMapContainsKeyCodec} from '../codec/ReplicatedMapContainsKeyCodec';
import {ReplicatedMapContainsValueCodec} from '../codec/ReplicatedMapContainsValueCodec';
import {ReplicatedMapSizeCodec} from '../codec/ReplicatedMapSizeCodec';
import {ReplicatedMapIsEmptyCodec} from '../codec/ReplicatedMapIsEmptyCodec';
import {ReplicatedMapRemoveCodec} from '../codec/ReplicatedMapRemoveCodec';
import {ReplicatedMapPutAllCodec} from '../codec/ReplicatedMapPutAllCodec';
import {ReplicatedMapKeySetCodec} from '../codec/ReplicatedMapKeySetCodec';
import {ReplicatedMapValuesCodec} from '../codec/ReplicatedMapValuesCodec';
import {ReplicatedMapEntrySetCodec} from '../codec/ReplicatedMapEntrySetCodec';
import {Predicate} from '../core/Predicate';
import {IMapListener} from '../core/MapListener';
import {ReplicatedMapRemoveEntryListenerCodec} from '../codec/ReplicatedMapRemoveEntryListenerCodec';
import {EntryEventType} from '../core/EntryEventType';
import ClientMessage = require('../ClientMessage');
/* tslint:disable:max-line-length */
import {ReplicatedMapAddEntryListenerToKeyWithPredicateCodec} from '../codec/ReplicatedMapAddEntryListenerToKeyWithPredicateCodec';
import {ReplicatedMapAddEntryListenerToKeyCodec} from '../codec/ReplicatedMapAddEntryListenerToKeyCodec';
import {ReplicatedMapAddEntryListenerWithPredicateCodec} from '../codec/ReplicatedMapAddEntryListenerWithPredicateCodec';
import {ReplicatedMapAddEntryListenerCodec} from '../codec/ReplicatedMapAddEntryListenerCodec';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
/* tslint:enable:max-line-length */
import Long = require('long');
import {ArrayComparator} from '../util/ArrayComparator';

export class ReplicatedMapProxy<K, V> extends PartitionSpecificProxy implements IReplicatedMap<K, V> {

    put(key: K, value: V, ttl: Long|number|string = 0): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);

        let valueData: Data = this.toData(value);
        let keyData: Data = this.toData(key);

        return this.encodeInvokeOnKey<V>(ReplicatedMapPutCodec, keyData, keyData, valueData, ttl);
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(ReplicatedMapClearCodec);
    }

    get(key: K): Promise<V> {
        assertNotNull(key);

        const keyData = this.toData(key);
        return this.encodeInvokeOnKey<V>(ReplicatedMapGetCodec, keyData, keyData);
    }

    containsKey(key: K): Promise<boolean> {
        assertNotNull(key);

        const keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(ReplicatedMapContainsKeyCodec, keyData, keyData);
    }

    containsValue(value: V): Promise<boolean> {
        assertNotNull(value);

        const valueData = this.toData(value);
        return this.encodeInvoke<boolean>(ReplicatedMapContainsValueCodec, valueData);
    }

    size(): Promise<number> {
        return this.encodeInvoke<number>(ReplicatedMapSizeCodec);
    }


    isEmpty(): Promise<boolean> {
        return this.encodeInvoke<boolean>(ReplicatedMapIsEmptyCodec);
    }

    remove(key: K): Promise<V> {
        assertNotNull(key);

        const keyData = this.toData(key);
        return this.encodeInvokeOnKey<V>(ReplicatedMapRemoveCodec, keyData, keyData);
    }

    putAll(pairs: [K, V][]): Promise<void> {
        let pair: [K, V];
        let pairId: string;
        const entries: [Data, Data][] = [];
        for (pairId in pairs) {
            pair = pairs[pairId];
            let keyData = this.toData(pair[0]);
            let valueData = this.toData(pair[1]);
            entries.push([keyData, valueData]);
        }

        return this.encodeInvokeOnRandomTarget<void>(ReplicatedMapPutAllCodec, entries);
    }

    keySet(): Promise<K[]> {
        const toObject = this.toObject.bind(this);
        return this.encodeInvoke<K[]>(ReplicatedMapKeySetCodec).then(function (keySet) {
            return keySet.map<K>(toObject);
        });
    }

    values(comparator?: ArrayComparator<V>): Promise<V[]> {
        const toObject = this.toObject.bind(this);
        return this.encodeInvoke<V[]>(ReplicatedMapValuesCodec).then(function (valuesData) {
            let results = valuesData.map<V>(toObject);
            if (comparator) {
                return results.sort(comparator);
            }
            return results;
        });
    }

    entrySet(): Promise<[K, V][]> {
        const toObject = this.toObject.bind(this);
        return this.encodeInvoke(ReplicatedMapEntrySetCodec).then(function (entrySet: [Data, Data][]) {
            return entrySet.map<[K, V]>(entry => [toObject(entry[0]), toObject(entry[1])]);
        });
    }

    addEntryListenerToKeyWithPredicate(listener: IMapListener<K, V>, key: K,
                                       predicate: Predicate, localOnly: boolean): Promise<string> {
        return this.addEntryListenerInternal(listener, predicate, key, localOnly);
    }

    addEntryListenerWithPredicate(listener: IMapListener<K, V>,
                                  predicate: Predicate, localOnly: boolean): Promise<string> {
        return this.addEntryListenerInternal(listener, predicate, undefined, localOnly);
    }

    addEntryListenerToKey(listener: IMapListener<K, V>, key: K, localOnly: boolean): Promise<string> {
        return this.addEntryListenerInternal(listener, undefined, key, localOnly);
    }

    addEntryListener(listener: IMapListener<K, V>, localOnly: boolean): Promise<string> {
        return this.addEntryListenerInternal(listener, undefined, undefined, localOnly);
    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(
            ReplicatedMapRemoveEntryListenerCodec.encodeRequest(this.name, listenerId),
            ReplicatedMapRemoveEntryListenerCodec.decodeResponse
        );
    }

    private addEntryListenerInternal(listener: IMapListener<K, V>, predicate: Predicate,
                                     key: K, localOnly: boolean = false): Promise<string> {
        const toObject = this.toObject.bind(this);
        const entryEventHandler = function (key: K, val: V, oldVal: V, mergingVal: V,
                                            event: number, uuid: string, numberOfAffectedEntries: number) {
            let eventParams: any[] = [key, oldVal, val, mergingVal, numberOfAffectedEntries, uuid];
            eventParams = eventParams.map(toObject);
            let eventToListenerMap: {[key: number]: string} = {
                [EntryEventType.ADDED]: 'added',
                [EntryEventType.REMOVED]: 'removed',
                [EntryEventType.UPDATED]: 'updated',
                [EntryEventType.EVICTED]: 'evicted',
                [EntryEventType.CLEAR_ALL]: 'clearedAll'
            };

            let eventMethod = eventToListenerMap[event];
            if (listener.hasOwnProperty(eventMethod)) {
                listener[eventMethod].apply(null, eventParams);
            }
        };
        let request: ClientMessage;
        let handler: Function;
        let responser: Function;
        if (key && predicate) {
            let keyData = this.toData(key);
            let predicateData = this.toData(predicate);
            request = ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.encodeRequest(this.name, keyData,
                predicateData, localOnly);
            handler = ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.handle;
            responser = ReplicatedMapAddEntryListenerToKeyWithPredicateCodec.decodeResponse;
        } else if (key && !predicate) {
            let keyData = this.toData(key);
            request = ReplicatedMapAddEntryListenerToKeyCodec.encodeRequest(this.name, keyData, localOnly);
            handler = ReplicatedMapAddEntryListenerToKeyCodec.handle;
            responser = ReplicatedMapAddEntryListenerToKeyCodec.decodeResponse;
        } else if (!key && predicate) {
            let predicateData = this.toData(predicate);
            request = ReplicatedMapAddEntryListenerWithPredicateCodec.encodeRequest(this.name, predicateData, localOnly);
            handler = ReplicatedMapAddEntryListenerWithPredicateCodec.handle;
            responser = ReplicatedMapAddEntryListenerWithPredicateCodec.decodeResponse;
        } else {
            request = ReplicatedMapAddEntryListenerCodec.encodeRequest(this.name, localOnly);
            handler = ReplicatedMapAddEntryListenerCodec.handle;
            responser = ReplicatedMapAddEntryListenerCodec.decodeResponse;
        }
        return this.client.getListenerService().registerListener(
            request,
            (m: ClientMessage) => {
                handler(m, entryEventHandler, toObject);
            },
            responser
        );
    }
}
