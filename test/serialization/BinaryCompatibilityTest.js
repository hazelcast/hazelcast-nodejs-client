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
var fs = require('fs');
var ObjectDataInput = require('../../lib/serialization/ObjectData').ObjectDataInput;
var HeapData = require('../../lib/serialization/HeapData').HeapData;
var Config = require('../../.').Config;
var ReferenceObjects = require('./ReferenceObjects');
var SerializationService = require('../../lib/serialization/SerializationService').SerializationServiceV1;
var AnInnerPortable = require('./AnInnerPortable');
var AnIdentifiedDataSerializable = require('./AnIdentifiedDataSerializable');
var APortable = require('./APortable');
var CustomByteArraySerializable = require('./CustomSerializable').CustomByteArraySerializable;
var CustomStreamSerializable = require('./CustomSerializable').CustomStreamSerializable;
var expectAlmostEqual = require('../Util').expectAlmostEqual;
var StringSerializationPolicy = require('../../.').StringSerializationPolicy;

describe('Binary serialization compatibility test', function () {

    var NULL_LENGTH = -1;
    var versions = [1];
    var objects = ReferenceObjects.testObjects;
    var isBigEndianValues = [true, false];
    var isStandardUTFValues = [true, false];

    var dataMap = {};

    function createFileName(version) {
        return version + '.serialization.compatibility.binary';
    }

    function convertEndiannesToByteOrder(isBigEndian) {
        if (isBigEndian)
            return 'BIG_ENDIAN';
        else
            return 'LITTLE_ENDIAN';
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

    function createSerializationService(isBigEndian, isStandardUTF, defaultNumberType) {
        var cfg = new Config.ClientConfig().serializationConfig;
        cfg.portableFactories[ReferenceObjects.PORTABLE_FACTORY_ID] = {
            create: function (classId) {
                if (classId === ReferenceObjects.INNER_PORTABLE_CLASS_ID) {
                    return new AnInnerPortable();
                } else if (classId == ReferenceObjects.PORTABLE_CLASS_ID) {
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
        cfg.customSerializers.push({
            getId: function () {
                return ReferenceObjects.CUSTOM_BYTE_ARRAY_SERILAZABLE_ID;
            },
            write: function (out, object) {
                out.writeInt(8);
                out.writeInt(object.i);
                out.writeFloat(object.f);
            },
            read: function (inp) {
                var len = inp.readInt();
                var buf = Buffer.alloc(len);
                inp.readCopy(buf, len);
                return new CustomByteArraySerializable(buf.readInt32BE(0), buf.readFloatBE(4));
            }
        });
        cfg.customSerializers.push({
            getId: function () {
                return ReferenceObjects.CUSTOM_STREAM_SERILAZABLE_ID;
            },
            write: function (out, object) {
                out.writeInt(object.int);
                out.writeFloat(object.float);
            },
            read: function (inp) {
                return new CustomStreamSerializable(inp.readInt(), inp.readFloat());
            }
        });
        cfg.isBigEndian = isBigEndian;
        cfg.stringSerializationPolicy = isStandardUTF
            ? StringSerializationPolicy.STANDARD
            : StringSerializationPolicy.LEGACY;
        cfg.defaultNumberType = defaultNumberType;
        return new SerializationService(undefined, cfg)
    }

    before(function () {
        versions.forEach(function (version) {
            var input = new ObjectDataInput(fs.readFileSync(__dirname + '/' + createFileName(version)), 0, null, true, true);
            while (input.available() > 0) {
                var utflen = input.readUnsignedShort();
                var namebuf = Buffer.alloc(utflen);
                input.readCopy(namebuf, utflen);
                var objectKey = namebuf.toString();
                var len = input.readInt();
                if (len !== NULL_LENGTH) {
                    var otherBuffer = Buffer.alloc(len);
                    input.readCopy(otherBuffer, len);
                    dataMap[objectKey] = new HeapData(otherBuffer);
                }
            }
            dataMap[version + '-NULL-' + convertEndiannesToByteOrder(true)] = new HeapData(null);
            dataMap[version + '-NULL-' + convertEndiannesToByteOrder(false)] = new HeapData(null);
        });
    });

    for (var vn in objects) {
        (function () {
            var varName = vn;
            var object = objects[varName];
            if (objects.hasOwnProperty(varName)) {
                versions.forEach(function (version) {
                    isBigEndianValues.forEach(function (isBigEndian) {
                        isStandardUTFValues.forEach(function (isStandardUTF) {
                            it(varName + '-' + convertEndiannesToByteOrder(isBigEndian) + '-' + isStandardUTF + '-' + version, function () {
                                this.timeout(10000);
                                var key = createObjectKey(varName, version, isBigEndian);
                                var service = createSerializationService(isBigEndian, isStandardUTF, 'integer');
                                var deserialized = service.toObject(dataMap[key]);
                                expectAlmostEqual(deserialized, object);
                            });
                            if (!ReferenceObjects.skipOnSerialize[varName]) {
                                it(varName + '-' + convertEndiannesToByteOrder(isBigEndian) + '-' + isStandardUTF + '-' + version + ' serialize deserialize', function () {
                                    this.timeout(10000);
                                    var service = createSerializationService(isBigEndian, isStandardUTF, stripArticle(varName).toLowerCase());
                                    var data = service.toData(object);
                                    var deserialized = service.toObject(data);
                                    expectAlmostEqual(deserialized, object);
                                });
                            }
                        });
                    });
                });
            }
        })();
    }
});
