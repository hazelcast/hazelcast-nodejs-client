/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Promise from 'bluebird';
import {PartitionSpecificProxy} from '../PartitionSpecificProxy';
import {IRingbuffer} from '../IRingbuffer';
import {OverflowPolicy} from '../../core/OverflowPolicy';
import {RingbufferAddCodec} from '../../codec/RingbufferAddCodec';
import {RingbufferReadOneCodec} from '../../codec/RingbufferReadOneCodec';
import {RingbufferAddAllCodec} from '../../codec/RingbufferAddAllCodec';
import {RingbufferTailSequenceCodec} from '../../codec/RingbufferTailSequenceCodec';
import {RingbufferHeadSequenceCodec} from '../../codec/RingbufferHeadSequenceCodec';
import {RingbufferRemainingCapacityCodec} from '../../codec/RingbufferRemainingCapacityCodec';
import {RingbufferSizeCodec} from '../../codec/RingbufferSizeCodec';
import {RingbufferCapacityCodec} from '../../codec/RingbufferCapacityCodec';
import {RingbufferReadManyCodec} from '../../codec/RingbufferReadManyCodec';
import Long = require('long');
import {ReadResultSet} from './ReadResultSet';
import {LazyReadResultSet} from './LazyReadResultSet';

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
        let dataList = items.map((item) => {
            return this.toData(item);
        });

        return this.encodeInvoke<Long>(RingbufferAddAllCodec, dataList, overflowPolicy);
    }

    readOne(sequence: number|Long): Promise<E> {
        if (Long.fromValue(sequence).lessThan(0)) {
            throw new RangeError('Sequence number should not be less than zero, was: ' + sequence);
        }

        return this.encodeInvoke<E>(RingbufferReadOneCodec, sequence);
    }

    readMany(sequence: number|Long, minCount: number, maxCount: number, filter: any = null): Promise<ReadResultSet<E>> {

        if (Long.fromValue(sequence).lessThan(0)) {
            throw new RangeError('Sequence number should not be less than zero, was: ' + sequence);
        }

        if (minCount < 0) {
            throw new RangeError('Min count should not be less than zero, was: ' + sequence);
        }

        if (minCount > maxCount) {
            throw new RangeError('Min count ' + minCount + 'was larger than max count ' + maxCount);
        }

        return this.encodeInvoke<any>(RingbufferReadManyCodec, sequence, minCount, maxCount, this.toData(filter))
            .then<ReadResultSet<E>>((raw: any) => {
                return new LazyReadResultSet(this.client.getSerializationService(), raw.readCount, raw.items, raw.itemSeqs);
            });
    }
}
