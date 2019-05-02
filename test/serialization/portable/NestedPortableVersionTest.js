/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var Config = require('../../../.').Config;
var SerializationService = require('../../../lib/serialization/SerializationService');
var Parent = require('../PortableObjects').Parent;
var Child = require('../PortableObjects').Child;
var Util = require('../../Util');

describe('Nested Portable Version', function () {

    it('compatible versions', function () {
        var sc = new Config.SerializationConfig();
        sc.portableVersion = 6;
        sc.portableFactories[1] = {
            create: function (classId) {
                if (classId === 1) {
                    return new Parent();
                } else if (classId === 2) {
                    return new Child();
                }
                return null;
            }
        };

        var ss1 = new SerializationService.SerializationServiceV1(undefined, sc);
        var ss2 = new SerializationService.SerializationServiceV1(undefined, sc);

        // make sure ss2 cached class definition of child
        ss2.toData(new Child("Furkan"));

        // serialized parent from ss1
        var p = new Parent(new Child("Furkan"));
        var data = ss1.toData(p);

        // cached class definition of child and the class definition from data coming from ss1 should be compatible
        Util.expectAlmostEqual(p, ss2.toObject(data));
    });

});
