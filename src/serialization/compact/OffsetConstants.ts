/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

import {OffsetReader} from './OffsetReader';
import {ObjectDataInput} from '../ObjectData';
import {BitsUtil} from '../../util/BitsUtil';

const BYTE_MAX_VALUE = 127;
const BYTE_MIN_VALUE = -128;
const SHORT_MAX_VALUE = 32767;
const SHORT_MIN_VALUE = -32768;

/**
 * Range of the offsets that can be represented by a single byte
 * and can be read with BYTE_OFFSET_READER.
 * @internal
 */
export const BYTE_OFFSET_READER_RANGE = BYTE_MAX_VALUE - BYTE_MIN_VALUE;

/**
 * Offset of the null fields.
 * @internal
 */
export const NULL_OFFSET = -1;

/**
 * Range of the offsets that can be represented by two bytes
 * and can be read with SHORT_OFFSET_READER.
 * @internal
 */
export const SHORT_OFFSET_READER_RANGE = SHORT_MAX_VALUE - SHORT_MIN_VALUE

/**
 * @internal
 */
export const BYTE_OFFSET_READER: OffsetReader = (input: ObjectDataInput, variableOffsetsPos: number, index: number) : number => {
    const offset = input.readByte(variableOffsetsPos + index);
    // We need this bitwise and since "offset" is read as unsigned.
    if (offset === (NULL_OFFSET & 0xFF)) {
        return NULL_OFFSET;
    }
    return offset;
}

/**
 * @internal
 */
export const SHORT_OFFSET_READER: OffsetReader = (input: ObjectDataInput, variableOffsetsPos: number, index: number): number => {
    const offset = input.readShort(variableOffsetsPos + (index * BitsUtil.SHORT_SIZE_IN_BYTES));
    if (offset === NULL_OFFSET) {
        return NULL_OFFSET;
    }
    return offset & 0xFFFF;
}

/**
 * @internal
 */
export const INT_OFFSET_READER: OffsetReader = (input: ObjectDataInput, variableOffsetsPos: number, index: number): number =>
    input.readInt(variableOffsetsPos + (index * BitsUtil.INT_SIZE_IN_BYTES));
