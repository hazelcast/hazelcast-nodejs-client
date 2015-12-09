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
    //Auth response
    107: [
        {"name": "status", "type": "boolean", "nullable": false},
        {"name": "address", "type": "address", "nullable": true},
        {"name": "uuid", "type": "string", "nullable": true},
        {"name": "ownerUuid", "type": "string", "nullable": true},
        {"name": "serializationVersion", "type": "uint8", "nullable": false}
    ]
};


module.exports = {
    operations: operations,
    responses: responses
};