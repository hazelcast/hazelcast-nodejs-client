var Config = require('../../.').Config;
var SerializationService = require('../../lib/serialization/SerializationService');
var Long = require('long');
var expect = require('chai').expect;
var Util = require('../Util');
describe('Portable Serialization', function() {
    var service;

    function PortableObject(a_byte, a_boolean, a_character, a_short, an_integer, a_long, a_float, a_double, a_string, a_portable, bytes, booleans, chars, shorts, integers, longs, floats, doubles, strings, portables) {
        this.a_byte = a_byte;
        this.a_boolean = a_boolean;
        this.a_character = a_character;
        this.a_short = a_short;
        this.an_integer = an_integer;
        this.a_long = a_long;
        this.a_float = a_float;
        this.a_double = a_double;
        this.a_string = a_string;
        this.a_portable = a_portable;
        this.a_null_portable = null;
        this.bytes = bytes;
        this.booleans = booleans;
        this.chars = chars;
        this.shorts = shorts;
        this.integers = integers;
        this.longs = longs;
        this.floats = floats;
        this.doubles = doubles;
        this.strings = strings;
        this.portables = portables;
    }
    PortableObject.prototype.getFactoryId = function() {
        return 10;
    };
    PortableObject.prototype.getClassId = function() {
        return 111;
    };
    PortableObject.prototype.writePortable = function(writer) {
        writer.writeByte('a_byte', this.a_byte);
        writer.writeBoolean('a_boolean', this.a_boolean);
        writer.writeChar('a_char', this.a_character);
        writer.writeShort('a_short', this.a_short);
        writer.writeInt('an_integer', this.an_integer);
        writer.writeLong('a_long', this.a_long);
        writer.writeFloat('a_float', this.a_float);
        writer.writeDouble('a_double', this.a_double);
        writer.writeUTF('a_string', this.a_string);
        writer.writePortable('a_portable', this.a_portable);
        writer.writeNullPortable('a_null_portable', InnerPortableObject.prototype.getFactoryId.call(null), InnerPortableObject.prototype.getClassId.call(null));

        writer.writeByteArray('bytes', this.bytes);
        writer.writeBooleanArray('booleans', this.booleans);
        writer.writeCharArray('chars', this.chars);
        writer.writeShortArray('shorts', this.shorts);
        writer.writeIntArray('integers', this.integers);
        writer.writeLongArray('longs', this.longs);
        writer.writeFloatArray('floats', this.floats);
        writer.writeDoubleArray('doubles', this.doubles);
        writer.writeUTFArray('strings', this.strings);
        writer.writePortableArray('portables', this.portables);
    };
    PortableObject.prototype.readPortable = function(reader) {
        this.a_byte = reader.readByte('a_byte');
        this.a_boolean = reader.readBoolean('a_boolean');
        this.a_character = reader.readChar('a_char');
        this.a_short = reader.readShort('a_short');
        this.an_integer = reader.readInt('an_integer');
        this.a_long = reader.readLong('a_long');
        this.a_float = reader.readFloat('a_float');
        this.a_double = reader.readDouble('a_double');
        this.a_string = reader.readUTF('a_string');
        this.a_portable = reader.readPortable('a_portable');
        this.a_null_portable = reader.readPortable('a_null_portable');

        this.bytes = reader.readByteArray('bytes');
        this.booleans = reader.readBooleanArray('booleans');
        this.chars = reader.readCharArray('chars');
        this.shorts = reader.readShortArray('shorts');
        this.integers = reader.readIntArray('integers');
        this.longs = reader.readLongArray('longs');
        this.floats = reader.readFloatArray('floats');
        this.doubles = reader.readDoubleArray('doubles');
        this.strings = reader.readUTFArray('strings');
        this.portables = reader.readPortableArray('portables');
    };

    function InnerPortableObject(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    InnerPortableObject.prototype.getFactoryId = function() {
        return 10;
    };

    InnerPortableObject.prototype.getClassId = function() {
        return 222;
    };

    InnerPortableObject.prototype.readPortable = function(reader) {
        this.p1 = reader.readUTF('p1');
        this.p2 = reader.readUTF('p2');
    };

    InnerPortableObject.prototype.writePortable = function(writer) {
        writer.writeUTF('p1', this.p1);
        writer.writeUTF('p2', this.p2);
    };

    before(function() {
        var cfg = new Config.ClientConfig();
        cfg.serializationConfig.portableFactories[10] = {
            create: function(classId) {
                if (classId === 111) {
                    return new PortableObject();
                } else if (classId === 222) {
                    return new InnerPortableObject();
                } else {
                    return null;
                }
            }
        };
        service = new SerializationService.SerializationServiceV1(cfg.serializationConfig);
    });

    it('write-read', function() {
        var emp = new PortableObject(99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            'hazelcast', new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true], ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)], [233.2, 65.88, 657.345],
            [43645.325, 887.56756], ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]);
        var serialized = service.toData(emp);
        var deserialized = service.toObject(serialized);
        Util.expectAlmostEqual(deserialized, emp);
    });
});
