import {BaseProxy} from '../proxy/BaseProxy';
import {ISet} from '../ISet';
import * as Q from 'q';
import {ItemListener} from '../core/ItemListener';
import {Data} from '../serialization/Data';

import {SetAddCodec} from '../codec/SetAddCodec';
import {SetAddAllCodec} from '../codec/SetAddAllCodec';
import {SetGetAllCodec} from '../codec/SetGetAllCodec';
import {SetClearCodec} from '../codec/SetClearCodec';
import {SetContainsCodec} from '../codec/SetContainsCodec';
import {SetContainsAllCodec} from '../codec/SetContainsAllCodec';
import {SetIsEmptyCodec} from '../codec/SetIsEmptyCodec';
import {SetRemoveCodec} from '../codec/SetRemoveCodec';
import {SetCompareAndRemoveAllCodec} from '../codec/SetCompareAndRemoveAllCodec';
import {SetCompareAndRetainAllCodec} from '../codec/SetCompareAndRetainAllCodec';
import {SetSizeCodec} from '../codec/SetSizeCodec';
import {SetAddListenerCodec} from '../codec/SetAddListenerCodec';
import {SetRemoveListenerCodec} from '../codec/SetRemoveListenerCodec';
import ClientMessage = require('../ClientMessage');

export class Set<E> extends BaseProxy implements ISet<E> {

    add(entry: E): Q.Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(SetAddCodec, this.name, this.toData(entry));
    }

    addAll(items: E[]): Q.Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(SetAddAllCodec, this.name, this.serializeList(items));
    }

    getAll(): Q.Promise<E[]> {
        return this.encodeInvokeOnKey(SetGetAllCodec, this.name)
            .then((items: Array<Data>) => {
                return items.map((item) => {
                    return this.toObject(item);
                });
            });
    }

    clear(): Q.Promise<void> {
        return this.encodeInvokeOnKey<void>(SetClearCodec, this.name);
    }

    contains(entry: E): Q.Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(SetContainsCodec, this.name, this.toData(entry));
    }

    containsAll(items: E[]): Q.Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(SetContainsAllCodec, this.name, this.serializeList(items));
    }

    isEmpty(): Q.Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(SetIsEmptyCodec, this.name);
    }

    remove(entry: E): Q.Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(SetRemoveCodec, this.name, this.toData(entry));
    }

    removeAll(items: E[]): Q.Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(SetCompareAndRemoveAllCodec, this.name, this.serializeList(items));
    }

    retainAll(items: E[]): Q.Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(SetCompareAndRetainAllCodec, this.name, this.serializeList(items));
    }

    size(): Q.Promise<number> {
        return this.encodeInvokeOnKey<number>(SetSizeCodec, this.name);
    }

    addItemListener(listener: ItemListener<E>, includeValue: boolean = true): Q.Promise<string> {
        var request = SetAddListenerCodec.encodeRequest(this.name, includeValue, false);
        var handler = (message: ClientMessage) => {
            SetAddListenerCodec.handle(message, (item: Data, uuid: string, eventType: number) => {
                var responseObject = this.toObject(item);
                var listenerFunction: Function;
                if (eventType === 1) {
                    listenerFunction = listener.itemAdded;
                } else if (eventType === 2) {
                    listenerFunction = listener.itemRemoved;
                }

                if (listenerFunction) {
                    listenerFunction.call(responseObject, responseObject);
                }
            });
        };
        return this.client.getListenerService().registerListener(request, handler,
            SetAddListenerCodec.decodeResponse, this.name);
    }

    removeItemListener(registrationId: string): Q.Promise<boolean> {
        return this.client.getListenerService().deregisterListener(
            SetRemoveListenerCodec.encodeRequest(this.name, registrationId),
            SetRemoveListenerCodec.decodeResponse
        );
    }

    private serializeList(input: Array<any>): Array<Data> {
        return input.map((each) => {
            return this.toData(each);
        });
    }
}
