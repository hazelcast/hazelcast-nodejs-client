import * as Promise from 'bluebird';
import {PartitionSpecificProxy} from './PartitionSpecificProxy';
import {IRingbuffer} from './IRingbuffer';
import {OverflowPolicy} from '../core/OverflowPolicy';
import {RingbufferAddCodec} from '../codec/RingbufferAddCodec';
import {RingbufferReadOneCodec} from '../codec/RingbufferReadOneCodec';
import {RingbufferAddAllCodec} from '../codec/RingbufferAddAllCodec';
import {RingbufferTailSequenceCodec} from '../codec/RingbufferTailSequenceCodec';
import {RingbufferHeadSequenceCodec} from '../codec/RingbufferHeadSequenceCodec';
import {RingbufferRemainingCapacityCodec} from '../codec/RingbufferRemainingCapacityCodec';
import {RingbufferSizeCodec} from '../codec/RingbufferSizeCodec';
import {RingbufferCapacityCodec} from '../codec/RingbufferCapacityCodec';
import {RingbufferReadManyCodec} from '../codec/RingbufferReadManyCodec';
import {Data} from '../serialization/Data';
import Long = require('long');

export class RingbufferProxy<E> extends PartitionSpecificProxy implements IRingbuffer<E> {

    capacity(): Promise<Long> {
        return this.encodeInvoke<Long>(RingbufferCapacityCodec);
    }

    size(): Promise<Long> {
        return this.encodeInvoke<Long>(RingbufferSizeCodec);
    }

    tailSequence(): Promise<Long> {
        return this.encodeInvoke<Long>(RingbufferTailSequenceCodec);
    }

    headSequence(): Promise<Long> {
        return this.encodeInvoke<Long>(RingbufferHeadSequenceCodec);
    }

    remainingCapacity(): Promise<Long> {
        return this.encodeInvoke<Long>(RingbufferRemainingCapacityCodec);
    }

    add(item: E, overflowPolicy: OverflowPolicy = OverflowPolicy.OVERWRITE): Promise<Long> {
        return this.encodeInvoke<Long>(RingbufferAddCodec, overflowPolicy, this.toData(item));
    }

    addAll(items: Array<E>, overflowPolicy: OverflowPolicy = OverflowPolicy.OVERWRITE): Promise<Long> {
        var dataList = items.map((item) => {
            return this.toData(item);
        });

        return this.encodeInvoke<Long>(RingbufferAddAllCodec, dataList, overflowPolicy);
    }

    readOne(sequence: number|Long): Promise<E> {
        if (Long.fromValue(sequence).lessThan(0)) {
            throw new Error('Sequence number should not be less than zero, was: ' + sequence);
        }

        return this.encodeInvoke<E>(RingbufferReadOneCodec, sequence);
    }

    readMany(sequence: number|Long, minCount: number, maxCount: number): Promise<Array<E>> {

        if (Long.fromValue(sequence).lessThan(0)) {
            throw new Error('Sequence number should not be less than zero, was: ' + sequence);
        }

        if (minCount < 0) {
            throw new Error('Min count should not be less than zero, was: ' + sequence);
        }

        if (minCount > maxCount) {
            throw new Error('Min count ' + minCount + 'was larger than max count ' + maxCount);
        }

        return this
            .encodeInvoke<any>(RingbufferReadManyCodec, sequence, minCount, maxCount, null)
            .then<Array<E>>((raw: any) => {
                return raw['items'].map((r: Data) => {
                    return this.toObject(r);
                });
            });
    }
}
