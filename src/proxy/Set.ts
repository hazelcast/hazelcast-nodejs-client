import {BaseProxy} from '../proxy/BaseProxy';
import {ISet} from '../ISet';
import Q = require('q');
export class Set<E> extends BaseProxy implements ISet<E> {
    add(entry : E) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    addAll(items : E[]) : Q.Promise<boolean> {
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

    containsAll(items : E[]) :  Q.Promise<boolean> {
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

    removeAll(items : E[]) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    retainAll(items : E[]) : Q.Promise<boolean> {
        //TODO
        return Q.defer<boolean>().promise;
    }

    size() : Q.Promise<number> {
        //TODO
        return Q.defer<number>().promise;
    }
}
