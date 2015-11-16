var net = require('net');
// Node does not support 64-bit integers natively, so we have to use this 3rd party package
var Long = require('long')
var murmur = require('./murmur')

var FRAME_LENGTH_OFFSET = 0;
var VERSION_OFFSET = FRAME_LENGTH_OFFSET + 4;
var FLAGS_OFFSET = VERSION_OFFSET + 1;
var TYPE_OFFSET = FLAGS_OFFSET + 1;
var CORRELATION_ID_OFFSET = TYPE_OFFSET + 2;
var PARTITION_ID_OFFSET = CORRELATION_ID_OFFSET + 4;
var DATA_OFFSET_OFFSET = PARTITION_ID_OFFSET + 4;
var BODY_OFFSET = DATA_OFFSET_OFFSET + 2;

var USERNAME = "NodeJS";
var PASSWORD = "LetMeIn";

var correlationCounter = 0;

var OPERATION_TYPES = {
    AUTH: {
        CODE: 0x2,
        LAYOUT: [
            {"field": "username", "type": "string", "nullable": false},
            {"field": "password", "type": "string", "nullable": false},
            {"field": "uuid", "type": "string", "nullable": true},
            {"field": "ownerUuid", "type": "string", "nullable": true},
            {"field": "isOwnerConnection", "type": "boolean", "nullable": false},
            {"field": "clientType", "type": "string", "nullable": false},
            {"field": "serializationVersion", "type": "uint8", "nullable": false},
        ]
    },
    ATOMIC_LONG: {
        ADD_AND_GET: {
            CODE: 0x0a05,
            LAYOUT: [
                {"field": "name", "type": "string", "nullable": false},
                {"field": "delta", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        }
    }
}

function invokeOperation(client, operationType, parameters) {
  var operationCode = operationType.CODE;

  var version = 0x01;
  var flags = 0xc0;
  var correlationId = correlationCounter++;

  var layout = operationType.LAYOUT;

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

  var partitionKeyField = operationType.PARTITION_KEY_FIELD;

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
  buffer.writeUInt16LE(operationType.CODE, TYPE_OFFSET)
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



  client.write(buffer)
}

function authenticate (username, password) {
    invokeOperation(client, OPERATION_TYPES.AUTH, {
        "username": username,
        "password": password,
        "uuid": null,
        "ownerUuid": null,
        "isOwnerConnection": true,
        "clientType": "node",
        "serializationVersion": 1
    })
}

var client = net.connect({port: 5701}, function() {
  console.log('Connection established');

  // Send the protocol version
  var buffer = new Buffer(3)
  buffer.write("CB2")
  client.write(buffer);

  // Send auth message
  authenticate(USERNAME, PASSWORD)
});

client.on('data', function(buffer) {
  var correlationId = buffer.readUInt32LE(CORRELATION_ID_OFFSET);
  console.log("Received a response with correlation ID: " + correlationId + " and type " + buffer.readUInt16LE(TYPE_OFFSET));
  console.log(buffer.toString())
});


client.on('end', function() {
  console.log('Connection closed');
});



