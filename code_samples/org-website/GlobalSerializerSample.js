var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;
var cfg = new Config.ClientConfig();

function GlobalSerializer() {
    // Constructor function
}

GlobalSerializer.prototype.getId = function () {
    return 20;
};

GlobalSerializer.prototype.read = function (input) {
    // return MyFavoriteSerializer.deserialize(input);
};

GlobalSerializer.prototype.write = function (output, obj) {
    // output.write(MyFavoriteSerializer.serialize(obj))
};

cfg.serializationConfig.globalSerializer = new GlobalSerializer();
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    // GlobalSerializer will serialize/deserialize all non-builtin types
    hz.shutdown();
});



