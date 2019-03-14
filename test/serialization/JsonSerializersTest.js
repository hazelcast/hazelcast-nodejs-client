var expect = require('chai').expect;
var Config = require('../../.').Config;
var SerializationServiceV1 = require('../../lib/serialization/SerializationService').SerializationServiceV1;
var HazelcastJsonValue = require('../../.').HazelcastJsonValue;

describe('Json serializers test', function () {
    var object = {
      key: 'value'
    };

    var hzJsonValue = HazelcastJsonValue.fromObject(object);
    
    it('JsonSerializer serialize-deserialize object', function () {
        var serializationService = new SerializationServiceV1(undefined, new Config.ClientConfig().serializationConfig);
        var serialized = serializationService.toData(object);
        expect(serializationService.toObject(serialized)).to.deep.equal(object);
    });

    it('JsonSerializer serialize-deserialize HazelcastJsonValue', function () {
        var serializationService = new SerializationServiceV1(undefined, new Config.ClientConfig().serializationConfig);
        var serialized = serializationService.toData(hzJsonValue);
        expect(serializationService.toObject(serialized)).to.deep.equal(object);
    });

    it('HazelcastJsonValueSerializer serialize-deserialize object', function () {
        var serializationConfig = new Config.ClientConfig().serializationConfig;
        serializationConfig.jsonDeserializationFormat = Config.JsonDeserializationFormat.HAZELCAST_JSON_VALUE;
        var serializationService = new SerializationServiceV1(undefined, serializationConfig);
        var serialized = serializationService.toData(object);
        var deserialized = serializationService.toObject(serialized);
        expect(deserialized).to.be.an.instanceof(HazelcastJsonValue);
        expect(deserialized).to.deep.equal(hzJsonValue);
        expect(deserialized.parse()).to.deep.equal(object);
    });

    it('HazelcastJsonValueSerializer serialize-deserialize HazelcastJsonValue', function () {
        var serializationConfig = new Config.ClientConfig().serializationConfig;
        serializationConfig.jsonDeserializationFormat = Config.JsonDeserializationFormat.HAZELCAST_JSON_VALUE;
        var serializationService = new SerializationServiceV1(undefined, serializationConfig);
        var serialized = serializationService.toData(hzJsonValue);
        var deserialized = serializationService.toObject(serialized);
        expect(deserialized).to.be.an.instanceof(HazelcastJsonValue);
        expect(deserialized).to.deep.equal(hzJsonValue);
        expect(deserialized.parse()).to.deep.equal(object);
    });
});
