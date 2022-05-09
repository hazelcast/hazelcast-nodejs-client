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
import {SchemaNotReplicatedError} from './../../core/HazelcastError';
import {Data} from '../../serialization/Data';

/** @internal */
export class RingbufferProxy<E> extends PartitionSpecificProxy implements Ringbuffer<E> {

    private static readonly MAX_BATCH_SIZE = 1000;

    capacity(): Promise<Long> {
        return this.encodeInvoke(RingbufferCapacityCodec, RingbufferCapacityCodec.decodeResponse);
    }

    size(): Promise<Long> {
        return this.encodeInvoke(RingbufferSizeCodec, RingbufferSizeCodec.decodeResponse);
    }

    tailSequence(): Promise<Long> {
        return this.encodeInvoke(RingbufferTailSequenceCodec, RingbufferTailSequenceCodec.decodeResponse);
    }

    headSequence(): Promise<Long> {
        return this.encodeInvoke(RingbufferHeadSequenceCodec, RingbufferHeadSequenceCodec.decodeResponse);
    }

    remainingCapacity(): Promise<Long> {
        return this.encodeInvoke(RingbufferRemainingCapacityCodec, RingbufferRemainingCapacityCodec.decodeResponse);
    }

    add(item: E, overflowPolicy: OverflowPolicy = OverflowPolicy.OVERWRITE): Promise<Long> {
        let itemData: Data;
        try {
            itemData = this.toData(item);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.add(item, overflowPolicy));
            }
            throw e;
        }
        const policyId = overflowPolicyToId(overflowPolicy);
        return this.encodeInvoke(RingbufferAddCodec, RingbufferAddCodec.decodeResponse, policyId, itemData);
    }

    addAll(items: E[], overflowPolicy: OverflowPolicy = OverflowPolicy.OVERWRITE): Promise<Long> {
        const policyId = overflowPolicyToId(overflowPolicy);
        let dataList: Data[];
        try {
            dataList = this.serializeList(items);
        } catch (e) {
            if (e instanceof SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAll(items, overflowPolicy));
            }
            throw e;
        }

        return this.encodeInvoke(RingbufferAddAllCodec, RingbufferAddAllCodec.decodeResponse, dataList, policyId);
    }

    readOne(sequence: number | Long): Promise<E> {
        if (Long.fromValue(sequence).lessThan(0)) {
            throw new RangeError('Sequence number should not be less than zero, was: ' + sequence);
        }

        return this.encodeInvoke(RingbufferReadOneCodec, (clientMessage) => {
            const response = RingbufferReadOneCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, sequence);
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

        return this.encodeInvoke(RingbufferReadManyCodec, (clientMessage) => {
            const response = RingbufferReadManyCodec.decodeResponse(clientMessage);
            return new LazyReadResultSet(
                this.serializationService,
                response.readCount,
                response.items,
                response.itemSeqs,
                response.nextSeq
            );
        }, startSequence, minCount, maxCount, this.toData(filter));
    }
}
