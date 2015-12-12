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
 +---------------------------------------------------------------+
 |                        PartitionId                            |
 +-----------------------------+---------------------------------+
 |        Data Offset          |                                 |
 +-----------------------------+                                 |
 |                      Message Payload Data                    ...
 |                                                              ...

 */
var Long = require("long");
var BYTE_SIZE_IN_BYTES = 1
var BOOLEAN_SIZE_IN_BYTES = 1
var SHORT_SIZE_IN_BYTES = 2
var CHAR_SIZE_IN_BYTES = 2
var INT_SIZE_IN_BYTES = 4
var FLOAT_SIZE_IN_BYTES = 4
var LONG_SIZE_IN_BYTES = 8
var DOUBLE_SIZE_IN_BYTES = 8


var BIG_ENDIAN = 2
var LITTLE_ENDIAN = 1

var VERSION = 1
var BEGIN_FLAG = 0x80
var END_FLAG = 0x40
var BEGIN_END_FLAG = BEGIN_FLAG | END_FLAG
var LISTENER_FLAG = 0x01

var PAYLOAD_OFFSET = 18
var SIZE_OFFSET = 0

var FRAME_LENGTH_FIELD_OFFSET = 0
var VERSION_FIELD_OFFSET = FRAME_LENGTH_FIELD_OFFSET + INT_SIZE_IN_BYTES
var FLAGS_FIELD_OFFSET = VERSION_FIELD_OFFSET + BYTE_SIZE_IN_BYTES
var TYPE_FIELD_OFFSET = FLAGS_FIELD_OFFSET + BYTE_SIZE_IN_BYTES
var CORRELATION_ID_FIELD_OFFSET = TYPE_FIELD_OFFSET + SHORT_SIZE_IN_BYTES
var PARTITION_ID_FIELD_OFFSET = CORRELATION_ID_FIELD_OFFSET + INT_SIZE_IN_BYTES
var DATA_OFFSET_FIELD_OFFSET = PARTITION_ID_FIELD_OFFSET + INT_SIZE_IN_BYTES
var HEADER_SIZE = DATA_OFFSET_FIELD_OFFSET + SHORT_SIZE_IN_BYTES
var buffer;
var ClientMessage = function (payload_size) {
    console.warn(payload_size);
    this.buffer = new Buffer(HEADER_SIZE + payload_size);
    this.buffer.fill(0, 0, HEADER_SIZE + payload_size);
    this.set_data_offset(HEADER_SIZE);
    this.set_version(VERSION);
    this.write_index = 0;
    this.read_index = 0;
};

ClientMessage.prototype.get_correlation_id = function () {
    return this.buffer.readUInt32LE(CORRELATION_ID_FIELD_OFFSET);
};

ClientMessage.prototype.set_correlation_id = function (val) {
    this.buffer.writeUInt32LE(val, CORRELATION_ID_FIELD_OFFSET);
    return this;
};

ClientMessage.prototype.get_partition_id = function () {
    return this.buffer.readInt32LE(val, PARTITION_ID_FIELD_OFFSET);
};


ClientMessage.prototype.set_partition_id = function (val) {
    this.buffer.writeInt32LE(val, PARTITION_ID_FIELD_OFFSET);
    return this;
};

ClientMessage.prototype.set_version = function (val) {
    this.buffer.writeUInt8(val, VERSION_FIELD_OFFSET);
    return this;
}


ClientMessage.prototype.get_message_type = function () {
    return this.buffer.readUInt16LE(TYPE_FIELD_OFFSET);
};

ClientMessage.prototype.set_message_type = function (val) {
    this.buffer.writeUInt16LE(val, TYPE_FIELD_OFFSET)
    return this;
};

ClientMessage.prototype.get_flags = function () {
    return this.buffer.readUInt8(FLAGS_FIELD_OFFSET);
};

ClientMessage.prototype.set_flags = function (val) {
    this.buffer.writeUInt8(val, FLAGS_FIELD_OFFSET);
};

ClientMessage.prototype.has_flags = function (flags) {
    return this.get_flags() & flags;
};

ClientMessage.prototype.get_frame_length = function () {
    return this.buffer.readInt32LE(FRAME_LENGTH_FIELD_OFFSET);
}

ClientMessage.prototype.set_frame_lenght = function (val) {
    this.buffer.writeInt32LE(val, FRAME_LENGTH_FIELD_OFFSET);
    return this;
}


ClientMessage.prototype.get_data_offset = function () {
    return this.buffer.readInt16LE(DATA_OFFSET_FIELD_OFFSET);
}


ClientMessage.prototype.set_data_offset = function (val) {
    this.buffer.writeInt16LE(val, DATA_OFFSET_FIELD_OFFSET);
    return this;
}

ClientMessage.prototype.write_offset = function () {
    return this.get_data_offset() + this.write_index;
}

ClientMessage.prototype.read_offset = function () {
    this.get_data_offset() + this.read_index;
}

// PAYLOAD


ClientMessage.prototype.append_byte = function (val) {
    this.buffer.writeUInt8(val, this.write_offset());
    this.write_index += BYTE_SIZE_IN_BYTES;
    return this;
}

ClientMessage.prototype.append_bool = function (val) {
    return this.append_byte(val ? 1 : 0)
}

ClientMessage.prototype.append_int = function (val) {
    this.buffer.writeInt32LE(val, this.write_offset());
    this.write_index += INT_SIZE_IN_BYTES;
    return this;
}

ClientMessage.prototype.append_long = function (value) {
    if (!Long.isLong(value)) {
        value = Long.fromValue(value);
    }

    this.buffer.writeInt32LE(value.low, this.write_offset());
    this.buffer.writeInt32LE(value.high, this.write_offset() + 4);
    this.write_index += LONG_SIZE_IN_BYTES;
    return this;
}

ClientMessage.prototype.append_str = function (value) {
    var length = value.length;
    this.buffer.writeInt32LE(length, this.write_offset());
    this.write_index += 4;
    this.buffer.write(value, this.write_offset());
    this.write_index += length;

}

ClientMessage.prototype.update_frame_length = function () {
    this.set_frame_lenght(this.write_offset())
}
//def update_frame_length(self):
//self.set_frame_length(self._write_offset())
//return self

//def append_str(self, val):
//self.append_byte_array(val.encode("utf-8"))
//return self
//
//def append_data(self, val):
//self.append_byte_array(val.to_bytes())
//return self
//
//def append_byte_array(self, arr):
//length = len(arr)
//# length
//self.append_int(length)
//# copy content
//copy_bytes_into(arr, self.buffer, self._write_offset(), length)
//self._write_index += length
//
//# PAYLOAD READ
//def _read_from_buff(self, fmt, size):
//val = struct.unpack_from(fmt, self.buffer, self._read_offset())
//self._read_index += size
//return val[0]
//
//def read_byte(self):
//return self._read_from_buff(FMT_LE_UINT8, BYTE_SIZE_IN_BYTES)
//
//def read_bool(self):
//return True if self.read_byte() else False
//
//def read_int(self):
//return self._read_from_buff(FMT_LE_INT, INT_SIZE_IN_BYTES)
//
//def read_long(self):
//return self._read_from_buff(FMT_LE_LONG, LONG_SIZE_IN_BYTES)
//
//def read_str(self):
//return self.read_byte_array().decode("utf-8")
//
//def read_data(self):
//return Data(self.read_byte_array())
//
//def read_byte_array(self):
//length = self.read_int()
//result = self.buffer[self._read_offset(): self._read_offset() + length]
//self._read_index += length
//return result
module.exports = {
    "create": function (options) {
        return new ClientMessage(options);
    },
    INT_SIZE_IN_BYTES: INT_SIZE_IN_BYTES,
    BOOLEAN_SIZE_IN_BYTES: BOOLEAN_SIZE_IN_BYTES,
    BYTE_SIZE_IN_BYTES: BYTE_SIZE_IN_BYTES
};
exports.buffer = buffer;