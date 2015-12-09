var Long = require("long");

var BufferWrapper = function (buffer) {
    this.buffer = buffer;
    // Actual message body starts here
    this.cursor = 18;
};

BufferWrapper.prototype.readUInt8 = function () {
    var value = this.buffer.readUInt8(this.cursor);
    this.cursor += 1;
    return value;
};

BufferWrapper.prototype.readLong = function () {
    var low = this.buffer.readInt32LE(this.cursor);
    var high = this.buffer.readInt32LE(this.cursor + 4);
    var value = new Long(low, high);
    this.cursor += 8;
    return value;
};

BufferWrapper.prototype.readAddress = function () {
    var hostLength = this.buffer.readInt32LE(this.cursor);
    this.cursor += 4;
    var host = this.buffer.toString("utf8", this.cursor, this.cursor + hostLength);
    this.cursor += hostLength;

    var port = this.buffer.readInt32LE(this.cursor);
    this.cursor += 4;

    return {"host": host, "port": port};
};

BufferWrapper.prototype.readBoolean = function () {
    var value = this.buffer.readUInt8(this.cursor) == 1;
    this.cursor += 1;
    return value;
};

BufferWrapper.prototype.readUTF = function () {
    var length = this.buffer.readInt32LE(this.cursor);
    this.cursor += 4;
    var value = this.buffer.toString("utf8", this.cursor, this.cursor + length);
    this.cursor += length;
    return value;
};

module.exports = BufferWrapper;

