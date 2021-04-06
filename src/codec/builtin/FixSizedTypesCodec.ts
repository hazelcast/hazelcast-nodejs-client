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

import * as Long from 'long';
import {BitsUtil} from '../../util/BitsUtil';
import {
    combineISOStringWithTimeString,
    getTimeOfIsoString,
    parseTimeString,
    getTimezoneOffsetFromSeconds
} from '../../util/DatetimeUtil';
import {UUID} from '../../core/UUID';

// Taken from long.js, https://github.com/dcodeIO/long.js/blob/master/src/long.js
const TWO_PWR_16_DBL = 1 << 16;
const TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
const TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
const TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

/** @internal */
export class FixSizedTypesCodec {
    static encodeInt(buffer: Buffer, offset: number, value: number): void {
        buffer.writeInt32LE(value, offset);
    }

    static decodeInt(buffer: Buffer, offset: number): number {
        return buffer.readInt32LE(offset);
    }

    /*
    Encodes a local date to buffer from iso string
    */
    static encodeLocalDate(buffer: Buffer, offset: number, value: string): void {
        const localDate = new Date(value);

        FixSizedTypesCodec.encodeShort(buffer, offset, localDate.getFullYear());
        FixSizedTypesCodec.encodeByte(buffer, offset + BitsUtil.SHORT_SIZE_IN_BYTES, localDate.getMonth());
        FixSizedTypesCodec.encodeByte(
            buffer,
            offset + BitsUtil.SHORT_SIZE_IN_BYTES + BitsUtil.BYTE_SIZE_IN_BYTES,
            localDate.getDate()
        );
    }

    static decodeLocalDate(buffer: Buffer, offset: number): string {
        const year = FixSizedTypesCodec.decodeShort(buffer, offset);
        const month = FixSizedTypesCodec.decodeByte(buffer, offset + BitsUtil.SHORT_SIZE_IN_BYTES);
        const dayOfMonth = FixSizedTypesCodec.decodeByte(
            buffer, offset + BitsUtil.SHORT_SIZE_IN_BYTES + BitsUtil.BYTE_SIZE_IN_BYTES
        );
        return `${year}-${month}-${dayOfMonth}T00:00:00`;
    }

    /*
    Encodes a local datetime to buffer from iso string
    */
    static encodeLocalDatetime(buffer: Buffer, offset: number, value: string): void {
        const localTimeString = getTimeOfIsoString(value);
        FixSizedTypesCodec.encodeLocalDate(buffer, offset, value);
        FixSizedTypesCodec.encodeLocalTime(buffer, offset + BitsUtil.LOCAL_DATE_SIZE_IN_BYTES, localTimeString);
    }

    static decodeLocalDatetime(buffer: Buffer, offset: number): string {
        const localDateString = FixSizedTypesCodec.decodeLocalDate(buffer, offset);
        const localTimeString = FixSizedTypesCodec.decodeLocalTime(buffer, offset + BitsUtil.LOCAL_DATE_SIZE_IN_BYTES);
        return combineISOStringWithTimeString(localDateString, localTimeString);
    }

    static decodeOffsetDateTime(buffer: Buffer, offset: number): string {
        const localDateTimeString = FixSizedTypesCodec.decodeLocalDatetime(buffer, offset);
        const offsetSeconds = FixSizedTypesCodec.decodeInt(buffer, offset + BitsUtil.LOCAL_DATETIME_SIZE_IN_BYTES);
        const timezoneString = getTimezoneOffsetFromSeconds(offsetSeconds);

        return localDateTimeString + timezoneString;
    }

    /*
    Encodes a local time to buffer from iso string
    */
    static encodeLocalTime(buffer: Buffer, offset: number, value: string): void {
        const localTime = parseTimeString(value);

        FixSizedTypesCodec.encodeByte(buffer, offset, localTime.hours);
        FixSizedTypesCodec.encodeByte(buffer, offset + BitsUtil.BYTE_SIZE_IN_BYTES, localTime.minutes);
        FixSizedTypesCodec.encodeByte(buffer, offset + BitsUtil.BYTE_SIZE_IN_BYTES * 2, localTime.seconds);
        FixSizedTypesCodec.encodeInt(
            buffer,
            offset + BitsUtil.BYTE_SIZE_IN_BYTES * 3,
            localTime.nano
        );
    }

    /*
    Decodes local time from buffer
    */
    static decodeLocalTime(buffer: Buffer, offset: number): string {
        const hour = FixSizedTypesCodec.decodeByte(buffer, offset);
        const minute = FixSizedTypesCodec.decodeByte(buffer, offset + BitsUtil.BYTE_SIZE_IN_BYTES);
        const second = FixSizedTypesCodec.decodeByte(buffer, offset + BitsUtil.BYTE_SIZE_IN_BYTES * 2);
        const nano = FixSizedTypesCodec.decodeInt(buffer, offset + BitsUtil.BYTE_SIZE_IN_BYTES * 3);

        return `${hour}:${minute}:${second}.${nano}`;
    }

    static encodeShort(buffer: Buffer, offset: number, value: number): void {
        buffer.writeInt16LE(value, offset);
    }

    static decodeShort(buffer: Buffer, offset: number): number {
        return buffer.readInt16LE(offset);
    }

    static encodeFloat(buffer: Buffer, offset: number, value: number): void {
        buffer.writeFloatLE(value, offset);
    }

    static decodeFloat(buffer: Buffer, offset: number): number {
        return buffer.readFloatLE(offset);
    }

    static encodeDouble(buffer: Buffer, offset: number, value: number): void {
        buffer.writeDoubleLE(value, offset);
    }

    static decodeDouble(buffer: Buffer, offset: number): number {
        return buffer.readDoubleLE(offset);
    }

    static encodeLong(buffer: Buffer, offset: number, value: any): void {
        if (!Long.isLong(value)) {
            value = Long.fromValue(value);
        }

        buffer.writeInt32LE(value.low, offset);
        buffer.writeInt32LE(value.high, offset + BitsUtil.INT_SIZE_IN_BYTES);
    }

    static decodeLong(buffer: Buffer, offset: number): Long {
        const low = buffer.readInt32LE(offset);
        const high = buffer.readInt32LE(offset + BitsUtil.INT_SIZE_IN_BYTES);
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
    static encodeNonNegativeNumberAsLong(buffer: Buffer, offset: number, value: number): void {
        if (value < 0) {
            throw new Error('Only positive numbers are allowed in this method, received: ' + value);
        }

        if (value + 1 >= TWO_PWR_63_DBL) {
            // MAX_VALUE
            buffer.writeInt32LE(0xFFFFFFFF | 0, offset);
            buffer.writeInt32LE(0x7FFFFFFF | 0, offset + BitsUtil.INT_SIZE_IN_BYTES);
            return;
        }

        buffer.writeInt32LE((value % TWO_PWR_32_DBL) | 0, offset);
        buffer.writeInt32LE((value / TWO_PWR_32_DBL) | 0, offset + BitsUtil.INT_SIZE_IN_BYTES);
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
    static decodeNumberFromLong(buffer: Buffer, offset: number): number {
        const low = buffer.readInt32LE(offset);
        const high = buffer.readInt32LE(offset + BitsUtil.INT_SIZE_IN_BYTES);
        return high * TWO_PWR_32_DBL + (low >>> 0);
    }

    static encodeBoolean(buffer: Buffer, offset: number, value: boolean): void {
        buffer.writeUInt8(value ? 1 : 0, offset);
    }

    static decodeBoolean(buffer: Buffer, offset: number): boolean {
        return buffer.readUInt8(offset) === 1;
    }

    static encodeByte(buffer: Buffer, offset: number, value: number): void {
        buffer.writeUInt8(value, offset);
    }

    static decodeByte(buffer: Buffer, offset: number): number {
        return buffer.readUInt8(offset);
    }

    static encodeUUID(buffer: Buffer, offset: number, value: UUID): void {
        const isNull = value === null;
        this.encodeBoolean(buffer, offset, isNull);
        if (isNull) {
            return;
        }
        const mostSignificantBits = value.mostSignificant;
        const leastSignificantBits = value.leastSignificant;
        this.encodeLong(buffer, offset + BitsUtil.BOOLEAN_SIZE_IN_BYTES, mostSignificantBits);
        this.encodeLong(buffer, offset + BitsUtil.BOOLEAN_SIZE_IN_BYTES + BitsUtil.LONG_SIZE_IN_BYTES, leastSignificantBits);
    }

    static decodeUUID(buffer: Buffer, offset: number): UUID {
        const isNull = this.decodeBoolean(buffer, offset);
        if (isNull) {
            return null;
        }
        const mostSignificantBits = this.decodeLong(buffer, offset + BitsUtil.BOOLEAN_SIZE_IN_BYTES);
        const leastSignificantBits = this.decodeLong(buffer,
            offset + BitsUtil.BOOLEAN_SIZE_IN_BYTES + BitsUtil.LONG_SIZE_IN_BYTES);
        return new UUID(mostSignificantBits, leastSignificantBits);
    }
}
