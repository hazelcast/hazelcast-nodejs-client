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
exports.HeapData = exports.HEAP_DATA_OVERHEAD = exports.DATA_OFFSET = exports.TYPE_OFFSET = exports.PARTITION_HASH_OFFSET = void 0;
const Murmur_1 = require("../invocation/Murmur");
const DefaultSerializers_1 = require("./DefaultSerializers");
/** @internal */
exports.PARTITION_HASH_OFFSET = 0;
/** @internal */
exports.TYPE_OFFSET = 4;
/** @internal */
exports.DATA_OFFSET = 8;
/** @internal */
exports.HEAP_DATA_OVERHEAD = exports.DATA_OFFSET;
/** @internal */
class HeapData {
    constructor(buffer) {
        if (buffer != null && buffer.length > 0 && buffer.length < exports.HEAP_DATA_OVERHEAD) {
            throw new RangeError('Data should be either empty or should contain more than '
                + exports.HEAP_DATA_OVERHEAD + ' bytes! -> ' + buffer);
        }
        this.payload = buffer;
    }
    /**
     * Returns serialized representation in a buffer
     */
    toBuffer() {
        return this.payload;
    }
    /**
     * Returns serialization type
     */
    getType() {
        if (this.totalSize() === 0) {
            return DefaultSerializers_1.NULL_TYPE_ID;
        }
        return this.payload.readIntBE(exports.TYPE_OFFSET, 4);
    }
    /**
     * Returns the total size of data in bytes
     */
    totalSize() {
        if (this.payload === null) {
            return 0;
        }
        else {
            return this.payload.length;
        }
    }
    /**
     * Returns size of internal binary data in bytes
     */
    dataSize() {
        return Math.max(this.totalSize() - exports.HEAP_DATA_OVERHEAD, 0);
    }
    /**
     * Returns approximate heap cost of this Data object in bytes
     */
    getHeapCost() {
        return 0;
    }
    /**
     * Returns partition hash of serialized object
     */
    getPartitionHash() {
        if (this.hasPartitionHash()) {
            return this.payload.readIntBE(exports.PARTITION_HASH_OFFSET, 4);
        }
        else {
            return this.hashCode();
        }
    }
    hashCode() {
        return (0, Murmur_1.murmur)(this.payload.slice(exports.DATA_OFFSET));
    }
    equals(other) {
        return this.payload.compare(other.toBuffer(), exports.DATA_OFFSET, other.toBuffer().length, exports.DATA_OFFSET) === 0;
    }
    /**
     * Returns true if data has partition hash
     */
    hasPartitionHash() {
        return this.payload !== null
            && this.payload.length >= exports.HEAP_DATA_OVERHEAD
            && this.payload.readIntBE(exports.PARTITION_HASH_OFFSET, 4) !== 0;
    }
    isCompact() {
        return this.getType() === HeapData.TYPE_COMPACT;
    }
}
exports.HeapData = HeapData;
HeapData.TYPE_COMPACT = -55;
HeapData.TYPE_PORTABLE = -1;
HeapData.TYPE_JSON = -130;
//# sourceMappingURL=HeapData.js.map