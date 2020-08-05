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

const SerializationConfigImpl = require('../../../lib/config/SerializationConfig').SerializationConfigImpl;
const SerializationServiceV1 = require('../../../lib/serialization/SerializationService').SerializationServiceV1;
const Parent = require('../PortableObjects').Parent;
const Child = require('../PortableObjects').Child;
const Util = require('../../Util');

describe('NestedPortableVersionTest', function () {

    it('compatible versions', function () {
        const sc = new SerializationConfigImpl();
        sc.portableVersion = 6;
        sc.portableFactories[1] = (classId) => {
            if (classId === 1) {
                return new Parent();
            } else if (classId === 2) {
                return new Child();
            }
            return null;
        };

        const ss1 = new SerializationServiceV1(sc);
        const ss2 = new SerializationServiceV1(sc);

        // make sure ss2 cached class definition of child
        ss2.toData(new Child("Furkan"));

        // serialized parent from ss1
        const p = new Parent(new Child("Furkan"));
        const data = ss1.toData(p);

        // cached class definition of child and the class definition from data coming from ss1 should be compatible
        Util.expectAlmostEqual(p, ss2.toObject(data));
    });
});
