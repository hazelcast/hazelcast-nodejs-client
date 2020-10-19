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
/* eslint-disable */
'use strict';

const { expect } = require('chai');
const { SerializationServiceV1 } = require('../../lib/serialization/SerializationService');
const { SerializationConfigImpl } = require('../../lib/config/SerializationConfig');
const { JsonStringDeserializationPolicy } = require('../../.');
const { HazelcastJsonValue } = require('../../.');

describe('JsonSerializersTest', function () {

    const object = { key: 'value' };
    const hzJsonValue = new HazelcastJsonValue(JSON.stringify(object));

    it('jsonSerializer serialize-deserialize object', function () {
        const serializationService = new SerializationServiceV1(new SerializationConfigImpl());
        const serialized = serializationService.toData(object);
        expect(serializationService.toObject(serialized)).to.deep.equal(object);
    });

    it('jsonSerializer serialize-deserialize HazelcastJsonValue', function () {
        const serializationService = new SerializationServiceV1(new SerializationConfigImpl());
        const serialized = serializationService.toData(hzJsonValue);
        expect(serializationService.toObject(serialized)).to.deep.equal(object);
    });

    it('hazelcastJsonValueSerializer serialize-deserialize object', function () {
        const serializationConfig = new SerializationConfigImpl();
        serializationConfig
            .jsonStringDeserializationPolicy = JsonStringDeserializationPolicy.NO_DESERIALIZATION;
        const serializationService = new SerializationServiceV1(serializationConfig);

        const serialized = serializationService.toData(object);
        const deserialized = serializationService.toObject(serialized);

        expect(deserialized).to.be.an.instanceof(HazelcastJsonValue);
        expect(deserialized).to.deep.equal(hzJsonValue);
        expect(JSON.parse(deserialized.toString())).to.deep.equal(object);
    });

    it('hazelcastJsonValueSerializer serialize-deserialize HazelcastJsonValue', function () {
        const serializationConfig = new SerializationConfigImpl();
        serializationConfig
            .jsonStringDeserializationPolicy = JsonStringDeserializationPolicy.NO_DESERIALIZATION;

        const serializationService = new SerializationServiceV1(serializationConfig);
        const serialized = serializationService.toData(hzJsonValue);
        const deserialized = serializationService.toObject(serialized);

        expect(deserialized).to.be.an.instanceof(HazelcastJsonValue);
        expect(deserialized).to.deep.equal(hzJsonValue);
        expect(JSON.parse(deserialized.toString())).to.deep.equal(object);
    });
});
