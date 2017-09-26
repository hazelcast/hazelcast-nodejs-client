import * as Promise from 'bluebird';

import {MultiMap} from './MultiMap';
import {BaseProxy} from './BaseProxy';
import {IMapListener} from '../core/MapListener';
import {MultiMapPutCodec} from './../codec/MultiMapPutCodec';
import {MultiMapGetCodec} from './../codec/MultiMapGetCodec';
import {Data} from '../serialization/Data';
import {MultiMapRemoveCodec} from './../codec/MultiMapRemoveCodec';
import {MultiMapRemoveEntryCodec} from './../codec/MultiMapRemoveEntryCodec';
import {MultiMapKeySetCodec} from './../codec/MultiMapKeySetCodec';
import {MultiMapValuesCodec} from './../codec/MultiMapValuesCodec';
import {MultiMapEntrySetCodec} from './../codec/MultiMapEntrySetCodec';
import {MultiMapContainsKeyCodec} from './../codec/MultiMapContainsKeyCodec';
import {MultiMapContainsValueCodec} from './../codec/MultiMapContainsValueCodec';
import {MultiMapContainsEntryCodec} from './../codec/MultiMapContainsEntryCodec';
import {MultiMapSizeCodec} from './../codec/MultiMapSizeCodec';
import {MultiMapClearCodec} from './../codec/MultiMapClearCodec';
import {MultiMapValueCountCodec} from './../codec/MultiMapValueCountCodec';
import {EntryEventType} from '../core/EntryEventType';
import ClientMessage = require('../ClientMessage');
import {MultiMapAddEntryListenerToKeyCodec} from './../codec/MultiMapAddEntryListenerToKeyCodec';
import {MultiMapAddEntryListenerCodec} from './../codec/MultiMapAddEntryListenerCodec';
import {MultiMapRemoveEntryListenerCodec} from './../codec/MultiMapRemoveEntryListenerCodec';
import {MultiMapLockCodec} from '../codec/MultiMapLockCodec';
import {MultiMapIsLockedCodec} from '../codec/MultiMapIsLockedCodec';
import {MultiMapTryLockCodec} from '../codec/MultiMapTryLockCodec';
import {MultiMapUnlockCodec} from '../codec/MultiMapUnlockCodec';
import {MultiMapForceUnlockCodec} from '../codec/MultiMapForceUnlockCodec';

export class MultiMapProxy<K, V> extends BaseProxy implements MultiMap<K, V> {


    private deserializeList = <X>(items: Array<Data>): Array<X> => {
        return items.map<X>(this.toObject.bind(this));
        // tslint:disable-next-line:semicolon
    };

    put(key: K, value: V): Promise<boolean> {
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<boolean>(MultiMapPutCodec, keyData, keyData, valueData, 1);
    }

    get(key: K): Promise<Array<V>> {
        var keyData = this.toData(key);

        return this.encodeInvokeOnKey<Array<Data>>(MultiMapGetCodec, keyData, keyData, 1)
            .then<Array<V>>(this.deserializeList);
    }

    remove(key: K, value: V): Promise<boolean> {
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<boolean>(MultiMapRemoveEntryCodec, keyData, keyData, valueData, 1);
    }

    removeAll(key: K): Promise<Array<V>> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<Array<Data>>(MultiMapRemoveCodec, keyData, keyData, 1)
            .then<Array<V>>(this.deserializeList);
    }

    keySet(): Promise<Array<K>> {
        return this.encodeInvokeOnRandomTarget<Array<Data>>(MultiMapKeySetCodec)
            .then<Array<K>>(this.deserializeList);
    }

    values(): Promise<Array<V>> {
        return this.encodeInvokeOnRandomTarget<Array<Data>>(MultiMapValuesCodec)
            .then<Array<V>>(this.deserializeList);
    }

    entrySet(): Promise<Array<[K, V]>> {
        return this.encodeInvokeOnRandomTarget<Array<[Data, Data]>>(MultiMapEntrySetCodec)
            .then<Array<[K, V]>>((entrySet: [Data, Data][]) => {
                return entrySet.map((entry: Array<any>) => {
                    return <[K, V]>[this.toObject(entry[0]), this.toObject(entry[1])];
                });
            });
    }

    containsKey(key: K): Promise<boolean> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MultiMapContainsKeyCodec, keyData, keyData, 1);
    }

    containsValue(value: V): Promise<boolean> {
        var valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget<boolean>(MultiMapContainsValueCodec, valueData);
    }

    containsEntry(key: K, value: V): Promise<boolean> {
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<boolean>(MultiMapContainsEntryCodec, keyData, keyData, valueData, 1);
    }

    size(): Promise<number> {
        return this.encodeInvokeOnRandomTarget<number>(MultiMapSizeCodec);
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MultiMapClearCodec);
    }

    valueCount(key: K): Promise<number> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<number>(MultiMapValueCountCodec, keyData, keyData, 1);
    }

    addEntryListener(listener: IMapListener<K, V>, key?: K, includeValue: boolean = true): Promise<string> {
        var toObject = this.toObject.bind(this);

        var entryEventHandler = function (key: K, value: V, oldValue: V, mergingValue: V, event: number) {
            var parameters: any[] = [key, oldValue, value];
            var name: string;

            // Multi map only supports these three event types
            switch (event) {
                case EntryEventType.ADDED:
                    name = 'added';
                    break;
                case EntryEventType.REMOVED:
                    name = 'removed';
                    break;
                case EntryEventType.CLEAR_ALL:
                    name = 'clearedAll';
                    break;
            }

            var handlerFunction = listener[name];
            if (handlerFunction) {
                handlerFunction.apply(undefined, parameters);
            }
        };

        var request: ClientMessage;

        if (key) {
            var keyData = this.toData(key);
            request = MultiMapAddEntryListenerToKeyCodec.encodeRequest(this.name, keyData, includeValue, false);

            var handler = (m: ClientMessage) => {
                MultiMapAddEntryListenerToKeyCodec.handle(m, entryEventHandler, toObject);
            };

            return this.client.getListenerService().registerListener(request, handler,
                MultiMapAddEntryListenerToKeyCodec.decodeResponse, keyData);
        } else {
            request = MultiMapAddEntryListenerCodec.encodeRequest(this.name, includeValue, false);

            var handler = (m: ClientMessage) => {
                MultiMapAddEntryListenerCodec.handle(m, entryEventHandler, toObject);
            };

            return this.client.getListenerService().registerListener(request, handler,
                MultiMapAddEntryListenerCodec.decodeResponse);
        }

    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(
            MultiMapRemoveEntryListenerCodec.encodeRequest(this.name, listenerId),
            MultiMapRemoveEntryListenerCodec.decodeResponse
        );
    }

    lock(key: K, leaseMillis: number = -1): Promise<void> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MultiMapLockCodec, keyData, keyData, 1, leaseMillis);
    }

    isLocked(key: K): Promise<boolean> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MultiMapIsLockedCodec, keyData, keyData);
    }

    tryLock(key: K, timeoutMillis: number = 0, leaseMillis: number = -1): Promise<boolean> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MultiMapTryLockCodec, keyData, keyData, 1, leaseMillis, timeoutMillis);
    }

    unlock(key: K): Promise<void> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MultiMapUnlockCodec, keyData, keyData, 1);
    }

    forceUnlock(key: K): Promise<void> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MultiMapForceUnlockCodec, keyData, keyData, 1);
    }
}
