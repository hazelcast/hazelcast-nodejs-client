var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;

function IdentifiedEntryProcessor(value) {
}

IdentifiedEntryProcessor.prototype.readData = function (inp) {
};

IdentifiedEntryProcessor.prototype.writeData = function(outp) {
};

IdentifiedEntryProcessor.prototype.getFactoryId = function () {
    return 1;
};

IdentifiedEntryProcessor.prototype.getClassId = function() {
    return 9;
};

function EntryProcessorDataSerializableFactory() {

}

EntryProcessorDataSerializableFactory.prototype.create = function (type) {
    if (type === 1) {
        return new IdentifiedEntryProcessor();
    }
};

var cfg = new Config.ClientConfig();
cfg.serializationConfig.dataSerializableFactories[1] = new EntryProcessorDataSerializableFactory();
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    // Get the Distributed Map from Cluster.
    var map = hz.getMap('my-distributed-map');
    // Put the double value of 0 into the Distributed Map
    return map.put('key', 0).then(function () {
        // Run the IdentifiedEntryProcessor class on the Hazelcast Cluster Member holding the key called "key"
        return map.executeOnKey('key', new IdentifiedEntryProcessor());
    }).then(function () {
        // Show that the IdentifiedEntryProcessor updated the value.
        return map.get('key');
    }).then(function (value) {
        console.log(value);
        // Shutdown the Hazelcast Cluster Member
        hz.shutdown();
    })
});

