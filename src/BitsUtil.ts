/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

/* tslint:disable:no-bitwise */
import {Buffer} from 'safe-buffer';
import {Address} from './Address';
import {Data} from './serialization/Data';
import * as Long from 'long';

export class BitsUtil {

    static BYTE_SIZE_IN_BYTES: number = 1;
    static BOOLEAN_SIZE_IN_BYTES: number = 1;
    static SHORT_SIZE_IN_BYTES: number = 2;
    static CHAR_SIZE_IN_BYTES: number = 2;
    static INT_SIZE_IN_BYTES: number = 4;
    static FLOAT_SIZE_IN_BYTES: number = 4;
    static LONG_SIZE_IN_BYTES: number = 8;
    static DOUBLE_SIZE_IN_BYTES: number = 8;

    static BIG_ENDIAN: number = 2;
    static LITTLE_ENDIAN: number = 1;

    static VERSION: number = 1;

    static BEGIN_FLAG: number ;
    static END_FLAG: number ;

    static NULL_ARRAY_LENGTH: number = -1;

    static SIZE_OFFSET: number = 0;

    static FRAME_LENGTH_FIELD_OFFSET: number = 0;
    static VERSION_FIELD_OFFSET: number = BitsUtil.FRAME_LENGTH_FIELD_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
    static FLAGS_FIELD_OFFSET: number = BitsUtil.VERSION_FIELD_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
    static TYPE_FIELD_OFFSET: number = BitsUtil.FLAGS_FIELD_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
    static CORRELATION_ID_FIELD_OFFSET: number = BitsUtil.TYPE_FIELD_OFFSET + BitsUtil.SHORT_SIZE_IN_BYTES;
    static PARTITION_ID_FIELD_OFFSET: number = BitsUtil.CORRELATION_ID_FIELD_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    static DATA_OFFSET_FIELD_OFFSET: number = BitsUtil.PARTITION_ID_FIELD_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

    static HEADER_SIZE: number = BitsUtil.DATA_OFFSET_FIELD_OFFSET + BitsUtil.SHORT_SIZE_IN_BYTES;

    static calculateSizeData(data: Data): number {
        return BitsUtil.INT_SIZE_IN_BYTES + data.totalSize();
    }

    public static getStringSize(value: string, nullable: boolean = false): number {
        // int32 for string length
        let size = 4;

        if (nullable) {
            size += 1;
        }

        size += value == null ? 0 : Buffer.byteLength(value, 'utf8');

        return size;
    }

    public static calculateSizeString(value: string): number {
        return this.getStringSize(value);
    }

    public static calculateSizeBuffer(value: Buffer): number {
        let size = 4;
        size += value.length;
        return size;
    }

    public static calculateSizeAddress(value: Address): number {
        let size = 4;
        size += this.calculateSizeString(value.host);
        return size;
    }

    static writeUInt32(buffer: Buffer, pos: number, val: number, isBigEndian: boolean): void {
        if (isBigEndian) {
            buffer.writeUInt32BE(val, pos);
        } else {
            buffer.writeUInt32LE(val, pos);
        }
    }

    static writeUInt16(buffer: Buffer, pos: number, val: number, isBigEndian: boolean): void {
        if (isBigEndian) {
            buffer.writeUInt16BE(val, pos);
        } else {
            buffer.writeUInt16LE(val, pos);
        }
    }

    static writeUInt8(buffer: Buffer, pos: number, val: number): void {
        buffer.writeUInt8(val, pos);
    }

    static writeLong(buffer: Buffer, value: any, offset: number): void {
        if (!Long.isLong(value)) {
            value = Long.fromValue(value);
        }
        buffer.writeInt32LE(value.low, offset);
        buffer.writeInt32LE(value.high, offset + 4);
    }

    static readLong(buffer: Buffer, offset: number): Long {
        const low = buffer.readInt32LE(offset);
        const high = buffer.readInt32LE(offset + 4);
        return new Long(low, high);
    }

    static writeInt32(buffer: Buffer, pos: number, val: number, isBigEndian: boolean = false): void {
        if (isBigEndian) {
            buffer.writeInt32BE(val, pos);
        } else {
            buffer.writeInt32LE(val, pos);
        }
    }

    static writeInt16(buffer: Buffer, pos: number, val: number, isBigEndian: boolean = false): void {
        if (isBigEndian) {
            buffer.writeInt16BE(val, pos);
        } else {
            buffer.writeInt16LE(val, pos);
        }
    }

    static writeInt8(buffer: Buffer, pos: number, val: number): void {
        buffer.writeInt8( val, pos);
    }

    static writeFloat(buffer: Buffer, pos: number, val: number, isBigEndian: boolean): void {
        if (isBigEndian) {
            buffer.writeFloatBE(val, pos);
        } else {
            buffer.writeFloatLE(val, pos);
        }
    }

    static writeDouble(buffer: Buffer, pos: number, val: number, isBigEndian: boolean): void {
        if (isBigEndian) {
            buffer.writeDoubleBE(val, pos);
        } else {
            buffer.writeDoubleLE(val, pos);
        }
    }

    static readDouble(buffer: Buffer, pos: number, isBigEndian: boolean): number {
        if (isBigEndian) {
            return buffer.readDoubleBE(pos);
        } else {
            return buffer.readDoubleLE(pos);
        }
    }

    static readFloat(buffer: Buffer, pos: number, isBigEndian: boolean): number {
        if (isBigEndian) {
            return buffer.readFloatBE(pos);
        } else {
            return buffer.readFloatLE(pos);
        }
    }

    static readInt8(buffer: Buffer, pos: number): number {
        return buffer.readInt8(pos);
    }

    static readInt16(buffer: Buffer, pos: number, isBigEndian: boolean = false): number {
        if (isBigEndian) {
            return buffer.readInt16BE(pos);
        } else {
            return buffer.readInt16LE(pos);
        }
    }

    static readInt32(buffer: Buffer, pos: number, isBigEndian: boolean = false): number {
        if (isBigEndian) {
            return buffer.readInt32BE(pos);
        } else {
            return buffer.readInt32LE(pos);
        }
    }

    static readUInt8(buffer: Buffer, pos: number): number {
        return buffer.readUInt8(pos);
    }

    static readUInt16(buffer: Buffer, pos: number, isBigEndian: boolean): number {
        if (isBigEndian) {
            return buffer.readUInt16BE(pos);
        } else {
            return buffer.readUInt16LE(pos);
        }
    }

    static readUInt32(buffer: Buffer, pos: number, isBigEndian: boolean): number {
        if (isBigEndian) {
            return buffer.readUInt32BE(pos);
        } else {
            return buffer.readUInt32LE(pos);
        }
    }
}
