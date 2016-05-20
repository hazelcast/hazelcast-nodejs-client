var Config = require('../../.').Config;
var SerializationService = require('../../lib/serialization/SerializationService');
var expect = require('chai').expect;
describe.skip('Portable Serialization', function() {
    var service;

    function PortableObject(name) {
        this.name = name
    }
    PortableObject.prototype.getFactoryId = function() {
        return 10;
    };
    PortableObject.prototype.getClassId = function() {
        return 111;
    };
    PortableObject.prototype.writePortable = function(writer) {
        writer.writeUTF('name', this.name);
        writer.writeInt('age', 43);
    };
    PortableObject.prototype.readPortable = function(reader) {
        this.age = reader.readInt('age');
        this.name = reader.readUTF('name');
    };

    before(function() {
        var cfg = new Config.ClientConfig();
        cfg.serializationConfig.portableFactories[10] = {
            create: function(classId) {
                if (classId === 111) {
                    return new PortableObject();
                } else {
                    return null;
                }
            }
        };
        service = new SerializationService.SerializationServiceV1(cfg.serializationConfig);
    });

    it('write-read', function() {
        var emp = new PortableObject('serialized');
        var serialized = service.toData(emp);
        var deserialized = service.toObject(serialized);
        return expect(deserialized).to.deep.equal(emp);
    });
});
