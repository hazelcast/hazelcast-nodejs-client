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

const chai = require('chai');
chai.should();
const { HazelcastJsonValue } = require('../../../lib');
const { SerializationConfigImpl } = require('../../../lib/config/SerializationConfig');
const { SerializationServiceV1 } = require('../../../lib/serialization/SerializationService');
const { SimplePortable } = require('./PortableObjects');

const portableFactory = classId => {
    if (classId === 1) {
        return new SimplePortable();
    }
    return null;
};

describe('HeapDataTest', function () {
    const serializationConfig = new SerializationConfigImpl();
    serializationConfig.portableFactories = {
        1: portableFactory
    };
    const serializationService = new SerializationServiceV1(serializationConfig, {});

    it('isPortable', function () {
        serializationService.toData(new SimplePortable('s')).isPortable().should.be.true;
        for (const obj of [[], 2, '', 'a', {}, class A {}, BigInt(1), null]) {
            serializationService.toData(obj).isPortable().should.be.false;
        }
    });

    it('isJson', function () {
        serializationService.toData({a: 1, b: 's'}).isJson().should.be.true;
        serializationService.toData({}).isJson().should.be.true;
        serializationService.toData(new HazelcastJsonValue(JSON.stringify({a: 1, b: 's'}))).isJson().should.be.true;
        serializationService.toData(new HazelcastJsonValue(JSON.stringify({}))).isJson().should.be.true;
        for (const obj of [2, '', 'a', BigInt(1), null]) {
            serializationService.toData(obj).isJson().should.be.false;
        }
    });
});
