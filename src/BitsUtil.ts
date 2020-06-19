/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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
export class BitsUtil {
    static BYTE_SIZE_IN_BYTES = 1;
    static BOOLEAN_SIZE_IN_BYTES = 1;
    static SHORT_SIZE_IN_BYTES = 2;
    static CHAR_SIZE_IN_BYTES = 2;
    static INT_SIZE_IN_BYTES = 4;
    static FLOAT_SIZE_IN_BYTES = 4;
    static LONG_SIZE_IN_BYTES = 8;
    static DOUBLE_SIZE_IN_BYTES = 8;
    static UUID_SIZE_IN_BYTES: number = BitsUtil.BOOLEAN_SIZE_IN_BYTES + 2 * BitsUtil.LONG_SIZE_IN_BYTES;

    static BIG_ENDIAN = 2;
    static LITTLE_ENDIAN = 1;

    static BEGIN_FLAG = 0x80;
    static END_FLAG = 0x40;
    static BEGIN_END_FLAG: number = BitsUtil.BEGIN_FLAG | BitsUtil.END_FLAG;
    static LISTENER_FLAG = 0x01;

    static NULL_ARRAY_LENGTH = -1;

    static FRAME_LENGTH_FIELD_OFFSET = 0;
    static VERSION_FIELD_OFFSET: number = BitsUtil.FRAME_LENGTH_FIELD_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
    static FLAGS_FIELD_OFFSET: number = BitsUtil.VERSION_FIELD_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
    static TYPE_FIELD_OFFSET: number = BitsUtil.FLAGS_FIELD_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;
    static CORRELATION_ID_FIELD_OFFSET: number = BitsUtil.TYPE_FIELD_OFFSET + BitsUtil.SHORT_SIZE_IN_BYTES;
    static PARTITION_ID_FIELD_OFFSET: number = BitsUtil.CORRELATION_ID_FIELD_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
    static DATA_OFFSET_FIELD_OFFSET: number = BitsUtil.PARTITION_ID_FIELD_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

    static HEADER_SIZE: number = BitsUtil.DATA_OFFSET_FIELD_OFFSET + BitsUtil.SHORT_SIZE_IN_BYTES;

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

    static writeInt32(buffer: Buffer, pos: number, val: number, isBigEndian: boolean): void {
        if (isBigEndian) {
            buffer.writeInt32BE(val, pos);
        } else {
            buffer.writeInt32LE(val, pos);
        }
    }

    static writeInt16(buffer: Buffer, pos: number, val: number, isBigEndian: boolean): void {
        if (isBigEndian) {
            buffer.writeInt16BE(val, pos);
        } else {
            buffer.writeInt16LE(val, pos);
        }
    }

    static writeInt8(buffer: Buffer, pos: number, val: number): void {
        buffer.writeInt8(val, pos);
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

    static readInt16(buffer: Buffer, pos: number, isBigEndian: boolean): number {
        if (isBigEndian) {
            return buffer.readInt16BE(pos);
        } else {
            return buffer.readInt16LE(pos);
        }
    }

    static readInt32(buffer: Buffer, pos: number, isBigEndian: boolean): number {
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
