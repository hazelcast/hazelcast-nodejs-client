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
'use strict';

const Long = require('long');
const { SerializationConfigImpl } = require('../../lib/config/SerializationConfig');
const { SerializationServiceV1 } = require('../../lib/serialization/SerializationService');
const Util = require('../Util');

class IdentifiedDataClass {

    constructor(a_byte, a_boolean, a_character, a_short, an_integer,
                a_long, a_float, a_double, a_string, bytes, booleans,
                chars, shorts, integers, longs, floats, doubles, strings) {
        this.a_byte = a_byte;
        this.a_boolean = a_boolean;
        this.a_character = a_character;
        this.a_short = a_short;
        this.an_integer = an_integer;
        this.a_long = a_long;
        this.a_float = a_float;
        this.a_double = a_double;
        this.a_string = a_string;
        this.bytes = bytes;
        this.booleans = booleans;
        this.chars = chars;
        this.shorts = shorts;
        this.integers = integers;
        this.longs = longs;
        this.floats = floats;
        this.doubles = doubles;
        this.strings = strings;

        this.factoryId = 1;
        this.classId = 1;
    }

    readData(inp) {
        this.a_byte = inp.readByte();
        this.a_boolean = inp.readBoolean();
        this.a_character = inp.readChar();
        this.a_short = inp.readShort();
        this.an_integer = inp.readInt();
        this.a_long = inp.readLong();
        this.a_float = inp.readFloat();
        this.a_double = inp.readDouble();
        this.a_string = inp.readUTF();

        this.bytes = inp.readByteArray();
        this.booleans = inp.readBooleanArray();
        this.chars = inp.readCharArray();
        this.shorts = inp.readShortArray();
        this.integers = inp.readIntArray();
        this.longs = inp.readLongArray();
        this.floats = inp.readFloatArray();
        this.doubles = inp.readDoubleArray();
        this.strings = inp.readUTFArray();
    }

    writeData(outp) {
        outp.writeByte(this.a_byte);
        outp.writeBoolean(this.a_boolean);
        outp.writeChar(this.a_character);
        outp.writeShort(this.a_short);
        outp.writeInt(this.an_integer);
        outp.writeLong(this.a_long);
        outp.writeFloat(this.a_float);
        outp.writeDouble(this.a_double);
        outp.writeUTF(this.a_string);

        outp.writeByteArray(this.bytes);
        outp.writeBooleanArray(this.booleans);
        outp.writeCharArray(this.chars);
        outp.writeShortArray(this.shorts);
        outp.writeIntArray(this.integers);
        outp.writeLongArray(this.longs);
        outp.writeFloatArray(this.floats);
        outp.writeDoubleArray(this.doubles);
        outp.writeUTFArray(this.strings);
    }

}

describe('IdentifiedDataSerializableTest', function () {

    const identifiedFactory = (classId) => {
        if (classId === 1) {
            return new IdentifiedDataClass();
        }
    };

    let service;

    it('serialize deserialize identified data serializable', function () {
        const cfg = new SerializationConfigImpl();
        cfg.dataSerializableFactories[1] = identifiedFactory;
        service = new SerializationServiceV1(cfg);
        const dd = new IdentifiedDataClass(
            99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            'hazelcast', Buffer.from([0x99, 0x100, 0x101]), [true, false, false, true],
            ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)],
            [233.2, 65.88, 657.345], [43645.325, 887.56756],
            ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto']
        );
        const serialized = service.toData(dd);
        const deserialized = service.toObject(serialized);

        Util.expectAlmostEqual(deserialized, dd);
    });
});
