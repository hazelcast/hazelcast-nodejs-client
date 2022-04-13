/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
/** @ignore *//** */

import * as Long from 'long';
import {RingbufferAddAllCodec} from '../../codec/RingbufferAddAllCodec';
import {RingbufferAddCodec} from '../../codec/RingbufferAddCodec';
import {RingbufferCapacityCodec} from '../../codec/RingbufferCapacityCodec';
import {RingbufferHeadSequenceCodec} from '../../codec/RingbufferHeadSequenceCodec';
import {RingbufferReadManyCodec} from '../../codec/RingbufferReadManyCodec';
import {RingbufferReadOneCodec} from '../../codec/RingbufferReadOneCodec';
import {RingbufferRemainingCapacityCodec} from '../../codec/RingbufferRemainingCapacityCodec';
import {RingbufferSizeCodec} from '../../codec/RingbufferSizeCodec';
import {RingbufferTailSequenceCodec} from '../../codec/RingbufferTailSequenceCodec';
import {OverflowPolicy, overflowPolicyToId} from '../OverflowPolicy';
import {Ringbuffer} from '../Ringbuffer';
import {PartitionSpecificProxy} from '../PartitionSpecificProxy';
import {LazyReadResultSet} from './LazyReadResultSet';
import {ReadResultSet} from '../../core';

/** @internal */
export class RingbufferProxy<E> extends PartitionSpecificProxy implements Ringbuffer<E> {

    private static readonly MAX_BATCH_SIZE = 1000;

    capacity(): Promise<Long> {
        return this.encodeInvoke(RingbufferCapacityCodec)
            .then(RingbufferCapacityCodec.decodeResponse);
    }

    size(): Promise<Long> {
        return this.encodeInvoke(RingbufferSizeCodec)
            .then(RingbufferSizeCodec.decodeResponse);
    }

    tailSequence(): Promise<Long> {
        return this.encodeInvoke(RingbufferTailSequenceCodec)
            .then(RingbufferTailSequenceCodec.decodeResponse);
    }

    headSequence(): Promise<Long> {
        return this.encodeInvoke(RingbufferHeadSequenceCodec)
            .then(RingbufferHeadSequenceCodec.decodeResponse);
    }

    remainingCapacity(): Promise<Long> {
        return this.encodeInvoke(RingbufferRemainingCapacityCodec)
            .then(RingbufferRemainingCapacityCodec.decodeResponse);
    }

    add(item: E, overflowPolicy: OverflowPolicy = OverflowPolicy.OVERWRITE): Promise<Long> {
        const policyId = overflowPolicyToId(overflowPolicy);
        return this.encodeInvoke(RingbufferAddCodec, policyId, this.toData(item))
            .then(RingbufferAddCodec.decodeResponse);
    }

    addAll(items: E[], overflowPolicy: OverflowPolicy = OverflowPolicy.OVERWRITE): Promise<Long> {
        const policyId = overflowPolicyToId(overflowPolicy);
        const dataList = items.map(this.toData.bind(this));

        return this.encodeInvoke(RingbufferAddAllCodec, dataList, policyId)
            .then(RingbufferAddAllCodec.decodeResponse);
    }

    readOne(sequence: number | Long): Promise<E> {
        if (Long.fromValue(sequence).lessThan(0)) {
            throw new RangeError('Sequence number should not be less than zero, was: ' + sequence);
        }

        return this.encodeInvoke(RingbufferReadOneCodec, sequence)
            .then((clientMessage) => {
                const response = RingbufferReadOneCodec.decodeResponse(clientMessage);
                return this.toObject(response);
            });
    }

    readMany(startSequence: number | Long,
             minCount: number,
             maxCount: number,
             filter: any = null): Promise<ReadResultSet<E>> {
        if (Long.fromValue(startSequence).lessThan(0)) {
            throw new RangeError('Sequence number should not be less than zero, was: ' + startSequence);
        }
        if (minCount < 0) {
            throw new RangeError('Min count should not be less than zero, was: ' + startSequence);
        }
        if (minCount > maxCount) {
            throw new RangeError('Min count ' + minCount + ' was larger than max count ' + maxCount);
        }
        if (maxCount > RingbufferProxy.MAX_BATCH_SIZE) {
            throw new RangeError('Max count can not be larger than ' + RingbufferProxy.MAX_BATCH_SIZE);
        }

        return this.encodeInvoke(RingbufferReadManyCodec, startSequence, minCount, maxCount, this.toData(filter))
            .then((clientMessage) => {
                const response = RingbufferReadManyCodec.decodeResponse(clientMessage);
                return new LazyReadResultSet(this.serializationService, response.readCount,
                    response.items, response.itemSeqs, response.nextSeq);
            });
    }
}
