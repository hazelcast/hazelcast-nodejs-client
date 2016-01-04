///<reference path="../typings/node/node.d.ts" />
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

var Long = require('long');
var Bits = require('bits');

class ClientMessage {
    buffer:Buffer;
    write_index:number;
    read_index:number;

    constructor(payload_size:number) {
        this.buffer = new Buffer(payload_size);
        this.buffer.fill(0, 0, Bits.HEADER_SIZE + payload_size);
        this.setDataOffset(Bits.HEADER_SIZE);
        this.setVersion(Bits.VERSION);
        this.write_index = 0;
        this.read_index = 0;
    }

    getCorrelationId():number {
        return this.buffer.readUInt32LE(Bits.CORRELATION_ID_FIELD_OFFSET);
    }

    setCorrelationId(val:number) {
        this.buffer.writeUInt32LE(val, Bits.CORRELATION_ID_FIELD_OFFSET);
    }

    getPartitionId():number {
        return this.buffer.readInt32LE(Bits.PARTITION_ID_FIELD_OFFSET);
    }

    setPartitionId(val:number) {
        this.buffer.writeInt32LE(val, Bits.PARTITION_ID_FIELD_OFFSET);
    }

    setVersion(val:number) {
        this.buffer.writeUInt8(val, Bits.VERSION_FIELD_OFFSET);
    }

    getMessageType():number {
        return this.buffer.readUInt16LE(Bits.TYPE_FIELD_OFFSET);
    }

    setMessageType(val:number) {
        this.buffer.writeUInt16LE(val, Bits.TYPE_FIELD_OFFSET);
    }

    getFlags():number {
        return this.buffer.readUInt8(Bits.FLAGS_FIELD_OFFSET);
    }

    setFlags(val:number) {
        this.buffer.writeUInt8(val, Bits.FLAGS_FIELD_OFFSET);
    }

    hasFlags(flags:number):number {
        return this.getFlags() & flags;
    }

    getFrameLength():number {
        return this.buffer.readInt32LE(Bits.FRAME_LENGTH_FIELD_OFFSET);
    }

    setFrameLength(val:number) {
        this.buffer.writeInt32LE(val, Bits.FRAME_LENGTH_FIELD_OFFSET);
    }

    getDataOffset():number {
        return this.buffer.readInt16LE(Bits.DATA_OFFSET_FIELD_OFFSET);
    }

    setDataOffset(val:number) {
        this.buffer.writeInt16LE(val, Bits.DATA_OFFSET_FIELD_OFFSET);
    }

    getWriteOffset():number {
        return this.getDataOffset() + this.write_index;
    }

    getReadOffset():number {
        return this.getDataOffset() + this.read_index;
    }

// PAYLOAD


    appendByte(val:number) {
        this.buffer.writeUInt8(val, this.getWriteOffset());
        this.write_index += Bits.BYTE_SIZE_IN_BYTES;
    }

    appendBool(val:boolean) {
        return this.appendByte(val ? 1 : 0);
    }

    appendInt(val:number) {
        this.buffer.writeInt32LE(val, this.getWriteOffset());
        this.write_index += Bits.INT_SIZE_IN_BYTES;
    }

    appendLong(value:any) {
        if (!Long.isLong(value)) {
            value = Long.fromValue(value);
        }

        this.buffer.writeInt32LE(value.low, this.getWriteOffset());
        this.buffer.writeInt32LE(value.high, this.getWriteOffset() + 4);
        this.write_index += Bits.LONG_SIZE_IN_BYTES;
    }

    appendStr(value:string) {
        var length = value.length;
        this.buffer.writeInt32LE(length, this.getWriteOffset());
        this.write_index += 4;
        this.buffer.write(value, this.getWriteOffset());
        this.write_index += length;
    }

    addFlag(value:number) {
        this.buffer.writeUInt8(value | this.getFlags(), Bits.FLAGS_FIELD_OFFSET);
    }

    updateFrameLength() {
        this.setFrameLength(this.getWriteOffset());
    }


    appendData(val:any) {
        this.appendByteArray(val.to_bytes());
    }

    appendByteArray(arr:any) {
        length = arr.length;
        this.appendInt(length);
        this.buffer.write(arr);
        this.write_index += length;
    }

    //# PAYLOAD READ

    readByte():number {
        var val:number;
        val = this.buffer.readUInt8(this.read_index);
        this.read_index += Bits.BYTE_SIZE_IN_BYTES;
        return val;
    }

    readBool():boolean {
        return this.readByte() == 1 ? true : false;
    }

    readInt():number {
        var val:number;
        val = this.buffer.readIntLE(this.read_index, Bits.INT_SIZE_IN_BYTES);
        this.read_index += Bits.INT_SIZE_IN_BYTES;
        return val;
    }

    readLong() {
        var low = this.buffer.readInt32LE(this.read_index);
        var high = this.buffer.readInt32LE(this.read_index + 4);
        var value = new Long(low, high);
        this.read_index += Bits.LONG_SIZE_IN_BYTES;
        return value;
    }

    readStr():string {
        var length = this.buffer.readInt32LE(this.read_index);
        this.read_index += Bits.INT_SIZE_IN_BYTES;
        var value = this.buffer.toString("utf8", this.read_index, this.read_index + length);
        this.read_index += length;
        return value;
    }

    readByteArray() {
        var size = this.buffer.readUInt32LE(this.read_index);
        this.read_index += Bits.INT_SIZE_IN_BYTES;
        var result = new Buffer(size);
        this.buffer.copy(result, 0, this.read_index, this.read_index + size);
        this.read_index += size;
        return result;
    }

}
