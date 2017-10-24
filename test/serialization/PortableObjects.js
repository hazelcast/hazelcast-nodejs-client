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

function PortableObjectV2(a_new_prop, a_byte, a_boolean, a_character, a_short, an_integer, a_long, a_float, a_double, a_portable, bytes, booleans, chars, shorts, integers, longs, floats, doubles, strings, portables) {
    this.a_new_prop = a_new_prop;// this prop is newly added
    this.a_byte = a_byte;
    this.a_boolean = a_boolean;
    this.a_character = a_character;
    this.a_short = a_short;
    this.an_integer = an_integer;
    this.a_long = a_long;
    this.a_float = a_float; //this is a double in this version
    this.a_double = a_double;
    //a_string is removed
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

PortableObjectV2.prototype.getVersion = function() {
    return 2;
};

PortableObjectV2.prototype.getFactoryId = function() {
    return 10;
};

PortableObjectV2.prototype.getClassId = function() {
    return 111;
};

PortableObjectV2.prototype.writePortable = function(writer) {
    writer.writeUTF('a_new_prop', this.a_new_prop);
    writer.writeByte('a_byte', this.a_byte);
    writer.writeBoolean('a_boolean', this.a_boolean);
    writer.writeChar('a_char', this.a_character);
    writer.writeShort('a_short', this.a_short);
    writer.writeInt('an_integer', this.an_integer);
    writer.writeLong('a_long', this.a_long);
    writer.writeDouble('a_float', this.a_float); //Floats are Double
    writer.writeDouble('a_double', this.a_double);
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
PortableObjectV2.prototype.readPortable = function(reader) {
    this.a_new_prop = reader.readUTF('a_new_prop');
    this.a_byte = reader.readByte('a_byte');
    this.a_boolean = reader.readBoolean('a_boolean');
    this.a_character = reader.readChar('a_char');
    this.a_short = reader.readShort('a_short');
    this.an_integer = reader.readInt('an_integer');
    this.a_long = reader.readLong('a_long');
    this.a_float = reader.readDouble('a_float'); // Floats are double
    this.a_double = reader.readDouble('a_double');
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

function TestObjectPortable(objectMetadata) {
    this.innerPortable = objectMetadata;
}

TestObjectPortable.prototype.getFactoryId = function () {
    return 10;
};

TestObjectPortable.prototype.getClassId = function () {
    return 555;
};

TestObjectPortable.prototype.readPortable = function (reader) {
    this.innerPortable = reader.readPortable('object_metadata_portable');
};

TestObjectPortable.prototype.writePortable = function (writer) {
    writer.writePortable('object_metadata_portable', this.innerPortable);
};

TestObjectPortable.prototype.getVersion = function () {
    return 3;
};

function TestObjectMetadataPortable(metadata, reference) {
    this.m = metadata;
    this.r = reference;
}

TestObjectMetadataPortable.prototype.getVersion = function () {
    return 1;
};

TestObjectMetadataPortable.prototype.getClassId = function() {
    return 999;
};

TestObjectMetadataPortable.prototype.getFactoryId = function () {
    return 10;
};

TestObjectMetadataPortable.prototype.writePortable = function (writer) {
    writer.writeUTF('metadata', this.m);
    writer.writeUTF('r', this.r);
};

TestObjectMetadataPortable.prototype.readPortable = function (reader) {
    this.m = reader.readUTF('metadata');
    this.r = reader.readUTF('r');
};


exports.PortableObject = PortableObject;
exports.PortableObjectV2 = PortableObjectV2;
exports.InnerPortableObject = InnerPortableObject;
exports.TestObjectPortable = TestObjectPortable;
exports.TestObjectMetadataPortable = TestObjectMetadataPortable;
