///<reference path="../typings/node/node.d.ts" />
///<reference path="../typings/long/long.d.ts" />
/* tslint:disable:no-bitwise */
/*
 Client Message is the carrier framed data as defined below.
 Any request parameter, response or event data will be carried in the payload.
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |R|                      Frame Length                           |
 +-------------+---------------+---------------------------------+
 |  Version    |B|E|  Flags    |               Type              |
 +-------------+---------------+---------------------------------+
 |                       CorrelationId                           |
 |                                                               |
 +---------------------------------------------------------------+
 |                        PartitionId                            |
 +-----------------------------+---------------------------------+
 |        Data Offset          |                                 |
 +-----------------------------+                                 |
 |                      Message Payload Data                    ...
 |                                                              ...
 */

import Long = require('long');
import {BitsUtil} from './BitsUtil';

class ClientMessage {
    buffer:  Buffer;
    writeIndex:  number;
    readIndex:  number;

    constructor(payload_size:  number) {
        this.buffer = new Buffer(payload_size);
        this.buffer.fill(0, 0, BitsUtil.HEADER_SIZE + payload_size);
        this.setDataOffset(BitsUtil.HEADER_SIZE);
        this.setVersion(BitsUtil.VERSION);
        this.writeIndex = 0;
        this.readIndex = 0;
    }

    getCorrelationId(): number {
        return this.buffer.readUInt32LE(BitsUtil.CORRELATION_ID_FIELD_OFFSET);
    }

    setCorrelationId(val: number) {
        this.buffer.writeUInt32LE(val, BitsUtil.CORRELATION_ID_FIELD_OFFSET);
    }

    getPartitionId(): number {
        return this.buffer.readInt32LE(BitsUtil.PARTITION_ID_FIELD_OFFSET);
    }

    setPartitionId(val: number) {
        this.buffer.writeInt32LE(val, BitsUtil.PARTITION_ID_FIELD_OFFSET);
    }

    setVersion(val: number) {
        this.buffer.writeUInt8(val, BitsUtil.VERSION_FIELD_OFFSET);
    }

    getMessageType(): number {
        return this.buffer.readUInt16LE(BitsUtil.TYPE_FIELD_OFFSET);
    }

    setMessageType(val: number) {
        this.buffer.writeUInt16LE(val, BitsUtil.TYPE_FIELD_OFFSET);
    }

    getFlags(): number {
        return this.buffer.readUInt8(BitsUtil.FLAGS_FIELD_OFFSET);
    }

    setFlags(val: number) {
        this.buffer.writeUInt8(val, BitsUtil.FLAGS_FIELD_OFFSET);
    }

    hasFlags(flags: number): number {
        return this.getFlags() & flags;
    }

    getFrameLength(): number {
        return this.buffer.readInt32LE(BitsUtil.FRAME_LENGTH_FIELD_OFFSET);
    }

    setFrameLength(val: number) {
        this.buffer.writeInt32LE(val, BitsUtil.FRAME_LENGTH_FIELD_OFFSET);
    }

    getDataOffset(): number {
        return this.buffer.readInt16LE(BitsUtil.DATA_OFFSET_FIELD_OFFSET);
    }

    setDataOffset(val: number) {
        this.buffer.writeInt16LE(val, BitsUtil.DATA_OFFSET_FIELD_OFFSET);
    }

    getWriteOffset(): number {
        return this.getDataOffset() + this.writeIndex;
    }

    getReadOffset(): number {
        return this.getDataOffset() + this.readIndex;
    }

// PAYLOAD


    appendByte(val: number) {
        this.buffer.writeUInt8(val, this.getWriteOffset());
        this.writeIndex += BitsUtil.BYTE_SIZE_IN_BYTES;
    }

    appendBool(val: boolean) {
        return this.appendByte(val ? 1 :  0);
    }

    appendInt(val: number) {
        this.buffer.writeInt32LE(val, this.getWriteOffset());
        this.writeIndex += BitsUtil.INT_SIZE_IN_BYTES;
    }

    appendLong(value: any) {
        if (!Long.isLong(value)) {
            value = Long.fromValue(value);
        }

        this.buffer.writeInt32LE(value.low, this.getWriteOffset());
        this.buffer.writeInt32LE(value.high, this.getWriteOffset() + 4);
        this.writeIndex += BitsUtil.LONG_SIZE_IN_BYTES;
    }

    appendStr(value: string) {
        var length = value.length;
        this.buffer.writeInt32LE(length, this.getWriteOffset());
        this.writeIndex += 4;
        this.buffer.write(value, this.getWriteOffset());
        this.writeIndex += length;
    }

    addFlag(value: number) {
        this.buffer.writeUInt8(value | this.getFlags(), BitsUtil.FLAGS_FIELD_OFFSET);
    }

    updateFrameLength() {
        this.setFrameLength(this.getWriteOffset());
    }


    appendData(val: any) {
        this.appendByteArray(val.to_bytes());
    }

    appendByteArray(arr: any) {
        length = arr.length;
        this.appendInt(length);
        this.buffer.write(arr);
        this.writeIndex += length;
    }

    //# PAYLOAD READ

    readByte(): number {
        var val: number;
        val = this.buffer.readUInt8(this.readIndex);
        this.readIndex += BitsUtil.BYTE_SIZE_IN_BYTES;
        return val;
    }

    readBool(): boolean {
        return this.readByte() === 1 ? true :  false;
    }

    readInt(): number {
        var val: number;
        val = this.buffer.readIntLE(this.readIndex, BitsUtil.INT_SIZE_IN_BYTES);
        this.readIndex += BitsUtil.INT_SIZE_IN_BYTES;
        return val;
    }

    readLong() {
        var low = this.buffer.readInt32LE(this.readIndex);
        var high = this.buffer.readInt32LE(this.readIndex + 4);
        var value = new Long(low, high);
        this.readIndex += BitsUtil.LONG_SIZE_IN_BYTES;
        return value;
    }

    readStr(): string {
        var length = this.buffer.readInt32LE(this.readIndex);
        this.readIndex += BitsUtil.INT_SIZE_IN_BYTES;
        var value = this.buffer.toString('utf8', this.readIndex, this.readIndex + length);
        this.readIndex += length;
        return value;
    }

    readByteArray() {
        var size = this.buffer.readUInt32LE(this.readIndex);
        this.readIndex += BitsUtil.INT_SIZE_IN_BYTES;
        var result = new Buffer(size);
        this.buffer.copy(result, 0, this.readIndex, this.readIndex + size);
        this.readIndex += size;
        return result;
    }

}
