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
exports.INT_OFFSET_READER = exports.SHORT_OFFSET_READER = exports.BYTE_OFFSET_READER = exports.SHORT_OFFSET_READER_RANGE = exports.NULL_OFFSET = exports.BYTE_OFFSET_READER_RANGE = void 0;
const BitsUtil_1 = require("../../util/BitsUtil");
const BYTE_MAX_VALUE = 127;
const BYTE_MIN_VALUE = -128;
const SHORT_MAX_VALUE = 32767;
const SHORT_MIN_VALUE = -32768;
/**
 * Range of the offsets that can be represented by a single byte
 * and can be read with BYTE_OFFSET_READER.
 * @internal
 */
exports.BYTE_OFFSET_READER_RANGE = BYTE_MAX_VALUE - BYTE_MIN_VALUE;
/**
 * Offset of the null fields.
 * @internal
 */
exports.NULL_OFFSET = -1;
/**
 * Range of the offsets that can be represented by two bytes
 * and can be read with SHORT_OFFSET_READER.
 * @internal
 */
exports.SHORT_OFFSET_READER_RANGE = SHORT_MAX_VALUE - SHORT_MIN_VALUE;
/**
 * @internal
 */
const BYTE_OFFSET_READER = (input, variableOffsetsPos, index) => {
    const offset = input.readByte(variableOffsetsPos + index);
    // We need this bitwise and since "offset" is read as unsigned.
    if (offset === (exports.NULL_OFFSET & 0xFF)) {
        return exports.NULL_OFFSET;
    }
    return offset;
};
exports.BYTE_OFFSET_READER = BYTE_OFFSET_READER;
/**
 * @internal
 */
const SHORT_OFFSET_READER = (input, variableOffsetsPos, index) => {
    const offset = input.readShort(variableOffsetsPos + (index * BitsUtil_1.BitsUtil.SHORT_SIZE_IN_BYTES));
    if (offset === exports.NULL_OFFSET) {
        return exports.NULL_OFFSET;
    }
    return offset & 0xFFFF;
};
exports.SHORT_OFFSET_READER = SHORT_OFFSET_READER;
/**
 * @internal
 */
const INT_OFFSET_READER = (input, variableOffsetsPos, index) => input.readInt(variableOffsetsPos + (index * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES));
exports.INT_OFFSET_READER = INT_OFFSET_READER;
//# sourceMappingURL=OffsetConstants.js.map