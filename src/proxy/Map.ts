import {BaseProxy} from './BaseProxy';
import {MapInterface} from '../MapInterface';
import Q = require('q');
export class MapProxy<K, V> extends BaseProxy implements MapInterface<K, V> {
    containsKey(key: K) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    put(key: K, value: V) : Q.Promise<V> {
        //TODO
        return Q.defer<V>().promise;
    }

    get(key: K) : Q.Promise<V> {
        //TODO
        return Q.defer<V>().promise;
    }

    remove(key: K) : Q.Promise<V> {
        //TODO
        return Q.defer<V>().promise;
    }

    size() : Q.Promise<number> {
        //TODO
        return Q.defer<number>().promise;
    }

    clear() : Q.Promise<void> {
        //TODO
        return Q.defer<void>().promise;
    }
}
