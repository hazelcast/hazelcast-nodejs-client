var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;

function CustomSerializable(value) {
    this.value = value;
}

CustomSerializable.prototype.hzGetCustomId = function () {
    return 10;
};

function CustomSerializer() {
    //Constructor function
}

CustomSerializer.prototype.getId = function () {
    return 10;
};

CustomSerializer.prototype.write = function (output, t) {
    output.writeInt(t.value.length);
    for (var i = 0; i < t.value.length; i++) {
        output.writeInt(t.value.charCodeAt(i));
    }
};

CustomSerializer.prototype.read = function(reader) {
    var len = reader.readInt();
    var str = '';
    for (var i = 0; i < len; i++) {
        str = str + String.fromCharCode(reader.readInt());
    }
    return new CustomSerializable(str);
};

var cfg = new Config.ClientConfig();
cfg.serializationConfig.customSerializers.push(new CustomSerializer());

// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    //CustomSerializer will serialize/deserialize CustomSerializable objects
    hz.shutdown();
});

