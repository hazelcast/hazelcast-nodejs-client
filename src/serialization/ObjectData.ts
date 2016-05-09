/* tslint:disable:no-bitwise */
import Long = require('long');
import {DataOutput, Data, DataInput} from './Data';
import {SerializationService} from './SerializationService';
import {BitsUtil} from '../BitsUtil';
import * as assert from 'assert';
import {HeapData} from './HeapData';

const MASK_1BYTE = (1 << 8) - 1;
const MASK_2BYTE = (1 << 16) - 1;
const MASK_4BYTE = (1 << 32) - 1;

export class ObjectDataOutput implements DataOutput {
    private buffer: Buffer;
    private service: SerializationService;
    private bigEndian: boolean;
    private pos: number;

    constructor(length: number, service: SerializationService, isBigEndian: boolean) {
        this.buffer = new Buffer(length);
        this.service = service;
        this.bigEndian = isBigEndian;
        this.pos = 0;
    }

    private available(): number {
        return this.buffer == null ? 0 : this.buffer.length - this.pos;
    }

    private ensureAvailable(size: number): void {
        if (this.available() < size ) {
            var newBuffer = new Buffer(this.pos + size);
            this.buffer.copy(newBuffer);
            this.buffer = newBuffer;
        }
    }

    private writeArray(func: Function, arr: Array<any>) {
        var len = (arr != null) ? arr.length : BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        if (len > 0) {
            var boundFunc = func.bind(this);
            arr.forEach(boundFunc);
        }
    }

    clear(): void {
        this.buffer = new Buffer(this.buffer.length);
        this.pos = 0;
    }

    isBigEndian(): boolean {
        return this.bigEndian;
    }

    position(newPosition?: number): number {
        var oldPos = this.pos;
        if (Number.isInteger(newPosition)) {
            this.pos = newPosition;
        }
        return oldPos;
    }

    toBuffer(): Buffer {
        return this.buffer;
    }

    write(byte: number|Buffer): void {
        if (Buffer.isBuffer(byte)) {
            this.ensureAvailable(byte.length);
            byte.copy(this.buffer, this.pos);
            this.pos += byte.length;
        } else {
            this.ensureAvailable(BitsUtil.BYTE_SIZE_IN_BYTES);
            BitsUtil.writeUInt8(this.buffer, this.pos, byte & MASK_1BYTE);
            this.pos += BitsUtil.BYTE_SIZE_IN_BYTES;
        }
    }

    writeBoolean(val: boolean): void {
        this.write(val ? 1 : 0);
    }

    writeBooleanArray(val: boolean[]): void {
        this.writeArray(this.writeBoolean, val);
    }

    writeByte(byte: number): void {
        this.write(byte);
    }

    writeByteArray(bytes: number[]): void {
        this.writeArray(this.writeByte, bytes);
    }

    writeBytes(bytes: string): void {
        var len = (bytes != null) ? bytes.length : BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        for (var i = 0; i < len; i++) {
            this.write(bytes.charCodeAt(i));
        }
    }

    writeChar(char: string): void {
        this.ensureAvailable(BitsUtil.CHAR_SIZE_IN_BYTES);
        BitsUtil.writeUInt16(this.buffer, this.pos, char.charCodeAt(0), this.isBigEndian());
        this.pos += BitsUtil.CHAR_SIZE_IN_BYTES;
    }

    writeCharArray(chars: string[]): void {
        this.writeArray(this.writeChar, chars);
    }

    writeChars(chars: string): void {
        var len = (chars != null) ? chars.length : BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        for (var i = 0; i < len; i++) {
            this.writeChar(chars.charAt(i));
        }
    }

    writeData(data: Data): void {
        var buf = (data != null) ? data.toBuffer() : null;
        var len = (buf != null) ? buf.length : BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        for (var i = 0; i < len; i++) {
            this.write(buf[i]);
        }
    }

    writeDouble(double: number): void {
        this.ensureAvailable(BitsUtil.DOUBLE_SIZE_IN_BYTES);
        BitsUtil.writeDouble(this.buffer, this.pos, double, this.isBigEndian());
        this.pos += BitsUtil.DOUBLE_SIZE_IN_BYTES;
    }

    writeDoubleArray(doubles: number[]): void {
        this.writeArray(this.writeDouble, doubles);
    }

    writeFloat(float: number): void {
        this.ensureAvailable(BitsUtil.FLOAT_SIZE_IN_BYTES);
        BitsUtil.writeFloat(this.buffer, this.pos, float, this.isBigEndian());
        this.pos += BitsUtil.FLOAT_SIZE_IN_BYTES;
    }

    writeFloatArray(floats: number[]): void {
        this.writeArray(this.writeFloat, floats);
    }

    writeInt(int: number): void {
        this.ensureAvailable(BitsUtil.INT_SIZE_IN_BYTES);
        BitsUtil.writeInt32(this.buffer, this.pos, int, this.isBigEndian());
        this.pos += BitsUtil.INT_SIZE_IN_BYTES;
    }

    writeIntBE(int: number): void {
        this.ensureAvailable(BitsUtil.INT_SIZE_IN_BYTES);
        BitsUtil.writeInt32(this.buffer, this.pos, int, true);
        this.pos += BitsUtil.INT_SIZE_IN_BYTES;
    }

    writeIntArray(ints: number[]): void {
        this.writeArray(this.writeInt, ints);
    }

    writeLong(long: Long): void {
        this.ensureAvailable(BitsUtil.LONG_SIZE_IN_BYTES);
        if (this.isBigEndian()) {
            BitsUtil.writeInt32(this.buffer, this.pos, long.high, true);
            this.pos += BitsUtil.INT_SIZE_IN_BYTES;
            BitsUtil.writeInt32(this.buffer, this.pos, long.low, true);
            this.pos += BitsUtil.INT_SIZE_IN_BYTES;
        } else {
            BitsUtil.writeInt32(this.buffer, this.pos, long.low, false);
            this.pos += BitsUtil.INT_SIZE_IN_BYTES;
            BitsUtil.writeInt32(this.buffer, this.pos, long.high, false);
            this.pos += BitsUtil.INT_SIZE_IN_BYTES;
        }
    }

    writeLongArray(longs: Long[]): void {
        this.writeArray(this.writeLong, longs);
    }

    writeObject(object: any): void {
        this.service.writeObject(this, object);
    }

    writeShort(short: number): void {
        this.ensureAvailable(BitsUtil.SHORT_SIZE_IN_BYTES);
        BitsUtil.writeInt16(this.buffer, this.pos, short, this.isBigEndian());
        this.pos += BitsUtil.SHORT_SIZE_IN_BYTES;
    }

    writeShortArray(shorts: number[]): void {
        this.writeArray(this.writeShort, shorts);
    }

    writeUTF(val: string): void {
        var len = (val != null) ? val.length : BitsUtil.NULL_ARRAY_LENGTH;
        this.writeInt(len);
        if (len > 0 ) {
            this.write(new Buffer(val, 'utf8'));
        }
    }

    writeUTFArray(val: string[]): void {
        this.writeArray(this.writeUTF, val);
    }

    writeZeroBytes(count: number): void {
        for (var i = 0; i < count; i++) {
            this.write(0);
        }
    }
}

export class ObjectDataInput implements DataInput {

    private buffer: Buffer;
    private offset: number;
    private service: SerializationService;
    private bigEndian: boolean;
    private pos: number;

    constructor(buffer: Buffer, offset: number, serializationService: SerializationService, isBigEndian: boolean) {
        this.buffer = buffer;
        this.offset = offset;
        this.service = serializationService;
        this.bigEndian = isBigEndian;
        this.pos = this.offset;
    }

    private readArray<T>(func: Function) {
        var len = this.readInt();
        var arr: T[] = [];
        for (var i = 0; i < len; i++) {
            arr.push(func.call(this));
        }
        return arr;
    }

    private assertAvailable(numOfBytes: number, pos: number = this.pos): void {
        assert(pos >= 0);
        assert(pos + numOfBytes <= this.buffer.length);
    }

    isBigEndian(): boolean {
        return this.bigEndian;
    }

    position(newPosition?: number): number {
        var oldPos = this.pos;
        if (Number.isInteger(newPosition)) {
            this.pos = newPosition;
        }
        return oldPos;
    }

    read(pos?: number): number {
        this.assertAvailable(BitsUtil.BYTE_SIZE_IN_BYTES, pos);
        if (pos === undefined) {
            return BitsUtil.readUInt8(this.buffer, this.pos++);
        } else {
            return BitsUtil.readUInt8(this.buffer, pos);
        }
    }

    readBoolean(pos?: number): boolean {
        return this.read(pos) === 1;
    }

    readBooleanArray(): boolean[] {
        return this.readArray<boolean>(this.readBoolean);
    }

    readByte(pos?: number): number {
        return this.read(pos);
    }

    readByteArray(): number[] {
        return this.readArray<number>(this.readByte);
    }

    readChar(pos?: number): string {
        this.assertAvailable(BitsUtil.CHAR_SIZE_IN_BYTES);
        var readBytes: any;
        if (pos === undefined) {
            readBytes = BitsUtil.readUInt16(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil.CHAR_SIZE_IN_BYTES;
        } else {
            readBytes = BitsUtil.readUInt16(this.buffer, pos, this.isBigEndian());
        }
        return String.fromCharCode(readBytes);
    }

    readCharArray(): string[] {
        return this.readArray<string>(this.readChar);
    }

    readData(): Data {
        var bytes: number[] = this.readByteArray();
        var data: Data = bytes === null ? null : new HeapData(new Buffer(bytes));
        return data;
    }

    readDouble(pos?: number): number {
        this.assertAvailable(BitsUtil.DOUBLE_SIZE_IN_BYTES, pos);
        var ret: number;
        if (pos === undefined) {
            ret = BitsUtil.readDouble(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil.DOUBLE_SIZE_IN_BYTES;
        } else {
            ret = BitsUtil.readDouble(this.buffer, pos, this.isBigEndian());
        }
        return ret;
    }

    readDoubleArray(): number[] {
        return this.readArray<number>(this.readDouble);
    }

    readFloat(pos?: number): number {
        this.assertAvailable(BitsUtil.FLOAT_SIZE_IN_BYTES, pos);
        var ret: number;
        if (pos === undefined) {
            ret = BitsUtil.readFloat(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil.FLOAT_SIZE_IN_BYTES;
        } else {
            ret = BitsUtil.readFloat(this.buffer, pos, this.isBigEndian());
        }
        return ret;
    }

    readFloatArray(): number[] {
        return this.readArray<number>(this.readFloat);
    }

    readInt(pos?: number): number {
        this.assertAvailable(BitsUtil.INT_SIZE_IN_BYTES, pos);
        var ret: number;
        if (pos === undefined) {
            ret = BitsUtil.readInt32(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil.INT_SIZE_IN_BYTES;
        } else {
            ret = BitsUtil.readInt32(this.buffer, pos, this.isBigEndian());
        }
        return ret;
    }

    readIntArray(): number[] {
        return this.readArray<number>(this.readInt);
    }

    readLong(pos?: number): Long {
        this.assertAvailable(BitsUtil.LONG_SIZE_IN_BYTES, pos);
        var first: number;
        var second: number;
        if (pos === undefined) {
            first = BitsUtil.readInt32(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil.INT_SIZE_IN_BYTES;
            second = BitsUtil.readInt32(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil.INT_SIZE_IN_BYTES;
        } else {
            first = BitsUtil.readInt32(this.buffer, pos, this.isBigEndian());
            second = BitsUtil.readInt32(this.buffer, pos + BitsUtil.INT_SIZE_IN_BYTES, this.isBigEndian());
        }
        if (this.isBigEndian()) {
            return new Long(second, first);
        } else {
            return new Long(first, second);
        }
    }

    readLongArray(): Long[] {
        return this.readArray<Long>(this.readLong);
    }

    readObject(): any {
        return this.service.readObject(this);
    }

    readShort(pos?: number): number {
        this.assertAvailable(BitsUtil.SHORT_SIZE_IN_BYTES, pos);
        var ret: number;
        if (pos === undefined) {
            ret = BitsUtil.readInt16(this.buffer, this.pos, this.isBigEndian());
            this.pos += BitsUtil.SHORT_SIZE_IN_BYTES;
        } else {
            ret = BitsUtil.readInt16(this.buffer, pos, this.isBigEndian());
        }
        return ret;
    }

    readShortArray(): number[] {
        return this.readArray<number>(this.readShort);
    }

    readUnsignedByte(pos?: number): number {
        return this.read(pos);
    }

    readUnsignedShort(pos?: number): number {
        return this.readChar(pos).charCodeAt(0);
    }

    readUTF(): string {
        this.assertAvailable(BitsUtil.INT_SIZE_IN_BYTES);
        var len = this.readInt();
        if (len === BitsUtil.NULL_ARRAY_LENGTH) {
            return null;
        } else {
            var result: number[] = [];
            var leadingByte: number;
            var continuationByte: number;
            for (var i = 0; i < len; i++) {
                leadingByte = this.readByte() & MASK_1BYTE;
                result.push(leadingByte);
                if (leadingByte >= 128) {
                    while (((leadingByte <<= 1) & MASK_1BYTE) >= 128) {
                        continuationByte = this.readByte();
                        if (((continuationByte >> 6) & MASK_1BYTE) !== 2) {
                            throw new Error('String is not properly UTF8 encoded');
                        }
                        result.push(continuationByte);
                    }
                }
            }
            return new Buffer(result).toString('utf8');
        }
    }

    readUTFArray(): string[] {
        return this.readArray<string>(this.readUTF);
    }

    reset(): void {
        this.pos = 0;
    }

    skipBytes(count: number): void {
        this.pos += count;
    }
}
