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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixSizedTypesCodec = void 0;
const Long = require("long");
const BitsUtil_1 = require("../../util/BitsUtil");
const UUID_1 = require("../../core/UUID");
const core_1 = require("../../core");
// Taken from long.js, https://github.com/dcodeIO/long.js/blob/master/src/long.js
const TWO_PWR_16_DBL = 1 << 16;
const TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
const TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
const TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
/** @internal */
class FixSizedTypesCodec {
    static encodeInt(buffer, offset, value) {
        buffer.writeInt32LE(value, offset);
    }
    static decodeInt(buffer, offset) {
        return buffer.readInt32LE(offset);
    }
    static decodeLocalDate(buffer, offset) {
        const year = FixSizedTypesCodec.decodeInt(buffer, offset);
        const month = FixSizedTypesCodec.decodeByte(buffer, offset + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        const date = FixSizedTypesCodec.decodeByte(buffer, offset + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES);
        return new core_1.LocalDate(year, month, date);
    }
    static decodeLocalDateTime(buffer, offset) {
        const localDate = FixSizedTypesCodec.decodeLocalDate(buffer, offset);
        const localTime = FixSizedTypesCodec.decodeLocalTime(buffer, offset + BitsUtil_1.BitsUtil.LOCAL_DATE_SIZE_IN_BYTES);
        return new core_1.LocalDateTime(localDate, localTime);
    }
    static decodeOffsetDateTime(buffer, offset) {
        const localDateTime = FixSizedTypesCodec.decodeLocalDateTime(buffer, offset);
        const offsetSeconds = FixSizedTypesCodec.decodeInt(buffer, offset + BitsUtil_1.BitsUtil.LOCAL_DATETIME_SIZE_IN_BYTES);
        return new core_1.OffsetDateTime(localDateTime, offsetSeconds);
    }
    static decodeLocalTime(buffer, offset) {
        const hour = FixSizedTypesCodec.decodeByte(buffer, offset);
        const minute = FixSizedTypesCodec.decodeByte(buffer, offset + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES);
        const second = FixSizedTypesCodec.decodeByte(buffer, offset + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES * 2);
        const nano = FixSizedTypesCodec.decodeInt(buffer, offset + BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES * 3);
        return new core_1.LocalTime(hour, minute, second, nano);
    }
    static decodeShort(buffer, offset) {
        return buffer.readInt16LE(offset);
    }
    static decodeFloat(buffer, offset) {
        return buffer.readFloatLE(offset);
    }
    static decodeDouble(buffer, offset) {
        return buffer.readDoubleLE(offset);
    }
    static encodeLong(buffer, offset, value) {
        if (!Long.isLong(value)) {
            value = Long.fromValue(value);
        }
        buffer.writeInt32LE(value.low, offset);
        buffer.writeInt32LE(value.high, offset + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
    }
    static decodeLong(buffer, offset) {
        const low = buffer.readInt32LE(offset);
        const high = buffer.readInt32LE(offset + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        return new Long(low, high);
    }
    /**
     * Writes the given number as long (signed 64-bit integer) into the specified
     * position in buffer. Supports only non-negative numbers. On overflow, i.e.
     * for numbers larger than max possible value for signed 64-bit integer, writes
     * falls back to the max value.
     *
     * Use this method to avoid creating an intermediate Long object, but be aware
     * of possible precision loss for inputs larger than Number.MAX_SAFE_INTEGER.
     *
     * @param buffer output Buffer
     * @param offset offset to start writing from
     * @param value number to write
     */
    static encodeNonNegativeNumberAsLong(buffer, offset, value) {
        if (value < 0) {
            throw new Error('Only positive numbers are allowed in this method, received: ' + value);
        }
        if (value + 1 >= TWO_PWR_63_DBL) {
            // MAX_VALUE
            buffer.writeInt32LE(0xFFFFFFFF | 0, offset);
            buffer.writeInt32LE(0x7FFFFFFF | 0, offset + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
            return;
        }
        buffer.writeInt32LE((value % TWO_PWR_32_DBL) | 0, offset);
        buffer.writeInt32LE((value / TWO_PWR_32_DBL) | 0, offset + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
    }
    /**
     * Reads a long (signed 64-bit integer) from the specified position in buffer.
     *
     * Use this method to avoid creating a Long object, but be aware of possible
     * precision loss for inputs larger than Number.MAX_SAFE_INTEGER.
     *
     * @param buffer input Buffer
     * @param offset offset to start reading from
     */
    static decodeNumberFromLong(buffer, offset) {
        const low = buffer.readInt32LE(offset);
        const high = buffer.readInt32LE(offset + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        return high * TWO_PWR_32_DBL + (low >>> 0);
    }
    static encodeBoolean(buffer, offset, value) {
        buffer.writeUInt8(value ? 1 : 0, offset);
    }
    static decodeBoolean(buffer, offset) {
        return buffer.readUInt8(offset) === 1;
    }
    static encodeByte(buffer, offset, value) {
        buffer.writeUInt8(value, offset);
    }
    static decodeByte(buffer, offset) {
        return buffer.readUInt8(offset);
    }
    static encodeUUID(buffer, offset, value) {
        const isNull = value === null;
        this.encodeBoolean(buffer, offset, isNull);
        if (isNull) {
            return;
        }
        const mostSignificantBits = value.mostSignificant;
        const leastSignificantBits = value.leastSignificant;
        this.encodeLong(buffer, offset + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES, mostSignificantBits);
        this.encodeLong(buffer, offset + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES, leastSignificantBits);
    }
    static decodeUUID(buffer, offset) {
        const isNull = FixSizedTypesCodec.decodeBoolean(buffer, offset);
        if (isNull) {
            return null;
        }
        const mostSignificantBits = FixSizedTypesCodec.decodeLong(buffer, offset + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES);
        const leastSignificantBits = FixSizedTypesCodec.decodeLong(buffer, offset + BitsUtil_1.BitsUtil.BOOLEAN_SIZE_IN_BYTES + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES);
        return new UUID_1.UUID(mostSignificantBits, leastSignificantBits);
    }
}
exports.FixSizedTypesCodec = FixSizedTypesCodec;
//# sourceMappingURL=FixSizedTypesCodec.js.map