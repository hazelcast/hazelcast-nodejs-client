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
exports.ObjectDataInput = exports.PositionalObjectDataOutput = exports.ObjectDataOutput = void 0;
const assert = require("assert");
const Long = require("long");
const BitsUtil_1 = require("../util/BitsUtil");
const HeapData_1 = require("./HeapData");
const OUTPUT_BUFFER_INITIAL_SIZE = HeapData_1.HEAP_DATA_OVERHEAD + BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES;
const MASK_1BYTE = (1 << 8) - 1;
/** @internal */
class ObjectDataOutput {
    constructor(service, isBigEndian) {
        this.buffer = Buffer.allocUnsafe(OUTPUT_BUFFER_INITIAL_SIZE);
        this.service = service;
        this.bigEndian = isBigEndian;
        this.pos = 0;
    }
    clear() {
        this.buffer = Buffer.allocUnsafe(this.buffer.length);
        this.pos = 0;
    }
    isBigEndian() {
        return this.bigEndian;
    }
    position(newPosition) {
        const oldPos = this.pos;
        if (Number.isInteger(newPosition)) {
            this.pos = newPosition;
        }
        return oldPos;
    }
    toBuffer() {
        return this.buffer.slice(0, this.pos);
    }
    write(byte) {
        if (Buffer.isBuffer(byte)) {
            this.ensureAvailable(byte.length);
            byte.copy(this.buffer, this.pos);
            this.pos += byte.length;
        }
        else {
            this.ensureAvailable(BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES);
            BitsUtil_1.BitsUtil.writeUInt8(this.buffer, this.pos, byte & MASK_1BYTE);
            this.pos += BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
        }
    }
    writeBoolean(val) {
        this.write(val ? 1 : 0);
    }
    writeBooleanArray(val) {
        this.writeArray(this.writeBoolean, val);
    }
    writeByte(byte) {
        this.write(byte);
    }
    writeInt8(byte) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeInt8(this.buffer, this.pos, byte);
        this.pos += BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES;
    }
    writeByteArray(bytes) {
        const len = (bytes != null) ? bytes.length : BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        if (len > 0) {
            this.ensureAvailable(len);
            bytes.copy(this.buffer, this.pos);
            this.pos += len;
        }
    }
    writeChar(char) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.CHAR_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeUInt16(this.buffer, this.pos, char.charCodeAt(0), this.isBigEndian());
        this.pos += BitsUtil_1.BitsUtil.CHAR_SIZE_IN_BYTES;
    }
    writeCharArray(chars) {
        this.writeArray(this.writeChar, chars);
    }
    writeChars(chars) {
        const len = (chars != null) ? chars.length : BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        for (let i = 0; i < len; i++) {
            this.writeChar(chars.charAt(i));
        }
    }
    writeData(data) {
        const buf = (data != null) ? data.toBuffer() : null;
        const len = (buf != null) ? buf.length : BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        for (let i = 0; i < len; i++) {
            this.write(buf[i]);
        }
    }
    writeDouble(double) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.DOUBLE_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeDouble(this.buffer, this.pos, double, this.isBigEndian());
        this.pos += BitsUtil_1.BitsUtil.DOUBLE_SIZE_IN_BYTES;
    }
    writeDoubleArray(doubles) {
        this.writeArray(this.writeDouble, doubles);
    }
    writeFloat(float) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.FLOAT_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeFloat(this.buffer, this.pos, float, this.isBigEndian());
        this.pos += BitsUtil_1.BitsUtil.FLOAT_SIZE_IN_BYTES;
    }
    writeFloatArray(floats) {
        this.writeArray(this.writeFloat, floats);
    }
    writeInt(int) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeInt32(this.buffer, this.pos, int, this.isBigEndian());
        this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
    }
    writeIntBE(int) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeInt32(this.buffer, this.pos, int, true);
        this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
    }
    writeIntArray(ints) {
        this.writeArray(this.writeInt, ints);
    }
    writeLong(long) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES);
        if (this.isBigEndian()) {
            BitsUtil_1.BitsUtil.writeInt32(this.buffer, this.pos, long.high, true);
            this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
            BitsUtil_1.BitsUtil.writeInt32(this.buffer, this.pos, long.low, true);
            this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
        }
        else {
            BitsUtil_1.BitsUtil.writeInt32(this.buffer, this.pos, long.low, false);
            this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
            BitsUtil_1.BitsUtil.writeInt32(this.buffer, this.pos, long.high, false);
            this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
        }
    }
    writeLongArray(longs) {
        this.writeArray(this.writeLong, longs);
    }
    writeObject(object) {
        this.service.writeObject(this, object);
    }
    writeShort(short) {
        this.ensureAvailable(BitsUtil_1.BitsUtil.SHORT_SIZE_IN_BYTES);
        BitsUtil_1.BitsUtil.writeInt16(this.buffer, this.pos, short, this.isBigEndian());
        this.pos += BitsUtil_1.BitsUtil.SHORT_SIZE_IN_BYTES;
    }
    writeShortArray(shorts) {
        this.writeArray(this.writeShort, shorts);
    }
    writeUTF(val) {
        this.writeString(val);
    }
    writeString(val) {
        const len = (val != null) ? Buffer.byteLength(val, 'utf8') : BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        if (len === BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
            return;
        }
        this.ensureAvailable(len);
        this.buffer.write(val, this.pos, this.pos + len, 'utf8');
        this.pos += len;
    }
    writeUTFArray(val) {
        this.writeStringArray(val);
    }
    writeStringArray(val) {
        this.writeArray(this.writeString, val);
    }
    writeZeroBytes(count) {
        for (let i = 0; i < count; i++) {
            this.write(0);
        }
    }
    available() {
        return this.buffer == null ? 0 : this.buffer.length - this.pos;
    }
    ensureAvailable(size) {
        if (this.available() < size) {
            const newBuffer = Buffer.allocUnsafe(this.pos + size);
            this.buffer.copy(newBuffer, 0, 0, this.pos);
            this.buffer = newBuffer;
        }
    }
    writeArray(func, arr) {
        const len = (arr != null) ? arr.length : BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        if (len > 0) {
            const boundFunc = func.bind(this);
            arr.forEach(boundFunc);
        }
    }
}
exports.ObjectDataOutput = ObjectDataOutput;
/** @internal */
class PositionalObjectDataOutput extends ObjectDataOutput {
    pwrite(position, byte) {
        if (Buffer.isBuffer(byte)) {
            byte.copy(this.buffer, position);
        }
        else {
            this.buffer[position] = byte;
        }
    }
    pwriteBoolean(position, val) {
        this.pwrite(position, val ? 1 : 0);
    }
    pwriteByte(position, byte) {
        this.pwrite(position, byte);
    }
    pwriteInt8(position, byte) {
        BitsUtil_1.BitsUtil.writeInt8(this.buffer, position, byte);
    }
    pwriteChar(position, char) {
        BitsUtil_1.BitsUtil.writeUInt16(this.buffer, position, char.charCodeAt(0), this.isBigEndian());
    }
    pwriteDouble(position, double) {
        BitsUtil_1.BitsUtil.writeDouble(this.buffer, position, double, this.isBigEndian());
    }
    pwriteFloat(position, float) {
        BitsUtil_1.BitsUtil.writeFloat(this.buffer, position, float, this.isBigEndian());
    }
    pwriteInt(position, int) {
        BitsUtil_1.BitsUtil.writeInt32(this.buffer, position, int, this.isBigEndian());
    }
    pwriteIntBE(position, int) {
        BitsUtil_1.BitsUtil.writeInt32(this.buffer, position, int, true);
    }
    pwriteLong(position, long) {
        if (this.isBigEndian()) {
            BitsUtil_1.BitsUtil.writeInt32(this.buffer, position, long.high, true);
            BitsUtil_1.BitsUtil.writeInt32(this.buffer, position + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, long.low, true);
        }
        else {
            BitsUtil_1.BitsUtil.writeInt32(this.buffer, position, long.low, false);
            BitsUtil_1.BitsUtil.writeInt32(this.buffer, position + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, long.high, false);
        }
    }
    pwriteShort(position, short) {
        BitsUtil_1.BitsUtil.writeInt16(this.buffer, position, short, this.isBigEndian());
    }
    pwriteBooleanBit(position, bitIndex, val) {
        let b = this.buffer[position];
        if (val) {
            b = b | (1 << bitIndex);
        }
        else {
            b = b & ~(1 << bitIndex);
        }
        this.buffer[position] = b;
    }
}
exports.PositionalObjectDataOutput = PositionalObjectDataOutput;
/** @internal */
class ObjectDataInput {
    constructor(buffer, offset, serializationService, isBigEndian) {
        this.buffer = buffer;
        this.offset = offset;
        this.service = serializationService;
        this.bigEndian = isBigEndian;
        this.pos = this.offset;
    }
    isBigEndian() {
        return this.bigEndian;
    }
    position(newPosition) {
        const oldPos = this.pos;
        if (Number.isInteger(newPosition)) {
            this.pos = newPosition;
        }
        return oldPos;
    }
    read(pos) {
        this.assertAvailable(BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES, pos);
        if (pos === undefined) {
            return BitsUtil_1.BitsUtil.readUInt8(this.buffer, this.pos++);
        }
        else {
            return BitsUtil_1.BitsUtil.readUInt8(this.buffer, pos);
        }
    }
    readBoolean(pos) {
        return this.read(pos) === 1;
    }
    readBooleanArray(pos) {
        return this.readArray(this.readBoolean, pos);
    }
    readByte(pos) {
        return this.read(pos);
    }
    readInt8(pos) {
        this.assertAvailable(BitsUtil_1.BitsUtil.BYTE_SIZE_IN_BYTES, pos);
        if (pos === undefined) {
            return BitsUtil_1.BitsUtil.readInt8(this.buffer, this.pos++);
        }
        else {
            return BitsUtil_1.BitsUtil.readInt8(this.buffer, pos);
        }
    }
    readByteArray(pos) {
        const backupPos = this.pos;
        if (pos !== undefined) {
            this.pos = pos;
        }
        const len = this.readInt();
        if (len === BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
            if (pos !== undefined) {
                this.pos = backupPos;
            }
            return null;
        }
        const buf = this.buffer.slice(this.pos, this.pos + len);
        if (pos !== undefined) {
            this.pos = backupPos;
        }
        else {
            this.pos += len;
        }
        return buf;
    }
    readChar(pos) {
        this.assertAvailable(BitsUtil_1.BitsUtil.CHAR_SIZE_IN_BYTES);
        let readBytes;
        if (pos === undefined) {
            readBytes = BitsUtil_1.BitsUtil.readUInt16(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil_1.BitsUtil.CHAR_SIZE_IN_BYTES;
        }
        else {
            readBytes = BitsUtil_1.BitsUtil.readUInt16(this.buffer, pos, this.isBigEndian());
        }
        return String.fromCharCode(readBytes);
    }
    readCharArray(pos) {
        return this.readArray(this.readChar, pos);
    }
    readData() {
        const bytes = this.readByteArray();
        const data = bytes === null ? null : new HeapData_1.HeapData(Buffer.from(bytes));
        return data;
    }
    readDouble(pos) {
        this.assertAvailable(BitsUtil_1.BitsUtil.DOUBLE_SIZE_IN_BYTES, pos);
        let ret;
        if (pos === undefined) {
            ret = BitsUtil_1.BitsUtil.readDouble(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil_1.BitsUtil.DOUBLE_SIZE_IN_BYTES;
        }
        else {
            ret = BitsUtil_1.BitsUtil.readDouble(this.buffer, pos, this.isBigEndian());
        }
        return ret;
    }
    readDoubleArray(pos) {
        return this.readArray(this.readDouble, pos);
    }
    readFloat(pos) {
        this.assertAvailable(BitsUtil_1.BitsUtil.FLOAT_SIZE_IN_BYTES, pos);
        let ret;
        if (pos === undefined) {
            ret = BitsUtil_1.BitsUtil.readFloat(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil_1.BitsUtil.FLOAT_SIZE_IN_BYTES;
        }
        else {
            ret = BitsUtil_1.BitsUtil.readFloat(this.buffer, pos, this.isBigEndian());
        }
        return ret;
    }
    readFloatArray(pos) {
        return this.readArray(this.readFloat, pos);
    }
    readInt(pos) {
        this.assertAvailable(BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, pos);
        let ret;
        if (pos === undefined) {
            ret = BitsUtil_1.BitsUtil.readInt32(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
        }
        else {
            ret = BitsUtil_1.BitsUtil.readInt32(this.buffer, pos, this.isBigEndian());
        }
        return ret;
    }
    readIntArray(pos) {
        return this.readArray(this.readInt, pos);
    }
    readLong(pos) {
        this.assertAvailable(BitsUtil_1.BitsUtil.LONG_SIZE_IN_BYTES, pos);
        let first;
        let second;
        if (pos === undefined) {
            first = BitsUtil_1.BitsUtil.readInt32(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
            second = BitsUtil_1.BitsUtil.readInt32(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
        }
        else {
            first = BitsUtil_1.BitsUtil.readInt32(this.buffer, pos, this.isBigEndian());
            second = BitsUtil_1.BitsUtil.readInt32(this.buffer, pos + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, this.isBigEndian());
        }
        if (this.isBigEndian()) {
            return new Long(second, first);
        }
        else {
            return new Long(first, second);
        }
    }
    readLongArray(pos) {
        return this.readArray(this.readLong, pos);
    }
    readObject() {
        return this.service.readObject(this);
    }
    readShort(pos) {
        this.assertAvailable(BitsUtil_1.BitsUtil.SHORT_SIZE_IN_BYTES, pos);
        let ret;
        if (pos === undefined) {
            ret = BitsUtil_1.BitsUtil.readInt16(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil_1.BitsUtil.SHORT_SIZE_IN_BYTES;
        }
        else {
            ret = BitsUtil_1.BitsUtil.readInt16(this.buffer, pos, this.isBigEndian());
        }
        return ret;
    }
    readShortArray(pos) {
        return this.readArray(this.readShort, pos);
    }
    readUnsignedByte(pos) {
        return this.read(pos);
    }
    readUnsignedShort(pos) {
        return this.readChar(pos).charCodeAt(0);
    }
    readUTF(pos) {
        return this.readString(pos);
    }
    readString(pos) {
        const len = this.readInt(pos);
        const readPos = ObjectDataInput.addOrUndefined(pos, 4) || this.pos;
        if (len === BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
            return null;
        }
        const result = this.buffer.toString('utf8', readPos, readPos + len);
        if (pos === undefined) {
            this.pos += len;
        }
        return result;
    }
    readUTFArray(pos) {
        return this.readStringArray(pos);
    }
    readStringArray(pos) {
        return this.readArray(this.readString, pos);
    }
    reset() {
        this.pos = 0;
    }
    skipBytes(count) {
        this.pos += count;
    }
    available() {
        return this.buffer.length - this.pos;
    }
    // used in binary compatibility tests
    readRaw(numOfBytes) {
        this.assertAvailable(numOfBytes, this.pos);
        const raw = this.buffer.slice(this.pos, this.pos + numOfBytes);
        this.pos += numOfBytes;
        return raw;
    }
    readArray(func, pos) {
        const backupPos = this.pos;
        if (pos !== undefined) {
            this.pos = pos;
        }
        const len = this.readInt();
        if (len === BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
            if (pos !== undefined) {
                this.pos = backupPos;
            }
            return null;
        }
        const arr = [];
        for (let i = 0; i < len; i++) {
            arr.push(func.call(this));
        }
        if (pos !== undefined) {
            this.pos = backupPos;
        }
        return arr;
    }
    assertAvailable(numOfBytes, pos = this.pos) {
        assert(pos >= 0);
        assert(pos + numOfBytes <= this.buffer.length);
    }
    static addOrUndefined(base, adder) {
        if (base === undefined) {
            return undefined;
        }
        else {
            return base + adder;
        }
    }
}
exports.ObjectDataInput = ObjectDataInput;
//# sourceMappingURL=ObjectData.js.map