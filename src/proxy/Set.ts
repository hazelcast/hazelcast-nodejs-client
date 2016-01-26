import {BaseProxy} from '../../lib/proxy/BaseProxy';
import {SetInterface} from '../SetInterface';
import Q = require('q');
export class Set<E> extends BaseProxy implements SetInterface<E> {
    add(entry : E) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    addAll(collection : any) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    clear() : Q.Promise<void> {
        //TODO
        return Q.defer<void>().promise;
    }

    contains(entry : E) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    containsAll(collection : any) :  Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    isEmpty() : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    remove(entry : E) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    removeAll(collection : any) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    retainAll(collection : any) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    size() : Q.Promise<number> {
        //TODO
        return Q.defer<number>().promise;
    }
}
