"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RingbufferProxy = void 0;
const Long = require("long");
const RingbufferAddAllCodec_1 = require("../../codec/RingbufferAddAllCodec");
const RingbufferAddCodec_1 = require("../../codec/RingbufferAddCodec");
const RingbufferCapacityCodec_1 = require("../../codec/RingbufferCapacityCodec");
const RingbufferHeadSequenceCodec_1 = require("../../codec/RingbufferHeadSequenceCodec");
const RingbufferReadManyCodec_1 = require("../../codec/RingbufferReadManyCodec");
const RingbufferReadOneCodec_1 = require("../../codec/RingbufferReadOneCodec");
const RingbufferRemainingCapacityCodec_1 = require("../../codec/RingbufferRemainingCapacityCodec");
const RingbufferSizeCodec_1 = require("../../codec/RingbufferSizeCodec");
const RingbufferTailSequenceCodec_1 = require("../../codec/RingbufferTailSequenceCodec");
const OverflowPolicy_1 = require("../OverflowPolicy");
const PartitionSpecificProxy_1 = require("../PartitionSpecificProxy");
const LazyReadResultSet_1 = require("./LazyReadResultSet");
const HazelcastError_1 = require("./../../core/HazelcastError");
/** @internal */
class RingbufferProxy extends PartitionSpecificProxy_1.PartitionSpecificProxy {
    capacity() {
        return this.encodeInvoke(RingbufferCapacityCodec_1.RingbufferCapacityCodec, RingbufferCapacityCodec_1.RingbufferCapacityCodec.decodeResponse);
    }
    size() {
        return this.encodeInvoke(RingbufferSizeCodec_1.RingbufferSizeCodec, RingbufferSizeCodec_1.RingbufferSizeCodec.decodeResponse);
    }
    tailSequence() {
        return this.encodeInvoke(RingbufferTailSequenceCodec_1.RingbufferTailSequenceCodec, RingbufferTailSequenceCodec_1.RingbufferTailSequenceCodec.decodeResponse);
    }
    headSequence() {
        return this.encodeInvoke(RingbufferHeadSequenceCodec_1.RingbufferHeadSequenceCodec, RingbufferHeadSequenceCodec_1.RingbufferHeadSequenceCodec.decodeResponse);
    }
    remainingCapacity() {
        return this.encodeInvoke(RingbufferRemainingCapacityCodec_1.RingbufferRemainingCapacityCodec, RingbufferRemainingCapacityCodec_1.RingbufferRemainingCapacityCodec.decodeResponse);
    }
    add(item, overflowPolicy = OverflowPolicy_1.OverflowPolicy.OVERWRITE) {
        let itemData;
        try {
            itemData = this.toData(item);
        }
        catch (e) {
            if (e instanceof HazelcastError_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.add(item, overflowPolicy));
            }
            throw e;
        }
        const policyId = (0, OverflowPolicy_1.overflowPolicyToId)(overflowPolicy);
        return this.encodeInvoke(RingbufferAddCodec_1.RingbufferAddCodec, RingbufferAddCodec_1.RingbufferAddCodec.decodeResponse, policyId, itemData);
    }
    addAll(items, overflowPolicy = OverflowPolicy_1.OverflowPolicy.OVERWRITE) {
        const policyId = (0, OverflowPolicy_1.overflowPolicyToId)(overflowPolicy);
        let dataList;
        try {
            dataList = this.serializeList(items);
        }
        catch (e) {
            if (e instanceof HazelcastError_1.SchemaNotReplicatedError) {
                return this.registerSchema(e.schema, e.clazz).then(() => this.addAll(items, overflowPolicy));
            }
            throw e;
        }
        return this.encodeInvoke(RingbufferAddAllCodec_1.RingbufferAddAllCodec, RingbufferAddAllCodec_1.RingbufferAddAllCodec.decodeResponse, dataList, policyId);
    }
    readOne(sequence) {
        if (Long.fromValue(sequence).lessThan(0)) {
            throw new RangeError('Sequence number should not be less than zero, was: ' + sequence);
        }
        return this.encodeInvoke(RingbufferReadOneCodec_1.RingbufferReadOneCodec, (clientMessage) => {
            const response = RingbufferReadOneCodec_1.RingbufferReadOneCodec.decodeResponse(clientMessage);
            return this.toObject(response);
        }, sequence);
    }
    readMany(startSequence, minCount, maxCount, filter = null) {
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
        return this.encodeInvoke(RingbufferReadManyCodec_1.RingbufferReadManyCodec, (clientMessage) => {
            const response = RingbufferReadManyCodec_1.RingbufferReadManyCodec.decodeResponse(clientMessage);
            return new LazyReadResultSet_1.LazyReadResultSet(this.serializationService, response.readCount, response.items, response.itemSeqs, response.nextSeq);
        }, startSequence, minCount, maxCount, this.toData(filter));
    }
}
exports.RingbufferProxy = RingbufferProxy;
RingbufferProxy.MAX_BATCH_SIZE = 1000;
//# sourceMappingURL=RingbufferProxy.js.map