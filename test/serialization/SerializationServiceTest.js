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

const expect = require('chai').expect;
const SerializationService = require('../../lib/serialization/SerializationService').SerializationServiceV1;
const SerializationConfigImpl = require('../../lib/config/SerializationConfig').SerializationConfigImpl;

describe('SerializationServiceTest', function () {

    it('should use data serializable factory', function () {
        const serializationConfig = new SerializationConfigImpl();
        serializationConfig.dataSerializableFactories[1] = new IDataSerializableFactory();

        const serializationService = new SerializationService(serializationConfig);

        const data = serializationService.toData(new IDataSerializable(3));
        const object = serializationService.toObject(data);

        expect(object.val).to.equal(3);
    });

    it('should use portable factory', function () {
        const serializationConfig = new SerializationConfigImpl();
        serializationConfig.portableFactories[2] = new PortableFactory();

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
});

function IDataSerializable(val) {
    this.val = val;
}

IDataSerializable.prototype.readData = function (input) {
    this.val = input.readInt();
};

IDataSerializable.prototype.writeData = function (output) {
    output.writeInt(this.val);
};

IDataSerializable.prototype.getClassId = function () {
    return 11;
};

IDataSerializable.prototype.getFactoryId = function () {
    return 1;
};

function IDataSerializableFactory() {
}

IDataSerializableFactory.prototype.create = function (type) {
    if (type === 11) {
        return new IDataSerializable();
    }
};

function Portable(val) {
    this.val = val;
}

Portable.prototype.getClassId = function () {
    return 22;
};

Portable.prototype.getFactoryId = function () {
    return 2;
};

Portable.prototype.readPortable = function (reader) {
    this.val = reader.readInt('val');
};

Portable.prototype.writePortable = function (writer) {
    writer.writeInt('val', this.val);
};

function PortableFactory() {
}

PortableFactory.prototype.create = function (classId) {
    if (classId === 22) {
        return new Portable();
    }
};

function AnyObject(val) {
    this.val = val;
    // Put a reference to self so json serializer cannot be used. Make sure global serializer is used in test.
    this.self = this;
}

function GlobalSerializer() {
}

GlobalSerializer.prototype.getId = function () {
    return 33;
};

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
    // Put a reference to self so json serializer cannot be used. Make sure global serializer is used in test.
    this.self = this;
}

CustomObject.prototype.hzGetCustomId = function () {
    return 44;
};

function CustomSerializer() {
}

CustomSerializer.prototype.getId = function () {
    return 44;
};

CustomSerializer.prototype.read = function (reader) {
    const obj = new CustomObject();
    obj.val = reader.readInt();
    return obj;
};

CustomSerializer.prototype.write = function (writer, obj) {
    writer.writeInt(obj.val);
};

exports.IDataSerializableFactory = IDataSerializableFactory;
exports.PortableFactory = PortableFactory;
exports.GlobalSerializer = GlobalSerializer;
exports.CustomSerializer = CustomSerializer;
