import {IList} from './IList';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {ListAddCodec} from '../codec/ListAddCodec';
import {ListSizeCodec} from '../codec/ListSizeCodec';
import {ListAddAllCodec} from '../codec/ListAddAllCodec';
import {ListGetAllCodec} from '../codec/ListGetAllCodec';
import {ListClearCodec} from '../codec/ListClearCodec';
import {Data} from '../serialization/Data';
import {ListContainsAllCodec} from '../codec/ListContainsAllCodec';
import {ListContainsCodec} from '../codec/ListContainsCodec';
import {ListIsEmptyCodec} from '../codec/ListIsEmptyCodec';
import {ListRemoveCodec} from '../codec/ListRemoveCodec';
import {ListCompareAndRemoveAllCodec} from '../codec/ListCompareAndRemoveAllCodec';
import {ListCompareAndRetainAllCodec} from '../codec/ListCompareAndRetainAllCodec';
import {ListAddListenerCodec} from '../codec/ListAddListenerCodec';
import {ListAddWithIndexCodec} from '../codec/ListAddWithIndexCodec';
import {ListRemoveListenerCodec} from '../codec/ListRemoveListenerCodec';
import {ItemListener} from '../core/ItemListener';
import {ListRemoveWithIndexCodec} from '../codec/ListRemoveWithIndexCodec';
import {ListGetCodec} from '../codec/ListGetCodec';
import {ListIndexOfCodec} from '../codec/ListIndexOfCodec';
import {ListSubCodec} from '../codec/ListSubCodec';
import {ListAddAllWithIndexCodec} from '../codec/ListAddAllWithIndexCodec';
import {ListSetCodec} from '../codec/ListSetCodec';
import {ListLastIndexOfCodec} from '../codec/ListLastIndexOfCodec';
import ClientMessage = require('../ClientMessage');
import * as Promise from 'bluebird';

export class ListProxy<E> extends PartitionSpecificProxy implements IList<E> {

    add(element: E): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListAddCodec, this.toData(element));
    }

    addAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListAddAllCodec, this.serializeList(elements));
    }

    addAllAt(index: number, elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListAddAllWithIndexCodec, index, this.serializeList(elements));
    }

    addAt(index: number, element: E): Promise<void> {
        return this.encodeInvoke<void>(ListAddWithIndexCodec, index, this.toData(element));
    }

    clear(): Promise<void> {
        return this.encodeInvoke<void>(ListClearCodec);
    }

    contains(entry: E): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListContainsCodec, this.toData(entry));
    }

    containsAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListContainsAllCodec, this.serializeList(elements));
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListIsEmptyCodec);
    }

    remove(entry: E): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListRemoveCodec, this.toData(entry));
    }

    removeAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListCompareAndRemoveAllCodec, this.serializeList(elements));
    }

    retainAll(elements: E[]): Promise<boolean> {
        return this.encodeInvoke<boolean>(ListCompareAndRetainAllCodec, this.serializeList(elements));
    }

    removeAt(index: number): Promise<E> {
        return this.encodeInvoke<E>(ListRemoveWithIndexCodec, index);
    }

    get(index: number): Promise<E> {
        return this.encodeInvoke<E>(ListGetCodec, index);
    }

    set(index: number, element: E): Promise<E> {
        return this.encodeInvoke<E>(ListSetCodec, index, this.toData(element));
    }

    indexOf(element: E): Promise<number> {
        return this.encodeInvoke<number>(ListIndexOfCodec, this.toData(element));
    }

    lastIndexOf(element: E): Promise<number> {
        return this.encodeInvoke<number>(ListLastIndexOfCodec, this.toData(element));
    }

    size(): Promise<number> {
        return this.encodeInvoke<number>(ListSizeCodec);
    }

    subList(start: number, end: number): Promise<E[]> {
        return this.encodeInvoke(ListSubCodec, start, end).then((encoded: Data[]) => {
            return encoded.map((item: Data) => {
                return this.toObject(item);
            });
        });
    }

    toArray(): Promise<E[]> {
        return this.encodeInvoke(ListGetAllCodec)
            .then((elements: Array<Data>) => {
                return elements.map((element) => {
                    return this.toObject(element);
                });
            });
    }

    addItemListener(listener: ItemListener<E>, includeValue: boolean): Promise<string> {
        var request = ListAddListenerCodec.encodeRequest(this.name, includeValue, false);
        var handler = (message: ClientMessage) => {
            ListAddListenerCodec.handle(message, (element: Data, uuid: string, eventType: number) => {
                var responseObject = element ? this.toObject(element) : null;
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
            ListAddListenerCodec.decodeResponse, this.name);
    }

    removeItemListener(registrationId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(
            ListRemoveListenerCodec.encodeRequest(this.name, registrationId),
            ListRemoveListenerCodec.decodeResponse
        );
    }

    private serializeList(input: Array<E>): Array<Data> {
        return input.map((each) => {
            return this.toData(each);
        });
    }
}
