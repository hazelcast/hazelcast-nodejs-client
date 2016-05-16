var expect = require('chai').expect;
var Long = require('long');
var Controller = require('../RC');
var Config = require('../../.').Config;
var SerializationService = require('../../lib/serialization/SerializationService');
describe('Default serializers Test', function() {

    var serializationService;

    function testObject(obj, serializationService) {
        var serialized = serializationService.toData(obj);
        expect(serializationService.toObject(serialized)).to.deep.equal(obj);
    }

    var parameters = [
        14,
        545.3,
        1<<63,
        true,
        [true, false, false, true],
        [],
        ['client', 'test'],
        [''],
        '',
        'client',
        [12, 56, 54, 12],
        [43546.6, 2343.4, 8988,4],
        [23545798.6],
        null
    ];

    parameters.forEach(function (obj) {
        it('type: ' + typeof obj + ', isArray: ' + Array.isArray(obj) + ', value: ' + JSON.stringify(obj), function() {
            var serializationService = new SerializationService.SerializationServiceV1(new Config.ClientConfig().serializationConfig);
            var serialized = serializationService.toData(obj);
            expect(serializationService.toObject(serialized)).to.deep.equal(obj);
        })
    });

    var defaultNumberTypes = [
        'double',
        'short',
        'integer',
        'long',
        'float'
    ];

    defaultNumberTypes.forEach(function(type) {
        it('convert default number type: ' + type, function() {
            if (type === 'long') {
                var num = Long.fromNumber(56);
            } else {
                var num = 56;
            }
            var serializationConfig = new Config.ClientConfig().serializationConfig;
            serializationConfig.defaultNumberType = type;
            var serializationService = new SerializationService.SerializationServiceV1(serializationConfig);
            var serialized = serializationService.toData(num);
            expect(serializationService.toObject(serialized)).to.deep.equal(num);
        })
    });

    defaultNumberTypes.forEach(function(type) {
        it('convert array of default number type: ' + type, function() {
            if (type === 'long') {
                var nums = [Long.fromNumber(56), Long.fromNumber(101)];
            } else {
                var nums = [56, 101];
            }
            var serializationConfig = new Config.ClientConfig().serializationConfig;
            serializationConfig.defaultNumberType = type;
            var serializationService = new SerializationService.SerializationServiceV1(serializationConfig);
            var serialized = serializationService.toData(nums);
            expect(serializationService.toObject(serialized)).to.deep.equal(nums);
        })
    });
});
