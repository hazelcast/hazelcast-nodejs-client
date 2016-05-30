import {IQueue} from '../IQueue';
import {ItemListener} from '../core/ItemListener';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {QueueSizeCodec} from '../codec/QueueSizeCodec';
import {QueueOfferCodec} from '../codec/QueueOfferCodec';
import {QueuePeekCodec} from '../codec/QueuePeekCodec';
import * as Q from 'q';
import {QueuePollCodec} from '../codec/QueuePollCodec';
import {QueueRemainingCapacityCodec} from '../codec/QueueRemainingCapacityCodec';
import {QueueRemoveCodec} from '../codec/QueueRemoveCodec';
import {QueueContainsCodec} from '../codec/QueueContainsCodec';
import {QueueIteratorCodec} from '../codec/QueueIteratorCodec';
import {Data} from '../serialization/Data';
import {QueueClearCodec} from '../codec/QueueClearCodec';
import {QueueDrainToCodec} from '../codec/QueueDrainToCodec';
import {QueueDrainToMaxSizeCodec} from '../codec/QueueDrainToMaxSizeCodec';
import {QueueIsEmptyCodec} from '../codec/QueueIsEmptyCodec';
import {QueueTakeCodec} from '../codec/QueueTakeCodec';
export class Queue<E> extends PartitionSpecificProxy implements IQueue<E> {

    add(item: E): Q.Promise<boolean> {
        var deferred = Q.defer<boolean>();
        return this.offer(item).then(function(ret) {
            if (ret) {
                return true;
            } else {
                throw new Error('Queue is full.');
            }
        });
    }

    addAll(items: E[]): Q.Promise<boolean> {
        return null;
    }

    addItemListener(listener: ItemListener<E>, includeValue: boolean): Q.Promise<string> {
        return null;
    }

    clear(): Q.Promise<void> {
        return this.encodeInvoke<void>(QueueClearCodec);
    }

    contains(item: E): Q.Promise<boolean> {
        var itemData = this.toData(item);
        return this.encodeInvoke<boolean>(QueueContainsCodec, itemData);
    }

    containsAll(items: E): Q.Promise<boolean> {
        return null;
    }

    drainTo(arr: E[], maxElements: number = null): Q.Promise<number> {
        var toObject = this.toObject.bind(this);
        var promise: Q.Promise<any>;
        if (maxElements === null) {
            promise = this.encodeInvoke<any>(QueueDrainToCodec);
        } else {
            promise = this.encodeInvoke<any>(QueueDrainToMaxSizeCodec, maxElements);
        }
        return promise.then(function(rawArr: Data[]) {
            rawArr.forEach(function (rawItem) {
                arr.push(toObject(rawItem));
            });
            return rawArr.length;
        });
    }

    isEmpty(): Q.Promise<boolean> {
        return this.encodeInvoke<boolean>(QueueIsEmptyCodec);
    }

    offer(item: E, time: number = 0): Q.Promise<boolean> {
        var itemData = this.toData(item);
        return this.encodeInvoke<boolean>(QueueOfferCodec, itemData, time);
    }

    peek(): Q.Promise<E> {
        return this.encodeInvoke<E>(QueuePeekCodec);
    }

    poll(time: number = 0): Q.Promise<E> {
        return this.encodeInvoke<E>(QueuePollCodec, time);
    }

    put(item: E): Q.Promise<void> {
        return null;
    }

    remainingCapacity(): Q.Promise<number> {
        return this.encodeInvoke<number>(QueueRemainingCapacityCodec);
    }

    remove(item: E): Q.Promise<boolean> {
        var itemData = this.toData(item);
        return this.encodeInvoke<boolean>(QueueRemoveCodec, itemData);
    }

    removeAll(items: E[]): Q.Promise<boolean> {
        return null;
    }

    removeItemListener(registrationId: string): Q.Promise<boolean> {
        return null;
    }

    retainAll(items: E[]): Q.Promise<boolean> {
        return null;
    }

    size(): Q.Promise<number> {
        return this.encodeInvoke<number>(QueueSizeCodec);
    }

    take(): Q.Promise<E> {
        return this.encodeInvoke<E>(QueueTakeCodec);
    }

    toArray(): Q.Promise<E[]> {
        var arr: E[] = [];
        var toObject = this.toObject.bind(this);
        return this.encodeInvoke<Data[]>(QueueIteratorCodec).then(function(dataArray) {
            dataArray.forEach(function(data) {
                arr.push(toObject(data));
            });
            return arr;
        });
    }
}
