var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;
var cfg = new Config.ClientConfig();

function GlobalSerializer() {

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
Client.newHazelcastClient(cfg).then(function (hz) {
    hz.shutdown();
});



