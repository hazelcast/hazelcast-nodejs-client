var Config = require('../../.').Config;
var SerializationService = require('../../lib/serialization/SerializationService');
var expect = require('chai').expect;
describe('Global Serializer', function() {
    var service;

    function CustomObject(surname) {
        this.surname = surname;
    }
    before(function() {
        var cfg = new Config.ClientConfig();
        cfg.serializationConfig.globalSerializer = {
            getId: function() {
                return 10;
            },
            write: function(out, emp) {
                out.writeUTF(emp.surname);
            },
            read: function(inp) {
                var obj = new CustomObject();
                obj.surname = inp.readUTF();
                return obj;
            }
        };
        service = new SerializationService.SerializationServiceV1(cfg.serializationConfig);
    });

    it('write-read', function() {
        var emp = new CustomObject('iman');
        var serialized = service.toData(emp);
        var deserialized = service.toObject(serialized);
        return expect(deserialized).to.deep.equal(emp);
    });
});
