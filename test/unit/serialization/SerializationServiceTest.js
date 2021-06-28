/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

const { expect } = require('chai');
const { SerializationServiceV1: SerializationService } = require('../../../lib/serialization/SerializationService');
const { HeapData, TYPE_OFFSET } = require('../../../lib/serialization/HeapData');
const { SerializationConfigImpl } = require('../../../lib/config/SerializationConfig');

function IDataSerializable(val) {
    this.val = val;
    this.factoryId = 1;
    this.classId = 11;
}

IDataSerializable.prototype.readData = function (input) {
    this.val = input.readInt();
};

IDataSerializable.prototype.writeData = function (output) {
    output.writeInt(this.val);
};

function idataSerializableFactory(classId) {
    if (classId === 11) {
        return new IDataSerializable();
    }
}

function Portable(val) {
    this.val = val;
    this.factoryId = 2;
    this.classId = 22;
}

Portable.prototype.readPortable = function (reader) {
    this.val = reader.readInt('val');
};

Portable.prototype.writePortable = function (writer) {
    writer.writeInt('val', this.val);
};

function portableFactory(classId) {
    if (classId === 22) {
        return new Portable();
    }
}

function AnyObject(val) {
    this.val = val;
    // Put a reference to self so json serializer cannot be used. Make sure global serializer is used in test.
    this.self = this;
}

function GlobalSerializer() {
}

GlobalSerializer.prototype.id = 33;

GlobalSerializer.prototype.read = function (inp) {
    const obj = new AnyObject();
    obj.val = inp.readInt();
    return obj;
};

GlobalSerializer.prototype.write = function (outp, obj) {
    outp.writeInt(obj.val);
};

function CustomObject(val) {
    this.val = val;
    this.hzCustomId = 44;
    // Put a reference to self so json serializer cannot be used. Make sure global serializer is used in test.
    this.self = this;
}

function CustomSerializer() {
}

CustomSerializer.prototype.id = 44;

CustomSerializer.prototype.read = function (reader) {
    const obj = new CustomObject();
    obj.val = reader.readInt();
    return obj;
};

CustomSerializer.prototype.write = function (writer, obj) {
    writer.writeInt(obj.val);
};

describe('SerializationServiceTest', function () {

    it('should use data serializable factory', function () {
        const serializationConfig = new SerializationConfigImpl();
        serializationConfig.dataSerializableFactories[1] = idataSerializableFactory;

        const serializationService = new SerializationService(serializationConfig);

        const data = serializationService.toData(new IDataSerializable(3));
        const object = serializationService.toObject(data);

        expect(object.val).to.equal(3);
    });

    it('should use portable factory', function () {
        const serializationConfig = new SerializationConfigImpl();
        serializationConfig.portableFactories[2] = portableFactory;

        const serializationService = new SerializationService(serializationConfig);

        const data = serializationService.toData(new Portable(3));
        const object = serializationService.toObject(data);

        expect(object.val).to.equal(3);
    });

    it('should use custom serializer', function () {
        const serializationConfig = new SerializationConfigImpl();
        serializationConfig.customSerializers.push(new CustomSerializer());

        const serializationService = new SerializationService(serializationConfig);

        const data = serializationService.toData(new CustomObject(3));
        const object = serializationService.toObject(data);

        expect(object.val).to.equal(3);
        expect(object.self).to.equal(object);
    });

    it('should use global serializer', function () {
        const serializationConfig = new SerializationConfigImpl();
        serializationConfig.globalSerializer = new GlobalSerializer();

        const serializationService = new SerializationService(serializationConfig);

        const data = serializationService.toData(new AnyObject(3));
        const object = serializationService.toObject(data);

        expect(object.val).to.equal(3);
        expect(object.self).to.equal(object);
    });

    it('should throw an error in the absence of a deserializer', function () {
        const serializationConfig = new SerializationConfigImpl();
        serializationConfig.globalSerializer = new GlobalSerializer();

        const serializationService = new SerializationService(serializationConfig);

        const data = serializationService.toData(123);
        const buffer = data.toBuffer();
        buffer.writeInt32BE(1 << 32 - 1, TYPE_OFFSET); // mock non-existent type

        expect(() => {
            serializationService.toObject(new HeapData(buffer));
        }).to.throw(RangeError);
    });
});
