import {BaseProxy} from './BaseProxy';
import {IMap} from '../IMap';
import Q = require('q');
import {Data} from '../serialization/Data';
import {MapPutCodec} from '../codec/MapPutCodec';
import ClientMessage = require('../ClientMessage');
import murmur = require('../invocation/Murmur');
import {MapGetCodec} from '../../lib/codec/MapGetCodec';
import {MapClearCodec} from '../codec/MapClearCodec';
import {MapSizeCodec} from '../codec/MapSizeCodec';
import {MapRemoveCodec} from '../codec/MapRemoveCodec';
import {MapRemoveIfSameCodec} from '../codec/MapRemoveIfSameCodec';
import {MapContainsKeyCodec} from '../codec/MapContainsKeyCodec';
import {MapContainsValueCodec} from '../codec/MapContainsValueCodec';
import {MapIsEmptyCodec} from '../codec/MapIsEmptyCodec';
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
}
