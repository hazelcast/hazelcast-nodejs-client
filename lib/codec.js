// Node does not support 64-bit integers natively, so we have to use this 3rd party package
var Long = require('long')
var responseLayouts = require("./layouts").responses

var FRAME_LENGTH_OFFSET = 0;
var VERSION_OFFSET = FRAME_LENGTH_OFFSET + 4;
var FLAGS_OFFSET = VERSION_OFFSET + 1;
var TYPE_OFFSET = FLAGS_OFFSET + 1;
var CORRELATION_ID_OFFSET = TYPE_OFFSET + 2;
var PARTITION_ID_OFFSET = CORRELATION_ID_OFFSET + 4;
var DATA_OFFSET_OFFSET = PARTITION_ID_OFFSET + 4;
var BODY_OFFSET = DATA_OFFSET_OFFSET + 2;

var encodePayload = function (operation, parameters, correlationId) {
  var operationCode = operation.CODE;

  var version = 0x01;
  var flags = 0xc0;


  var layout = operation.LAYOUT;

  var currentOffset = BODY_OFFSET;
  var dataMap = [];

  // Unfortunately, Node.js binary buffers are not resizable, so we have to calculate
  // the right buffer size from the start. To make things easier we will remember offsets and other data
  for (var i = 0; i < layout.length; i++) {
    var current = layout[i];

    var fieldName = current.field;
    var fieldType = current.type;
    var nullable = current.nullable;
    var fieldValue = parameters[fieldName];

    if (!fieldValue && !nullable) {
        throw "Parameter " + fieldName + " for operation " + operationCode + " is missing";
    }

    var fieldLength = 0;
    if (fieldValue != null) {
        if (fieldType == "string") {
            fieldLength = fieldValue.length;
        } else if (fieldType == "boolean" || fieldType == "uint8") {
            fieldLength = 1;
        } else if (fieldType == "int64") {
            fieldLength = 8;
        } else {
            throw "Unknown field type " + fieldType + " for field " + fieldName + " in operation " + operationCode
        }
    }

    var data = {
        "value" : fieldValue,
        "nullable" : nullable,
        "length": fieldLength,
        "offset" : currentOffset,
        "type" : fieldType
    };

    dataMap.push(data);

    //Nullable values are preceded by a single byte indicating whether the field is null
    if (nullable) {
        currentOffset += 1;
    }

    if (fieldValue != null && fieldType == "string") {
        // Non null string values are preceded by a integer indicating a length of the string
        currentOffset += 4;
    }

    currentOffset += fieldLength;
  }

  // Some operations do not require partition ID
  var partitionId = -1;

  var partitionKeyField = operation.PARTITION_KEY_FIELD;

  if (partitionKeyField) {
    var partitionKey = parameters[partitionKeyField]
    var pkLength = partitionKey.length;
    var pkBuffer = new Buffer(4 + pkLength,'binary');
    pkBuffer.writeInt32BE(pkLength);
    pkBuffer.write(partitionKey, 4)
    var hash = murmur(pkBuffer);

    // TODO: Fetch number of partitions
    partitionId = Math.abs(hash) % 271
    console.log("Partition ID is " + partitionId)
  }

  var buffer = new Buffer(currentOffset);

  buffer.writeInt32LE(currentOffset);
  buffer.writeUInt8(version, VERSION_OFFSET)
  buffer.writeUInt8(flags, FLAGS_OFFSET)
  buffer.writeUInt16LE(operation.CODE, TYPE_OFFSET)
  buffer.writeUInt32LE(correlationId, CORRELATION_ID_OFFSET)
  buffer.writeInt32LE(partitionId, PARTITION_ID_OFFSET)
  buffer.writeUInt16LE(BODY_OFFSET, DATA_OFFSET_OFFSET)

  for (var i = 0; i < dataMap.length; i++) {
    var data = dataMap[i];
    var offset = data.offset;
    var value = data.value;
    var fieldType = data.type

    if (data.nullable) {
        buffer.writeUInt8(value == null ? 1 : 0, offset);
        offset += 1;
    }

    if (value != null) {
        if (fieldType == "string") {
            buffer.writeInt32LE(data.length, offset);
            offset += 4;
            buffer.write(value, offset);
        } else if (fieldType == "boolean") {
            buffer.writeUInt8(value ? 1 : 0, offset);
        } else if (fieldType == "uint8") {
            buffer.writeUInt8(value, offset);
        } else if (fieldType == "int64") {
            if (!Long.isLong(value)) {
                value = Long.fromValue(value);
            }

            buffer.writeInt32LE(value.low, offset)
            buffer.writeInt32LE(value.high, offset + 4)
        }
    }
  }
  return buffer;
}

var decodePayload = function (buffer) {
    var correlationId = buffer.readUInt32LE(CORRELATION_ID_OFFSET);
    var type = buffer.readUInt16LE(TYPE_OFFSET);
    var position = BODY_OFFSET;

    var layout = responseLayouts[type]

    if (!layout) {
        throw "Unknown response type " + type
    }

    var data = {};

    for (var i = 0; i < layout.length; i++) {
        var current = layout[i];
        var nullable = current.nullable;
        var type = current.type;
        var name = current.field;

        if (nullable) {
            var isNull = buffer.readUInt8(position) == 1;
            position += 1;
            if (isNull) {
                data[name] = null;
                continue;
            }
        }

        var value;

        if (type == "string") {
            var length = buffer.readInt32LE(position);
            position += 4;
            value = buffer.toString("utf8", position, position + length);
            position += length;
        } else if (type == "boolean") {
            value = buffer.readUInt8(position);
            position += 1;
        } else if (type == "address") {
            var hostLength = buffer.readInt32LE(position);
            position += 4;
            var host = buffer.toString("utf8", position, position + hostLength);
            position += hostLength;

            var port = buffer.readInt32LE(position);
            position += 4;

            value = {"host": host, "port": port}
        } else if (type == "uint8") {
            value = buffer.readUInt8(position)
            position += 1;
        }

        data[name] = value;
    }

    return {
        correlationId: correlationId,
        data: data
    }
}

module.exports = {
    encodePayload: encodePayload,
    decodePayload: decodePayload
}