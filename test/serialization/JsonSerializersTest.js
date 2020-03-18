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

var expect = require('chai').expect;
var Config = require('../../.').Config;
var SerializationServiceV1 = require('../../lib/serialization/SerializationService').SerializationServiceV1;
var HazelcastJsonValue = require('../../.').HazelcastJsonValue;

describe('Json serializers test', function () {
    var object = { key: 'value' };
    var hzJsonValue = new HazelcastJsonValue(JSON.stringify(object));

    it('jsonSerializer serialize-deserialize object', function () {
        var serializationService = new SerializationServiceV1(undefined, new Config.ClientConfig().serializationConfig);
        var serialized = serializationService.toData(object);
        expect(serializationService.toObject(serialized)).to.deep.equal(object);
    });

    it('jsonSerializer serialize-deserialize HazelcastJsonValue', function () {
        var serializationService = new SerializationServiceV1(undefined, new Config.ClientConfig().serializationConfig);
        var serialized = serializationService.toData(hzJsonValue);
        expect(serializationService.toObject(serialized)).to.deep.equal(object);
    });

    it('hazelcastJsonValueSerializer serialize-deserialize object', function () {
        var serializationConfig = new Config.ClientConfig().serializationConfig;
        serializationConfig
            .jsonStringDeserializationPolicy = Config.JsonStringDeserializationPolicy.NO_DESERIALIZATION;
        var serializationService = new SerializationServiceV1(undefined, serializationConfig);
        var serialized = serializationService.toData(object);
        var deserialized = serializationService.toObject(serialized);
        expect(deserialized).to.be.an.instanceof(HazelcastJsonValue);
        expect(deserialized).to.deep.equal(hzJsonValue);
        expect(JSON.parse(deserialized.toString())).to.deep.equal(object);
    });

    it('hazelcastJsonValueSerializer serialize-deserialize HazelcastJsonValue', function () {
        var serializationConfig = new Config.ClientConfig().serializationConfig;
        serializationConfig
            .jsonStringDeserializationPolicy = Config.JsonStringDeserializationPolicy.NO_DESERIALIZATION;
        var serializationService = new SerializationServiceV1(undefined, serializationConfig);
        var serialized = serializationService.toData(hzJsonValue);
        var deserialized = serializationService.toObject(serialized);
        expect(deserialized).to.be.an.instanceof(HazelcastJsonValue);
        expect(deserialized).to.deep.equal(hzJsonValue);
        expect(JSON.parse(deserialized.toString())).to.deep.equal(object);
    });
});
