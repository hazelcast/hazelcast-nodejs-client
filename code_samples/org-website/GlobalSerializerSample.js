var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;
var cfg = new Config.ClientConfig();

function GlobalSerializer() {

}

GlobalSerializer.prototype.getId = function () {
    return 20;
};

GlobalSerializer.prototype.read = function (input) {
    //generic deserialization
};

GlobalSerializer.prototype.write = function (output, obj) {
    //generic serialization
};

cfg.serializationConfig.globalSerializer = new GlobalSerializer();

Client.newHazelcastClient(cfg).then(function (hz) {
    hz.shutdown();
});



