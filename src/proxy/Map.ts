import {BaseProxy} from './BaseProxy';
import {IMap} from '../IMap';
import Q = require('q');
import {Data} from '../serialization/Data';
import {MapPutCodec} from '../codec/MapPutCodec';
import ClientMessage = require('../ClientMessage');
import murmur = require('../invocation/Murmur');
import {MapGetCodec} from '../codec/MapGetCodec';

export class Map<K, V> extends BaseProxy implements IMap<K, V> {

    containsKey(key: K): Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    containsValue(value: V): Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    put(key: K, value: V, ttl: number = -1): Q.Promise<V> {
        var keyData: Data = this.toData(key);
        var valueData: Data = this.toData(value);
        return this.encodeInvokeOnKey<V>(MapPutCodec, keyData, keyData, valueData, 0, ttl);
    }

    get(key: K): Q.Promise<V> {
        var keyData: Data = this.toData(key);
        return this.encodeInvokeOnKey<V>(MapGetCodec, keyData, keyData, 0, 0);
    }

    remove(key: K): Q.Promise<V> {
        //TODO
        return Q.defer<V>().promise;
    }

    size(): Q.Promise<number> {
        //TODO
        return Q.defer<number>().promise;
    }

    clear(): Q.Promise<void> {
        //TODO
        return Q.defer<void>().promise;
    }
}
