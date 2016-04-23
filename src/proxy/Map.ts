import {BaseProxy} from './BaseProxy';
import {IMap} from '../IMap';
import * as Q from 'q';
import {Data} from '../serialization/Data';
import {MapPutCodec} from '../codec/MapPutCodec';
import ClientMessage = require('../ClientMessage');
import murmur = require('../invocation/Murmur');
import {MapGetCodec} from '../codec/MapGetCodec';
import {MapClearCodec} from '../codec/MapClearCodec';
import {MapSizeCodec} from '../codec/MapSizeCodec';
import {MapRemoveCodec} from '../codec/MapRemoveCodec';
import {MapRemoveIfSameCodec} from '../codec/MapRemoveIfSameCodec';
import {MapContainsKeyCodec} from '../codec/MapContainsKeyCodec';
import {MapContainsValueCodec} from '../codec/MapContainsValueCodec';
import {MapIsEmptyCodec} from '../codec/MapIsEmptyCodec';
import {MapPutAllCodec} from '../codec/MapPutAllCodec';
import defer = Q.defer;
import {MapDeleteCodec} from '../codec/MapDeleteCodec';
import {MapEntrySetCodec} from '../codec/MapEntrySetCodec';
import {MapEvictCodec} from '../codec/MapEvictCodec';
export class Map<K, V> extends BaseProxy implements IMap<K, V> {
    containsKey(key: K): Q.Promise<boolean> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapContainsKeyCodec, keyData, keyData, 0);
    }

    containsValue(value: V): Q.Promise<boolean> {
        var valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget<boolean>(MapContainsValueCodec, valueData);
    }

    put(key: K, value: V, ttl: number = -1): Q.Promise<V> {
        var keyData: Data = this.toData(key);
        var valueData: Data = this.toData(value);
        return this.encodeInvokeOnKey<V>(MapPutCodec, keyData, keyData, valueData, 0, ttl);
    }

    putAll(pairs: [K, V][]): Q.Promise<void> {
        var partitionService = this.client.getPartitionService();
        var partitionsToKeys: {[id: string]: any} = {};
        var pair: [K, V];
        var pairId: string;
        for (pairId in pairs) {
            pair = pairs[pairId];
            var keyData = this.toData(pair[0]);
            var pId: number = partitionService.getPartitionId(keyData);
            if (partitionsToKeys.hasOwnProperty(pId) === false) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push({key: keyData, val: this.toData(pair[1])});
        }

        var partitionPromises: Q.Promise<void>[] = [];
        for (var partition in partitionsToKeys) {
            partitionPromises.push(
                this.encodeInvokeOnPartition<void>(MapPutAllCodec, Number(partition), partitionsToKeys[partition])
            );
        }
        var deferred = Q.defer<void>();
        Q.all(partitionPromises)
            .then(function() {
                deferred.resolve();
            });
        return deferred.promise;
    }

    get(key: K): Q.Promise<V> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<V>(MapGetCodec, keyData, keyData, 0);
    }

    remove(key: K, value: V = null): Q.Promise<V> {
        var keyData = this.toData(key);
        if (value == null) {
            return this.encodeInvokeOnKey<V>(MapRemoveCodec, keyData, keyData, 0);
        } else {
            var valueData = this.toData(value);
            return this.encodeInvokeOnKey<V>(MapRemoveIfSameCodec, keyData, keyData, valueData, 0);
        }
    }

    size(): Q.Promise<number> {
        return this.encodeInvokeOnRandomTarget<number>(MapSizeCodec);
    }

    clear(): Q.Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapClearCodec);
    }

    isEmpty(): Q.Promise<boolean> {
        return this.encodeInvokeOnRandomTarget<boolean>(MapIsEmptyCodec);
    }


    getAll(keys: K[]): Q.Promise<any[]> {
        return null;
    }

    delete(key: K): Q.Promise<void> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapDeleteCodec, keyData, keyData, 0);
    }

    entrySet(): Q.Promise<any[]> {
        var deserializedSet: [K, V][] = [];
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget(MapEntrySetCodec).then(function(entrySet: [Data, Data][]) {
            entrySet.forEach(function(entry) {
                deserializedSet.push([toObject(entry[0]), toObject(entry[1])]);
            });
            return deserializedSet;
        });
    }

    evict(key: K) : Q.Promise<boolean> {
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey(MapEvictCodec, keyData, keyData, 0);
    }

    evictAll(): Q.Promise<void> {
        return null;
    }

    flush(): Q.Promise<void> {
        return null;
    }

    forceUnlock(key: K): Q.Promise<void> {
        return null;
    }

    isLocked(key: K): Q.Promise<boolean> {
        return null;
    }

    lock(key: K, ttl?: number): Q.Promise<void> {
        return null;
    }

    keySet(): Q.Promise<K[]> {
        return null;
    }

    loadAll(keys?: K[], replaceExistingValues?: boolean): Q.Promise<void> {
        return null;
    }

    putIfAbsent(key: K, value: V, ttl?: number): Q.Promise<V> {
        return null;
    }

    putTransient(key: K, value: V, ttl?: number): Q.Promise<V> {
        return null;
    }

    replace(key: K, value: V, oldValue?: V): Q.Promise<V> {
        return null;
    }

    set(key: K, value: V, ttl?: number): Q.Promise<void> {
        return null;
    }

    unlock(key: K): Q.Promise<void> {
        return null;
    }

    values(): Q.Promise<V[]> {
        return null;
    }
}
