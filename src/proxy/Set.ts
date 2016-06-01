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
import {PartitionSpecificProxy} from './PartitionSpecificProxy';

export class Set<E> extends PartitionSpecificProxy implements ISet<E> {

    add(entry: E): Q.Promise<boolean> {
        return this.encodeInvoke<boolean>(SetAddCodec, this.toData(entry));
    }

    addAll(items: E[]): Q.Promise<boolean> {
        return this.encodeInvoke<boolean>(SetAddAllCodec, this.serializeList(items));
    }

    getAll(): Q.Promise<E[]> {
        return this.encodeInvoke(SetGetAllCodec)
            .then((items: Array<Data>) => {
                return items.map((item) => {
                    return this.toObject(item);
                });
            });
    }

    clear(): Q.Promise<void> {
        return this.encodeInvoke<void>(SetClearCodec);
    }

    contains(entry: E): Q.Promise<boolean> {
        return this.encodeInvoke<boolean>(SetContainsCodec, this.toData(entry));
    }

    containsAll(items: E[]): Q.Promise<boolean> {
        return this.encodeInvoke<boolean>(SetContainsAllCodec, this.serializeList(items));
    }

    isEmpty(): Q.Promise<boolean> {
        return this.encodeInvoke<boolean>(SetIsEmptyCodec);
    }

    remove(entry: E): Q.Promise<boolean> {
        return this.encodeInvoke<boolean>(SetRemoveCodec, this.toData(entry));
    }

    removeAll(items: E[]): Q.Promise<boolean> {
        return this.encodeInvoke<boolean>(SetCompareAndRemoveAllCodec, this.serializeList(items));
    }

    retainAll(items: E[]): Q.Promise<boolean> {
        return this.encodeInvoke<boolean>(SetCompareAndRetainAllCodec, this.serializeList(items));
    }

    size(): Q.Promise<number> {
        return this.encodeInvoke<number>(SetSizeCodec);
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
