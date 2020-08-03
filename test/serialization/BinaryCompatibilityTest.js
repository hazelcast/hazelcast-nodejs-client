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

const fs = require('fs');
const ObjectDataInput = require('../../lib/serialization/ObjectData').ObjectDataInput;
const HeapData = require('../../lib/serialization/HeapData').HeapData;
const ReferenceObjects = require('./ReferenceObjects');
const SerializationService = require('../../lib/serialization/SerializationService').SerializationServiceV1;
const SerializationConfigImpl = require('../../lib/config/SerializationConfig').SerializationConfigImpl;

const AnInnerPortable = require('./AnInnerPortable');
const AnIdentifiedDataSerializable = require('./AnIdentifiedDataSerializable');
const APortable = require('./APortable');
const CustomByteArraySerializable = require('./CustomSerializable').CustomByteArraySerializable;
const CustomStreamSerializable = require('./CustomSerializable').CustomStreamSerializable;
const expectAlmostEqual = require('../Util').expectAlmostEqual;

describe('BinaryCompatibilityTest', function () {

    const NULL_LENGTH = -1;
    const versions = [1];
    const objects = ReferenceObjects.testObjects;
    const isBigEndianValues = [true, false];

    const dataMap = {};

    function createFileName(version) {
        return version + '.serialization.compatibility.binary';
    }

    function convertEndiannesToByteOrder(isBigEndian) {
        if (isBigEndian) {
            return 'BIG_ENDIAN';
        } else {
            return 'LITTLE_ENDIAN';
        }
    }

    function stripArticle(name) {
        if (name.startsWith('an')) {
            return name.slice(2);
        } else if (name.startsWith('a')) {
            return name.slice(1);
        } else {
            if (name.endsWith('s')) {
                return name.slice(0, -1) + '[]';
            } else {
                return name;
            }
        }
    }

    function createObjectKey(varName, version, isBigEndian) {
        return version + '-' + stripArticle(varName) + '-' + convertEndiannesToByteOrder(isBigEndian);
    }

    function createSerializationService(isBigEndian, defaultNumberType) {
        const cfg = new SerializationConfigImpl();
        cfg.portableFactories[ReferenceObjects.PORTABLE_FACTORY_ID] = {
            create: function (classId) {
                if (classId === ReferenceObjects.INNER_PORTABLE_CLASS_ID) {
                    return new AnInnerPortable();
                } else if (classId === ReferenceObjects.PORTABLE_CLASS_ID) {
                    return new APortable();
                }
            }
        };
        cfg.dataSerializableFactories[ReferenceObjects.IDENTIFIED_DATA_SERIALIZABLE_FACTORY_ID] = {
            create: function (type) {
                if (type === ReferenceObjects.IDENTIFIED_DATA_SERIALIZABLE_CLASS_ID) {
                    return new AnIdentifiedDataSerializable();
                }
            }
        };
        cfg.customSerializers = [
            {
                id: ReferenceObjects.CUSTOM_BYTE_ARRAY_SERIALIZABLE_ID,
                write: function (out, object) {
                    out.writeInt(8);
                    out.writeInt(object.i);
                    out.writeFloat(object.f);
                },
                read: function (inp) {
                    const len = inp.readInt();
                    const buf = Buffer.alloc(len);
                    inp.readCopy(buf, len);
                    return new CustomByteArraySerializable(buf.readInt32BE(0), buf.readFloatBE(4));
                }
            },
            {
                id: ReferenceObjects.CUSTOM_STREAM_SERIALIZABLE_ID,
                write: function (out, object) {
                    out.writeInt(object.int);
                    out.writeFloat(object.float);
                },
                read: function (inp) {
                    return new CustomStreamSerializable(inp.readInt(), inp.readFloat());
                }
            }
        ];
        cfg.isBigEndian = isBigEndian;
        cfg.defaultNumberType = defaultNumberType;
        return new SerializationService(cfg)
    }

    before(function () {
        versions.forEach(function (version) {
            const input = new ObjectDataInput(fs.readFileSync(__dirname + '/' + createFileName(version)), 0, null, true, true);
            while (input.available() > 0) {
                const utflen = input.readUnsignedShort();
                const namebuf = Buffer.alloc(utflen);
                input.readCopy(namebuf, utflen);
                const objectKey = namebuf.toString();
                const len = input.readInt();
                if (len !== NULL_LENGTH) {
                    const otherBuffer = Buffer.alloc(len);
                    input.readCopy(otherBuffer, len);
                    dataMap[objectKey] = new HeapData(otherBuffer);
                }
            }
            dataMap[version + '-NULL-' + convertEndiannesToByteOrder(true)] = new HeapData(null);
            dataMap[version + '-NULL-' + convertEndiannesToByteOrder(false)] = new HeapData(null);
        });
    });

    for (const vn in objects) {
        (function () {
            const varName = vn;
            const object = objects[varName];
            if (objects.hasOwnProperty(varName)) {
                versions.forEach(function (version) {
                    isBigEndianValues.forEach(function (isBigEndian) {
                        it(varName + '-' + convertEndiannesToByteOrder(isBigEndian) + '-' + version, function () {
                            this.timeout(10000);
                            const key = createObjectKey(varName, version, isBigEndian);
                            const service = createSerializationService(isBigEndian, 'integer');
                            const deserialized = service.toObject(dataMap[key]);
                            expectAlmostEqual(deserialized, object);
                        });
                        if (!ReferenceObjects.skipOnSerialize[varName]) {
                            it(varName + '-' + convertEndiannesToByteOrder(isBigEndian) + '-' + version + ' serialize deserialize', function () {
                                this.timeout(10000);
                                const service = createSerializationService(isBigEndian, stripArticle(varName).toLowerCase());
                                const data = service.toData(object);
                                const deserialized = service.toObject(data);
                                expectAlmostEqual(deserialized, object);
                            });
                        }
                    });
                });
            }
        })();
    }
});
