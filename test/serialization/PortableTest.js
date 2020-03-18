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

var Config = require('../../.').Config;
var SerializationService = require('../../lib/serialization/SerializationService');
var Long = require('long');
var Util = require('../Util');
var PortableObject = require('./PortableObjects').PortableObject;
var PortableObjectV2 = require('./PortableObjects').PortableObjectV2;
var InnerPortableObject = require('./PortableObjects').InnerPortableObject;
var SimplePortableV3 = require('./PortableObjects').SimplePortableV3;

describe('Portable Serialization', function () {
    function createSerializationService(constructorFunction) {
        var cfg = new Config.ClientConfig();
        cfg.serializationConfig.portableFactories[10] = {
            create: function (classId) {
                if (classId === 111) {
                    return new constructorFunction();
                } else if (classId === 222) {
                    return new InnerPortableObject();
                } else if (classId === 21) {
                    return new SimplePortableV3();
                }
            }
        };
        return new SerializationService.SerializationServiceV1(undefined, cfg.serializationConfig);
    }

    it('write-read', function () {
        var service = createSerializationService(PortableObject);

        var emp = new PortableObject(99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            'hazelcast', new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true], ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)], [233.2, 65.88, 657.345],
            [43645.325, 887.56756], ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]);

        var serialized = service.toData(emp);
        var deserialized = service.toObject(serialized);
        Util.expectAlmostEqual(deserialized, emp);
    });

    it('write-read v2', function () {
        var service = createSerializationService(PortableObjectV2);

        var emp = new PortableObjectV2('a_new_value', 99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true], ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)], [233.2, 65.88, 657.345],
            [43645.325, 887.56756], ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]);

        var serialized = service.toData(emp);
        var deserialized = service.toObject(serialized);
        Util.expectAlmostEqual(deserialized, emp);
    });

    it('old write - new read cross versions', function () {
        var oldService = createSerializationService(PortableObject);
        var newService = createSerializationService(PortableObjectV2);

        var empv1 = new PortableObject(99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            'hazelcast', new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true], ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)], [233.2, 65.88, 657.345],
            [43645.325, 887.56756], ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]);

        var empv2 = new PortableObjectV2(undefined, 99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true], ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)], [233.2, 65.88, 657.345],
            [43645.325, 887.56756], ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]);

        var serialized = oldService.toData(empv1);
        var deserialized = newService.toObject(serialized);
        Util.expectAlmostEqual(deserialized, empv2);
    });

    it('v3 portable containing a v2 inner portable', function () {
        var service = createSerializationService(PortableObjectV2);

        var innerPortableV2 = new PortableObjectV2('propstring', 99, true, 'a', 23, 54375456, Long.fromBits(243534, 43543654), 24.1, 32435.6533,
            new InnerPortableObject('a', 'b'), [99, 100, 101], [true, false, false, true], ['a', 'b', 'v'], [12, 545, 23, 6], [325, 6547656, 345],
            [Long.fromNumber(342534654), Long.fromNumber(-3215243654), Long.fromNumber(123123)], [233.2, 65.88, 657.345],
            [43645.325, 887.56756], ['hazelcast', 'ankara', 'istanbul', 'london', 'palo alto'],
            [new InnerPortableObject('elma', 'armut'), new InnerPortableObject('masa', 'sandalye')]);

        var portableV3 = new SimplePortableV3(innerPortableV2);
        var serialized = service.toData(portableV3);
        var deserialized = service.toObject(serialized);
        Util.expectAlmostEqual(deserialized, portableV3);
    })
});
