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

    private buffer: Buffer;
    private cursor: number = BitsUtil.HEADER_SIZE;

    public static newClientMessage(payloadSize: number): ClientMessage {
        var totalSize = BitsUtil.HEADER_SIZE + payloadSize;
        var buffer = new Buffer(totalSize);
        buffer.fill(0, 0, totalSize);
        var message = new ClientMessage(buffer);
        message.setDataOffset(BitsUtil.HEADER_SIZE);
        message.setVersion(BitsUtil.VERSION);
        message.setFrameLength(totalSize);
        message.setFlags(0xc0);
        message.setPartitionId(-1);
        return message;
    }

    constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    getBuffer(): Buffer {
        return this.buffer;
    }

    getCorrelationId(): number {
        return this.buffer.readUInt32LE(BitsUtil.CORRELATION_ID_FIELD_OFFSET);
    }

    setCorrelationId(value: number) {
        this.buffer.writeUInt32LE(value, BitsUtil.CORRELATION_ID_FIELD_OFFSET);
    }

    getPartitionId(): number {
        return this.buffer.readInt32LE(BitsUtil.PARTITION_ID_FIELD_OFFSET);
    }

    setPartitionId(value: number) {
        this.buffer.writeInt32LE(value, BitsUtil.PARTITION_ID_FIELD_OFFSET);
    }

    setVersion(value: number) {
        this.buffer.writeUInt8(value, BitsUtil.VERSION_FIELD_OFFSET);
    }

    getMessageType(): number {
        return this.buffer.readUInt16LE(BitsUtil.TYPE_FIELD_OFFSET);
    }

    setMessageType(value: number) {
        this.buffer.writeUInt16LE(value, BitsUtil.TYPE_FIELD_OFFSET);
    }

    getFlags(): number {
        return this.buffer.readUInt8(BitsUtil.FLAGS_FIELD_OFFSET);
    }

    setFlags(value: number) {
        this.buffer.writeUInt8(value, BitsUtil.FLAGS_FIELD_OFFSET);
    }

    hasFlags(flags: number): number {
        return this.getFlags() & flags;
    }

    getFrameLength(): number {
        return this.buffer.readInt32LE(BitsUtil.FRAME_LENGTH_FIELD_OFFSET);
    }

    setFrameLength(value: number) {
        this.buffer.writeInt32LE(value, BitsUtil.FRAME_LENGTH_FIELD_OFFSET);
    }

    getDataOffset(): number {
        return this.buffer.readInt16LE(BitsUtil.DATA_OFFSET_FIELD_OFFSET);
    }

    setDataOffset(value: number) {
        this.buffer.writeInt16LE(value, BitsUtil.DATA_OFFSET_FIELD_OFFSET);
    }

    appendByte(value: number) {
        this.buffer.writeUInt8(value, this.cursor);
        this.cursor += BitsUtil.BYTE_SIZE_IN_BYTES;
    }

    appendBoolean(value: boolean) {
        return this.appendByte(value ? 1 : 0);
    }

    appendInt32(value: number) {
        this.buffer.writeInt32LE(value, this.cursor);
        this.cursor += BitsUtil.INT_SIZE_IN_BYTES;
    }

    appendUint8(value: number) {
        this.buffer.writeUInt8(value, this.cursor);
        this.cursor += BitsUtil.BYTE_SIZE_IN_BYTES;
    }

    appendLong(value: any) {
        if (!Long.isLong(value)) {
            value = Long.fromValue(value);
        }

        this.buffer.writeInt32LE(value.low, this.cursor);
        this.buffer.writeInt32LE(value.high, this.cursor + 4);
        this.cursor += BitsUtil.LONG_SIZE_IN_BYTES;
    }

    appendString(value: string) {
        var length = value.length;
        this.buffer.writeInt32LE(length, this.cursor);
        this.cursor += 4;
        this.buffer.write(value, this.cursor);
        this.cursor += length;
    }

    appendByteArray(buffer: Buffer) {
        var length = buffer.length;
        this.appendInt32(length);
        buffer.copy(this.buffer, this.cursor);
        this.cursor += length;
    }

    addFlag(value: number) {
        this.buffer.writeUInt8(value | this.getFlags(), BitsUtil.FLAGS_FIELD_OFFSET);
    }

    updateFrameLength() {
        this.setFrameLength(this.cursor);
    }

    readByte(): number {
        var value = this.buffer.readUInt8(this.cursor);
        this.cursor += BitsUtil.BYTE_SIZE_IN_BYTES;
        return value;
    }

    readBoolean(): boolean {
        return this.readByte() === 1;
    }

    readUInt8(): number {
        var value = this.buffer.readUInt8(this.cursor);
        this.cursor += BitsUtil.BYTE_SIZE_IN_BYTES;
        return value;
    }

    readInt32(): number {
        var value = this.buffer.readInt32LE(this.cursor);
        this.cursor += BitsUtil.INT_SIZE_IN_BYTES;
        return value;
    }

    readLong(): Long {
        var low = this.buffer.readInt32LE(this.cursor);
        var high = this.buffer.readInt32LE(this.cursor + 4);
        var value = new Long(low, high);
        this.cursor += BitsUtil.LONG_SIZE_IN_BYTES;
        return value;
    }

    readString(): string {
        var length = this.buffer.readInt32LE(this.cursor);
        this.cursor += BitsUtil.INT_SIZE_IN_BYTES;
        var value = this.buffer.toString('utf8', this.cursor, this.cursor + length);
        this.cursor += length;
        return value;
    }

    readByteArray(): Buffer {
        var size = this.buffer.readUInt32LE(this.cursor);
        this.cursor += BitsUtil.INT_SIZE_IN_BYTES;
        var result = new Buffer(size);
        this.buffer.copy(result, 0, this.cursor, this.cursor + size);
        this.cursor += size;
        return result;
    }

}

export = ClientMessage
