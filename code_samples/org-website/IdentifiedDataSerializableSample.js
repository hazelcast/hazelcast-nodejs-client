var Client = require('hazelcast-client').Client;
var Config = require('hazelcast-client').Config;

function Employee(id, name) {
    this.id = id;
    this.name = name;
}

Employee.prototype.readData = function (input) {
    this.id = input.readInt();
    this.name = input.readUTF();
};

Employee.prototype.writeData = function (output) {
    output.writeInt(this.id);
    output.writeUTF(this.name);
};

Employee.prototype.getFactoryId = function () {
    return 1000;
};

Employee.prototype.getClassId = function () {
    return 100;
};

function SampleDataSerializableFactory() {
    // Constructor function
}

SampleDataSerializableFactory.prototype.create = function (type) {
    if (type === 100) {
        return new Employee();
    }
    return null;
};

var cfg = new Config.ClientConfig();
cfg.serializationConfig.dataSerializableFactories[1000] = new SampleDataSerializableFactory();
// Start the Hazelcast Client and connect to an already running Hazelcast Cluster on 127.0.0.1
Client.newHazelcastClient(cfg).then(function (hz) {
    // Employee can be used here
    hz.shutdown();
});

