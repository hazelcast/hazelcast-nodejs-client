var operations = {
    AUTH: {
        CODE: 0x2,
        LAYOUT: [
            {"name": "username", "type": "string", "nullable": false},
            {"name": "password", "type": "string", "nullable": false},
            {"name": "uuid", "type": "string", "nullable": true},
            {"name": "ownerUuid", "type": "string", "nullable": true},
            {"name": "isOwnerConnection", "type": "boolean", "nullable": false},
            {"name": "clientType", "type": "string", "nullable": false},
            {"name": "serializationVersion", "type": "uint8", "nullable": false}
        ]
    },
    ATOMIC_LONG: {
        ADD_AND_GET: {
            CODE: 0x0a05,
            LAYOUT: [
                {"name": "name", "type": "string", "nullable": false},
                {"name": "delta", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        COMPARE_AND_SET: {
            CODE: 0x0a06,
            LAYOUT: [
                {"name": "name", "type": "string", "nullable": false},
                {"name": "expected", "type": "int64", "nullable": false},
                {"name": "newValue", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        DECREMENT_AND_GET: {
            CODE: 0x0a07,
            LAYOUT: [
                {"name": "name", "type": "string", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        GET: {
            CODE: 0x0a08,
            LAYOUT: [
                {"name": "name", "type": "string", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        GET_AND_ADD: {
            CODE: 0x0a09,
            LAYOUT: [
                {"name": "name", "type": "string", "nullable": false},
                {"name": "delta", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        GET_AND_SET: {
            CODE: 0x0a0a,
            LAYOUT: [
                {"name": "name", "type": "string", "nullable": false},
                {"name": "newValue", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        INCREMENT_AND_GET: {
            CODE: 0x0a0b,
            LAYOUT: [
                {"name": "name", "type": "string", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        GET_AND_INCREMENT: {
            CODE: 0x0a0c,
            LAYOUT: [
                {"name": "name", "type": "string", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        SET: {
            CODE: 0x0a0d,
            LAYOUT: [
                {"name": "name", "type": "string", "nullable": false},
                {"name": "newValue", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        }
    },
    MAP: {
       PUT: {
           CODE: 0x0101,
           LAYOUT: [
               {"name": "mapName", "type": "string", "nullable": false},
               {"name": "key", "type": "bytes", "nullable": false},
               {"name": "value", "type": "bytes", "nullable": false},
               {"name": "threadId", "type": "int64", "nullable": false},
               {"name": "timeToLive", "type": "int64", "nullable": false}
           ],
           PARTITION_KEY_FIELD: "key"
       },
       GET: {
           CODE: 0x0102,
           LAYOUT: [
               {"name": "mapName", "type": "string", "nullable": false},
               {"name": "key", "type": "bytes", "nullable": false},
               {"name": "threadId", "type": "int64", "nullable": false}
           ],
           PARTITION_KEY_FIELD: "key"
       },
       REMOVE: {
           CODE: 0x0103,
           LAYOUT: [
               {"name": "mapName", "type": "string", "nullable": false},
               {"name": "key", "type": "bytes", "nullable": false},
               {"name": "threadId", "type": "int64", "nullable": false}
           ],
           PARTITION_KEY_FIELD: "key"
       }
    }
};

var responses = {
    // Atomic Long Set
    100: [],
    // Atomic Long Compare And Set
    101: [
        {"name": "value", "type": "boolean", "nullable": false}
    ],
    // Atomic Long: AddAndGet, DecrementAndGet, Get, GetAndAdd, GetAndSet
    103: [
        {"name": "value", "type": "int64", "nullable": false}
    ],
    // Map: Put, Get, Remove
    105: [
        {"name": "value", "type": "bytes", "nullable": true}
    ],
    //Auth response
    107: [
        {"name": "status", "type": "uint8", "nullable": false},
        {"name": "address", "type": "address", "nullable": true},
        {"name": "uuid", "type": "string", "nullable": true},
        {"name": "ownerUuid", "type": "string", "nullable": true},
        {"name": "serializationVersion", "type": "uint8", "nullable": false}
    ],
    // Exception
    109: [
        {"name": "errorCode", "type": "int32", "nullable": false},
        {"name": "className", "type": "string", "nullable": false},
        {"name": "message", "type": "string", "nullable": true},
        {"name": "stackTrace", "type": "stackTrace", "nullable": false},
        {"name": "causeCode", "type": "int32", "nullable": false},
        {"name": "causeClassName", "type": "string", "nullable": true}
    ]
};


module.exports = {
    operations: operations,
    responses: responses
};