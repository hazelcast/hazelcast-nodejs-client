/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Buffer = require('safe-buffer').Buffer;

function APortable(bool, b, c, d, s, f, i, l, str, p, booleans, bytes, chars, doubles, shorts, floats, ints, longs, strings,
                   portables, identifiedDataSerializable, customStreamSerializableObject, customByteArraySerializableObject, data) {
    if (arguments.length === 0) return;
    this.bool = bool;
    this.b = b;
    this.c = c;
    this.d = d;
    this.s = s;
    this.f = f;
    this.i = i;
    this.l = l;
    this.str = str;
    this.p = p;

    this.booleans = booleans;
    this.bytes = bytes;
    this.chars = chars;
    this.doubles = doubles;
    this.shorts = shorts;
    this.floats = floats;
    this.ints = ints;
    this.longs = longs;
    this.strings = strings;
    this.portables = portables;

    this.byteSize = bytes.length;
    this.bytesFully = bytes;
    this.bytesOffset = bytes.slice(1, 3);
    this.strChars = str.split('');
    this.strBytes = Buffer.alloc(this.str.length);
    for (var i = 0; i < str.length; i++) {
        this.strBytes[i] = this.strChars[i].charCodeAt(0);
    }
    unsignedByte = 137;
    unsignedShort = 32867;

    this.identifiedDataSerializableObject = identifiedDataSerializable;
    this.portableObject = p;
    this.customStreamSerializableObject = customStreamSerializableObject;
    this.customByteArraySerializableObject = customByteArraySerializableObject;

    this.data = data;
}

APortable.prototype.getClassId = function () {
    return 1;
};

APortable.prototype.getFactoryId = function () {
    return 1;
};

APortable.prototype.readPortable = function (reader) {
    this.bool = reader.readBoolean("bool");
    this.b = reader.readByte("b");
    this.c = reader.readChar("c");
    this.d = reader.readDouble("d");
    this.s = reader.readShort("s");
    this.f = reader.readFloat("f");
    this.i = reader.readInt("i");
    this.l = reader.readLong("l");
    this.str = reader.readUTF("str");
    this.p = reader.readPortable("p");

    this.booleans = reader.readBooleanArray("booleans");
    this.bytes = reader.readByteArray("bs");
    this.chars = reader.readCharArray("cs");
    this.doubles = reader.readDoubleArray("ds");
    this.shorts = reader.readShortArray("ss");
    this.floats = reader.readFloatArray("fs");
    this.ints = reader.readIntArray("is");
    this.longs = reader.readLongArray("ls");
    this.strings = reader.readUTFArray("strs");
    this.portables = reader.readPortableArray("ps");

    this.booleansNull = reader.readBooleanArray("booleansNull");
    this.bytesNull = reader.readByteArray("bsNull");
    this.charsNull = reader.readCharArray("csNull");
    this.doublesNull = reader.readDoubleArray("dsNull");
    this.shortsNull = reader.readShortArray("ssNull");
    this.floatsNull = reader.readFloatArray("fsNull");
    this.intsNull = reader.readIntArray("isNull");
    this.longsNull = reader.readLongArray("lsNull");
    this.stringsNull = reader.readUTFArray("strsNull");

    var dataInput = reader.getRawDataInput();

    this.bool = dataInput.readBoolean();
    this.b = dataInput.readByte();
    this.c = dataInput.readChar();
    this.d = dataInput.readDouble();
    this.s = dataInput.readShort();
    this.f = dataInput.readFloat();
    this.i = dataInput.readInt();
    this.l = dataInput.readLong();
    this.str = dataInput.readUTF();

    this.booleans = dataInput.readBooleanArray();
    this.bytes = dataInput.readByteArray();
    this.chars = dataInput.readCharArray();
    this.doubles = dataInput.readDoubleArray();
    this.shorts = dataInput.readShortArray();
    this.floats = dataInput.readFloatArray();
    this.ints = dataInput.readIntArray();
    this.longs = dataInput.readLongArray();
    this.strings = dataInput.readUTFArray();

    this.booleansNull = dataInput.readBooleanArray();
    this.bytesNull = dataInput.readByteArray();
    this.charsNull = dataInput.readCharArray();
    this.doublesNull = dataInput.readDoubleArray();
    this.shortsNull = dataInput.readShortArray();
    this.floatsNull = dataInput.readFloatArray();
    this.intsNull = dataInput.readIntArray();
    this.longsNull = dataInput.readLongArray();
    this.stringsNull = dataInput.readUTFArray();

    this.byteSize = dataInput.readByte();
    this.bytesFully = Buffer.alloc(this.byteSize);
    dataInput.readCopy(this.bytesFully, this.byteSize);
    this.bytesOffset = Buffer.alloc(2);
    dataInput.readCopy(this.bytesOffset, 2);
    var strSize = dataInput.readInt();
    this.strChars = Buffer.alloc(strSize);
    for (var j = 0; j < strSize; j++) {
        this.strChars[j] = dataInput.readChar();
    }
    this.strBytes = Buffer.alloc(strSize);
    dataInput.readCopy(this.strBytes, strSize);
    this.unsignedByte = dataInput.readUnsignedByte();
    this.unsignedShort = dataInput.readUnsignedShort();

    this.portableObject = dataInput.readObject();
    this.identifiedDataSerializableObject = dataInput.readObject();
    this.customByteArraySerializableObject = dataInput.readObject();
    this.customStreamSerializableObject = dataInput.readObject();

    this.data = dataInput.readData();
};

APortable.prototype.writeData = function () {
    //TODO
};
module.exports = APortable;
