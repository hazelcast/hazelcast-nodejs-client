/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

function AnIdentifiedDataSerializable(bool, b, c, d, s, f, i, l, str, booleans, bytes, chars, doubles, shorts, floats, ints
    , longs, strings, portable, identifiedDataSerializable, customStreamSerializable, customByteArraySerializableObject, data) {
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

    this.booleans = booleans;
    this.bytes = bytes;
    this.chars = chars;
    this.doubles = doubles;
    this.shorts = shorts;
    this.floats = floats;
    this.ints = ints;
    this.longs = longs;
    this.strings = strings;

    this.byteSize = bytes.length;
    this.bytesFully = bytes;
    this.bytesOffset = bytes.slice(1, 3);
    this.strChars = str.split('');
    this.strBytes = Buffer.alloc(this.str.length);
    for (var i = 0; i < str.length; i++) {
        this.strBytes[i] = this.strChars[i].charCodeAt(0);
    }
    this.unsignedByte = 137;
    this.unsignedShort = 32867;
    this.portableObject = portable;
    this.identifiedDataSerializableObject = identifiedDataSerializable;
    this.customStreamSerializableObject = customStreamSerializable;
    this.customByteArraySerializableObject = customByteArraySerializableObject;
    this.data = data;
}

AnIdentifiedDataSerializable.prototype.getFactoryId = function () {
    return 1;
};

AnIdentifiedDataSerializable.prototype.getClassId = function () {
    return 1;
};

AnIdentifiedDataSerializable.prototype.readData = function (dataInput) {
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
    this.strSize = dataInput.readInt();
    this.strChars = [];
    for (var j = 0; j < this.strSize; j++) {
        this.strChars[j] = dataInput.readChar();
    }
    this.strBytes = Buffer.alloc(this.strSize);
    dataInput.readCopy(this.strBytes, this.strSize);
    this.unsignedByte = dataInput.readUnsignedByte();
    this.unsignedShort = dataInput.readUnsignedShort();

    this.portableObject = dataInput.readObject();
    this.identifiedDataSerializableObject = dataInput.readObject();
    this.customByteArraySerializableObject = dataInput.readObject();
    this.customStreamSerializableObject = dataInput.readObject();

    this.data = dataInput.readData();
};

AnIdentifiedDataSerializable.prototype.writeData = function (dataOutput) {
    dataOutput.writeBoolean(this.bool);
    dataOutput.writeByte(this.b);
    dataOutput.writeChar(this.c);
    dataOutput.writeDouble(this.d);
    dataOutput.writeShort(this.s);
    dataOutput.writeFloat(this.f);
    dataOutput.writeInt(this.i);
    dataOutput.writeLong(this.l);
    dataOutput.writeUTF(this.str);

    dataOutput.writeBooleanArray(this.booleans);
    dataOutput.writeByteArray(this.bytes);
    dataOutput.writeCharArray(this.chars);
    dataOutput.writeDoubleArray(this.doubles);
    dataOutput.writeShortArray(this.shorts);
    dataOutput.writeFloatArray(this.floats);
    dataOutput.writeIntArray(this.ints);
    dataOutput.writeLongArray(this.longs);
    dataOutput.writeUTFArray(this.strings);

    dataOutput.writeBooleanArray(this.booleansNull);
    dataOutput.writeByteArray(this.bytesNull);
    dataOutput.writeCharArray(this.charsNull);
    dataOutput.writeDoubleArray(this.doublesNull);
    dataOutput.writeShortArray(this.shortsNull);
    dataOutput.writeFloatArray(this.floatsNull);
    dataOutput.writeIntArray(this.intsNull);
    dataOutput.writeLongArray(this.longsNull);
    dataOutput.writeUTFArray(this.stringsNull);

    var byteSize = this.bytes.length;
    dataOutput.write(byteSize);
    dataOutput.write(this.bytes);
    dataOutput.write(this.bytes[1]);
    dataOutput.write(this.bytes[2]);
    dataOutput.writeInt(this.str.length);
    dataOutput.writeChars(this.str);
    dataOutput.writeBytes(this.str);
    dataOutput.writeByte(this.unsignedByte);
    dataOutput.writeShort(this.unsignedShort);

    dataOutput.writeObject(this.portableObject);
    dataOutput.writeObject(this.identifiedDataSerializableObject);
    dataOutput.writeObject(this.customByteArraySerializableObject);
    dataOutput.writeObject(this.customStreamSerializableObject);

    dataOutput.writeData(this.data);
};

module.exports = AnIdentifiedDataSerializable;
