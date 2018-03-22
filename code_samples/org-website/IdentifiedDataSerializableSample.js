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

Employee.prototype.writeData = function(output) {
    output.writeInt(this.id);
    output.writeUTF(this.name);
};

Employee.prototype.getFactoryId = function () {
    return 1000;
};

Employee.prototype.getClassId = function() {
    return 100;
};

function SampleDataSerializableFactory() {

}

SampleDataSerializableFactory.prototype.create = function (type) {
    if (type === 100) {
        return new Employee();
    }
    throw new RangeError('Unknown type id');
};

var cfg = new Config.ClientConfig();
cfg.serializationConfig.dataSerializableFactories[1000] = new SampleDataSerializableFactory();
Client.newHazelcastClient(cfg).then(function (hz) {
    hz.shutdown();
});

