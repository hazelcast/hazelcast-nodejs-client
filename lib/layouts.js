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
        }
    }
}

var responses = {
    //Auth response
    107 : [
        {"field" : "status", type: "boolean", "nullable": false},
        {"field": "address", type: "address", "nullable": true},
        {"field": "uuid", type: "string", "nullable": true},
        {"field": "ownerUuid", type: "string", "nullable": true},
        {"field": "serializationVersion", type: "uint8", "nullable": false},
    ]
}


module.exports = {
    operations: operations,
    responses: responses
}