var operations = require("./layouts").operations;

var STRING_SERIALIZER_ID = -11;

var serializeAsString = function (value) {
    var valueLength = value.length;
    var buffer = new Buffer(valueLength + 8);
    buffer.writeInt32LE(STRING_SERIALIZER_ID, 0);
    buffer.writeInt32LE(STRING_SERIALIZER_ID, 4);
    buffer.write(value, 8);
    return buffer;
};

var jsonCallback = function (result) {

    if (result == null) {
        return null;
    }

    // There are two integers at the start: serializer ID and length. We do not care about them.
    var json = result.toString("utf8", 8);
    return JSON.parse(json);
};

var MapProxy = function (client, name) {
    this.client = client;
    this.name = name;
};

MapProxy.prototype.putRaw = function (keyBuffer, valueBuffer, ttl) {
    return this.client.invokeOperation(operations.MAP.PUT, {
        "mapName": this.name,
        "key": keyBuffer,
        "value": valueBuffer,
        "threadId": 0,
        "timeToLive": ttl
    });
};

MapProxy.prototype.put = function (key, value, ttl) {
    if (typeof ttl === 'undefined') { ttl = 0 }

    var keyBuffer = serializeAsString(key);
    var valueBuffer = serializeAsString(JSON.stringify(value));

    return this.putRaw(keyBuffer, valueBuffer, ttl).then(jsonCallback);
};

MapProxy.prototype.putRaw = function (keyBuffer, valueBuffer, ttl) {
    return this.client.invokeOperation(operations.MAP.PUT, {
        "mapName": this.name,
        "key": keyBuffer,
        "value": valueBuffer,
        "threadId": 0,
        "timeToLive": ttl
    });
};

MapProxy.prototype.get = function (key) {
    var keyBuffer = serializeAsString(key);

    return this.client.invokeOperation(operations.MAP.GET, {
        "mapName": this.name,
        "key": keyBuffer,
        "threadId": 0
    }).then(jsonCallback);
};

MapProxy.prototype.remove = function (key) {
    var keyBuffer = serializeAsString(key);

    return this.client.invokeOperation(operations.MAP.REMOVE, {
        "mapName": this.name,
        "key": keyBuffer,
        "threadId": 0
    }).then(jsonCallback);
};


module.exports = MapProxy;