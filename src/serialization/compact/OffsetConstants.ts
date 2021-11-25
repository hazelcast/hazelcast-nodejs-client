import {OffsetReader} from './OffsetRead';
import {ObjectDataInput} from '../ObjectData';
import {BitsUtil} from '../../util/BitsUtil';

export const BYTE_MAX_VALUE = 127;
export const BYTE_MIN_VALUE = -128;

export const SHORT_MAX_VALUE = 32767;
export const SHORT_MIN_VALUE = -32768;

/**
 * Range of the offsets that can be represented by a single byte
 * and can be read with BYTE_OFFSET_READER.
 */
export const BYTE_OFFSET_READER_RANGE = BYTE_MAX_VALUE - BYTE_MIN_VALUE;

/**
 * Offset of the null fields.
 */
export const NULL_OFFSET = -1;

/**
 * Range of the offsets that can be represented by two bytes
 * and can be read with SHORT_OFFSET_READER.
 */
export const SHORT_OFFSET_READER_RANGE = SHORT_MAX_VALUE - SHORT_MIN_VALUE


export const BYTE_OFFSET_READER: OffsetReader = (input: ObjectDataInput, variableOffsetsPos: number, index: number) : number => {
    const offset = input.readByte(variableOffsetsPos + index);
    // We need this bitwise and since "offset" is read as unsigned.
    if (offset === (NULL_OFFSET & 0xFF)) {
        return NULL_OFFSET;
    }
    return offset;
}

export const SHORT_OFFSET_READER: OffsetReader = (input: ObjectDataInput, variableOffsetsPos: number, index: number): number => {
    const offset = input.readShort(variableOffsetsPos + (index * BitsUtil.SHORT_SIZE_IN_BYTES));
    if (offset === NULL_OFFSET) {
        return NULL_OFFSET;
    }
    return offset & 0xFFFF;
}

export const INT_OFFSET_READER: OffsetReader = (input: ObjectDataInput, variableOffsetsPos: number, index: number): number =>
    input.readInt(variableOffsetsPos + (index * BitsUtil.INT_SIZE_IN_BYTES));
