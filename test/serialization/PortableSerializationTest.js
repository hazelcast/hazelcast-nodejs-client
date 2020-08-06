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

const SerializationConfigImpl = require('../../lib/config/SerializationConfig').SerializationConfigImpl;
const SerializationServiceV1 = require('../../lib/serialization/SerializationService').SerializationServiceV1;
const Long = require('long');
const Util = require('../Util');

const PortableObject = require('./PortableObjects').PortableObject;
const PortableObjectV2 = require('./PortableObjects').PortableObjectV2;
const InnerPortableObject = require('./PortableObjects').InnerPortableObject;
const SimplePortableV3 = require('./PortableObjects').SimplePortableV3;

describe('PortableSerializationTest', function () {

    function createSerializationService(Ctor) {
        const cfg = new SerializationConfigImpl();
        cfg.portableFactories[10] = {
            create: function (classId) {
                if (classId === 111) {
                    return new Ctor();
                } else if (classId === 222) {
                    return new InnerPortableObject();
                } else if (classId === 21) {
                    return new SimplePortableV3();
                }
            }
        };
        return new SerializationServiceV1(cfg);
    }

    it('write-read', function () {
        const service = createSerializationService(PortableObject);
        const emp = new PortableObject(
            99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            'hazelcast', new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true], ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)], [233.2, 65.88, 657.345],
            [43645.325, 887.56756], ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]
        );

        const serialized = service.toData(emp);
        const deserialized = service.toObject(serialized);

        Util.expectAlmostEqual(deserialized, emp);
    });

    it('write-read v2', function () {
        const service = createSerializationService(PortableObjectV2);

        const emp = new PortableObjectV2(
            'a_new_value', 99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true],
            ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)],
            [233.2, 65.88, 657.345], [43645.325, 887.56756],
            ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]
        );

        const serialized = service.toData(emp);
        const deserialized = service.toObject(serialized);

        Util.expectAlmostEqual(deserialized, emp);
    });

    it('old write - new read cross versions', function () {
        const oldService = createSerializationService(PortableObject);
        const newService = createSerializationService(PortableObjectV2);

        const empv1 = new PortableObject(
            99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            'hazelcast', new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true],
            ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)],
            [233.2, 65.88, 657.345], [43645.325, 887.56756],
            ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]
        );
        const empv2 = new PortableObjectV2(
            undefined, 99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true],
            ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)],
            [233.2, 65.88, 657.345], [43645.325, 887.56756],
            ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]
        );

        const serialized = oldService.toData(empv1);
        const deserialized = newService.toObject(serialized);

        Util.expectAlmostEqual(deserialized, empv2);
    });

    it('v3 portable containing a v2 inner portable', function () {
        const service = createSerializationService(PortableObjectV2);

        const innerPortableV2 = new PortableObjectV2(
            'propstring', 99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true],
            ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)],
            [233.2, 65.88, 657.345], [43645.325, 887.56756],
            ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]
        );

        const portableV3 = new SimplePortableV3(innerPortableV2);
        const serialized = service.toData(portableV3);
        const deserialized = service.toObject(serialized);

        Util.expectAlmostEqual(deserialized, portableV3);
    })
});
