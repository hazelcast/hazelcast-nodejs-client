var operations = {
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
        },
        COMPARE_AND_SET: {
            CODE: 0x0a06,
            LAYOUT: [
                {"field": "name", "type": "string", "nullable": false},
                {"field": "expected", "type": "int64", "nullable": false},
                {"field": "newValue", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        DECREMENT_AND_GET: {
            CODE: 0x0a07,
            LAYOUT: [
                {"field": "name", "type": "string", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        GET: {
            CODE: 0x0a08,
            LAYOUT: [
                {"field": "name", "type": "string", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        GET_AND_ADD: {
            CODE: 0x0a09,
            LAYOUT: [
                {"field": "name", "type": "string", "nullable": false},
                {"field": "delta", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        GET_AND_SET: {
            CODE: 0x0a0a,
            LAYOUT: [
                {"field": "name", "type": "string", "nullable": false},
                {"field": "newValue", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        },
        INCREMENT_AND_GET: {
            CODE: 0x0a0b,
            LAYOUT: [
                {"field": "name", "type": "string", "nullable": false},
            ],
            PARTITION_KEY_FIELD: "name"
        },
        GET_AND_INCREMENT: {
            CODE: 0x0a0c,
            LAYOUT: [
                {"field": "name", "type": "string", "nullable": false},
            ],
            PARTITION_KEY_FIELD: "name"
        },
        SET: {
            CODE: 0x0a0d,
            LAYOUT: [
                {"field": "name", "type": "string", "nullable": false},
                {"field": "newValue", "type": "int64", "nullable": false}
            ],
            PARTITION_KEY_FIELD: "name"
        }
    }
}

var responses = {
    // Atomic Long Set
    100: [],
    // Atomic Long Compare And Set
    101: [
        {"field": "value", "type": "boolean", "nullable": false}
    ],
    // Atomic Long: AddAndGet, DecrementAndGet, Get, GetAndAdd, GetAndSet
    103: [
        {"field": "value", "type": "int64", "nullable": false}
    ],
    //Auth response
    107 : [
        {"field" : "status", "type": "boolean", "nullable": false},
        {"field": "address", "type": "address", "nullable": true},
        {"field": "uuid", "type": "string", "nullable": true},
        {"field": "ownerUuid", "type": "string", "nullable": true},
        {"field": "serializationVersion", "type": "uint8", "nullable": false}
    ]
}


module.exports = {
    operations: operations,
    responses: responses
}