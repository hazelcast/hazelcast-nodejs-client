// Node does not support 64-bit integers natively, so we have to use this 3rd party package
var Long = require('long');
var responseLayouts = require("./layouts").responses;
var murmur = require("./murmur");
var _ = require("lodash");
var BufferWrapper = require("./BufferWrapper");

var FRAME_LENGTH_OFFSET = 0;
var VERSION_OFFSET = FRAME_LENGTH_OFFSET + 4;
var FLAGS_OFFSET = VERSION_OFFSET + 1;
var TYPE_OFFSET = FLAGS_OFFSET + 1;
var CORRELATION_ID_OFFSET = TYPE_OFFSET + 2;
var PARTITION_ID_OFFSET = CORRELATION_ID_OFFSET + 4;
var DATA_OFFSET_OFFSET = PARTITION_ID_OFFSET + 4;
var BODY_OFFSET = DATA_OFFSET_OFFSET + 2;

function calculateBufferSize(layout, parameters) {
    var size = BODY_OFFSET;

    // Unfortunately, Node.js binary buffers are not resizable, so we have to calculate
    // the right buffer size from the start. To make things easier we will remember offsets and other data

    _.forEach(layout, function (field) {
        var fieldName = field.name;
        var fieldType = field.type;
        var nullable = field.nullable;
        var fieldValue = parameters[fieldName];

        var fieldLength = 0;
        if (fieldValue != null) {
            if (fieldType == "string") {
                fieldLength = fieldValue.length;
            } else if (fieldType == "boolean" || fieldType == "uint8") {
                fieldLength = 1;
            } else if (fieldType == "int64") {
                fieldLength = 8;
            }
        }

        //Nullable values are preceded by a single byte indicating whether the field is null
        if (nullable) {
            size += 1;
        }

        if (fieldValue != null && fieldType == "string") {
            // Non null string values are preceded by a integer indicating a length of the string
            size += 4;
        }

        size += fieldLength;

    });

    return size;
}


function validateParameters(layout, parameters, operationCode) {
    _.forEach(layout, function (field) {
        var fieldName = field.name;
        var fieldType = field.type;
        var nullable = field.nullable;
        var fieldValue = parameters[fieldName];

        if (_.isUndefined(fieldValue)) {
            throw "Parameter " + fieldName + " for operation " + operationCode + " is missing. Use null if needed.";
        }

        if (_.isNull(fieldValue) && !nullable) {
            throw "Parameter " + fieldName + " for operation " + operationCode + " must not be null";
        }

        var acceptableTypes = ["string", "boolean", "uint8", "int64"];
        if (!_.includes(acceptableTypes, fieldType)) {
            throw "Unknown field type " + fieldType + " for field " + fieldName + " in operation " + operationCode;
        }
    });

}
function calculatePartitionId(operation, parameters) {
// Some operations do not require partition ID
    var partitionId = -1;

    var partitionKeyField = operation.PARTITION_KEY_FIELD;

    if (partitionKeyField) {
        var partitionKey = parameters[partitionKeyField];
        var pkLength = partitionKey.length;
        var pkBuffer = new Buffer(4 + pkLength, 'binary');
        pkBuffer.writeInt32BE(pkLength);
        pkBuffer.write(partitionKey, 4);
        var hash = murmur(pkBuffer);

        // TODO: Fetch number of partitions
        partitionId = Math.abs(hash) % 271
    }
    return partitionId;
}
var encodePayload = function (operation, parameters, correlationId) {
    var operationCode = operation.CODE;
    var version = 0x01;
    var flags = 0xc0;

    var layout = operation.LAYOUT;

    validateParameters(layout, parameters, operationCode);

    var bufferSize = calculateBufferSize(layout, parameters);

    var partitionId = calculatePartitionId(operation, parameters);

    var buffer = new Buffer(bufferSize);

    buffer.writeInt32LE(bufferSize);
    buffer.writeUInt8(version, VERSION_OFFSET);
    buffer.writeUInt8(flags, FLAGS_OFFSET);
    buffer.writeUInt16LE(operation.CODE, TYPE_OFFSET);
    buffer.writeUInt32LE(correlationId, CORRELATION_ID_OFFSET);
    buffer.writeInt32LE(partitionId, PARTITION_ID_OFFSET);
    buffer.writeUInt16LE(BODY_OFFSET, DATA_OFFSET_OFFSET);

    var wrapper = new BufferWrapper(buffer);

    _.forEach(layout, function (field) {
        var value = parameters[field.name];
        var fieldType = field.type;

        if (field.nullable) {
            wrapper.writeBoolean(value == null)
        }

        if (value != null) {
            if (fieldType == "string") {
                wrapper.writeUTF(value);
            } else if (fieldType == "boolean") {
                wrapper.writeBoolean(value);
            } else if (fieldType == "uint8") {
                wrapper.writeUInt8(value);
            } else if (fieldType == "int64") {
                wrapper.writeLong(value);
            }
        }

    });

    return buffer;
};

var decodePayload = function (buffer) {
    var correlationId = buffer.readUInt32LE(CORRELATION_ID_OFFSET);
    var type = buffer.readUInt16LE(TYPE_OFFSET);

    var layout = responseLayouts[type];

    if (!layout) {
        throw "Unknown response type " + type
    }

    var data;

    if (layout.length == 0) {
        data = null;
    } else {
        data = parseData(layout, buffer)
    }

    return {
        correlationId: correlationId,
        data: data
    }
};

var parseData = function (layout, buffer) {
    var data = {};
    var wrapper = new BufferWrapper(buffer);

    _.forEach(layout, function (field) {
        data[field.name] = readField(wrapper, field);
    });

    // Unwrap single item
    if (Object.keys(data).length == 1 && data["value"]) {
        return data["value"];
    }

    return data;
};

var readField = function (wrapper, field) {
    var nullable = field.nullable;
    var type = field.type;

    if (nullable) {
        var isNull = wrapper.readBoolean();
        if (isNull) {
            return null;
        }
    }

    if (type == "string") {
        return wrapper.readUTF();
    } else if (type == "boolean") {
        return wrapper.readBoolean();
    } else if (type == "address") {
        return wrapper.readAddress();
    } else if (type == "uint8") {
        return wrapper.readUInt8();
    } else if (type == "int64") {
        return wrapper.readLong();
    }
};

module.exports = {
    encodePayload: encodePayload,
    decodePayload: decodePayload
};