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
exports.BitsUtil = void 0;
/** @internal */
class BitsUtil {
    static writeUInt32(buffer, pos, val, isBigEndian) {
        if (isBigEndian) {
            buffer.writeUInt32BE(val, pos);
        }
        else {
            buffer.writeUInt32LE(val, pos);
        }
    }
    static writeUInt16(buffer, pos, val, isBigEndian) {
        if (isBigEndian) {
            buffer.writeUInt16BE(val, pos);
        }
        else {
            buffer.writeUInt16LE(val, pos);
        }
    }
    static writeUInt8(buffer, pos, val) {
        buffer.writeUInt8(val, pos);
    }
    static writeInt32(buffer, pos, val, isBigEndian) {
        if (isBigEndian) {
            buffer.writeInt32BE(val, pos);
        }
        else {
            buffer.writeInt32LE(val, pos);
        }
    }
    static writeInt16(buffer, pos, val, isBigEndian) {
        if (isBigEndian) {
            buffer.writeInt16BE(val, pos);
        }
        else {
            buffer.writeInt16LE(val, pos);
        }
    }
    static writeInt8(buffer, pos, val) {
        buffer.writeInt8(val, pos);
    }
    static writeFloat(buffer, pos, val, isBigEndian) {
        if (isBigEndian) {
            buffer.writeFloatBE(val, pos);
        }
        else {
            buffer.writeFloatLE(val, pos);
        }
    }
    static writeDouble(buffer, pos, val, isBigEndian) {
        if (isBigEndian) {
            buffer.writeDoubleBE(val, pos);
        }
        else {
            buffer.writeDoubleLE(val, pos);
        }
    }
    static readDouble(buffer, pos, isBigEndian) {
        if (isBigEndian) {
            return buffer.readDoubleBE(pos);
        }
        else {
            return buffer.readDoubleLE(pos);
        }
    }
    static readFloat(buffer, pos, isBigEndian) {
        if (isBigEndian) {
            return buffer.readFloatBE(pos);
        }
        else {
            return buffer.readFloatLE(pos);
        }
    }
    static readInt8(buffer, pos) {
        return buffer.readInt8(pos);
    }
    static readInt16(buffer, pos, isBigEndian) {
        if (isBigEndian) {
            return buffer.readInt16BE(pos);
        }
        else {
            return buffer.readInt16LE(pos);
        }
    }
    static readInt32(buffer, pos, isBigEndian) {
        if (isBigEndian) {
            return buffer.readInt32BE(pos);
        }
        else {
            return buffer.readInt32LE(pos);
        }
    }
    static readUInt8(buffer, pos) {
        return buffer.readUInt8(pos);
    }
    static readUInt16(buffer, pos, isBigEndian) {
        if (isBigEndian) {
            return buffer.readUInt16BE(pos);
        }
        else {
            return buffer.readUInt16LE(pos);
        }
    }
    static readUInt32(buffer, pos, isBigEndian) {
        if (isBigEndian) {
            return buffer.readUInt32BE(pos);
        }
        else {
            return buffer.readUInt32LE(pos);
        }
    }
}
exports.BitsUtil = BitsUtil;
BitsUtil.BYTE_SIZE_IN_BYTES = 1;
BitsUtil.BOOLEAN_SIZE_IN_BYTES = 1;
BitsUtil.SHORT_SIZE_IN_BYTES = 2;
BitsUtil.CHAR_SIZE_IN_BYTES = 2;
BitsUtil.INT_SIZE_IN_BYTES = 4;
BitsUtil.FLOAT_SIZE_IN_BYTES = 4;
BitsUtil.LONG_SIZE_IN_BYTES = 8;
BitsUtil.DOUBLE_SIZE_IN_BYTES = 8;
BitsUtil.LOCAL_DATE_SIZE_IN_BYTES = BitsUtil.INT_SIZE_IN_BYTES + BitsUtil.BYTE_SIZE_IN_BYTES * 2;
BitsUtil.LOCAL_TIME_SIZE_IN_BYTES = BitsUtil.INT_SIZE_IN_BYTES + BitsUtil.BYTE_SIZE_IN_BYTES * 3;
BitsUtil.LOCAL_DATETIME_SIZE_IN_BYTES = BitsUtil.LOCAL_DATE_SIZE_IN_BYTES + BitsUtil.LOCAL_TIME_SIZE_IN_BYTES;
BitsUtil.OFFSET_DATE_TIME_SIZE_IN_BYTES = BitsUtil.LOCAL_DATETIME_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES;
BitsUtil.UUID_SIZE_IN_BYTES = BitsUtil.BOOLEAN_SIZE_IN_BYTES + 2 * BitsUtil.LONG_SIZE_IN_BYTES;
BitsUtil.NULL_ARRAY_LENGTH = -1;
BitsUtil.BITS_IN_A_BYTE = 8;
//# sourceMappingURL=BitsUtil.js.map