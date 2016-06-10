/**
 * JSON serialization is not capable if handling circular references.
 * We will use Mousse serializer to serialize our self referring objects.
 */
var mousse = require('mousse');
var Client = require('../.').Client;
var Config = require('../.').Config;
var cfg = new Config.ClientConfig();
cfg.serializationConfig.globalSerializer = {
    mousseSerialize: mousse.serialize,
    mousseDeserialize: mousse.deserialize,
    getId: function() {
        return 10;
    },
    write: function(out, obj) {
        out.writeUTF(this.mousseSerialize(obj))
    },
    read: function(inp) {
        var representation = inp.readUTF();
        return this.mousseDeserialize(representation).then(function(obj) {
            return obj;
        });
    }
};

var selfReferringObject = {
    value: 10
};
selfReferringObject.self = selfReferringObject;

Client.newHazelcastClient(cfg).then(function (client) {
    var map = client.getMap('objects');
    map.put(1, selfReferringObject).then(function () {
        return map.get(1);
    }).then(function (obj) {
        console.log(obj);
        console.log(obj.self);
        console.log(obj.self.self);
        client.shutdown();
    })
});



