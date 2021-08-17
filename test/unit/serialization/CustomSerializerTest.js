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

const { expect } = require('chai');
const { SerializationServiceV1 } = require('../../../lib/serialization/SerializationService');
const { SerializationConfigImpl } = require('../../../lib/config/SerializationConfig');

describe('CustomSerializerTest', function () {
    let service;

    class CustomObject {
        constructor(surname) {
            this.surname = surname;
            this.hzCustomId = 10;
        }
    }

    before(function () {
        const cfg = new SerializationConfigImpl();
        cfg.customSerializers = [
            {
                id: 10,
                write: function (out, emp) {
                    out.writeString(emp.surname);
                },
                read: function (inp) {
                    const obj = new CustomObject();
                    obj.surname = inp.readString();
                    return obj;
                }
            }
        ];
        service = new SerializationServiceV1(cfg);
    });

    it('write-read', function () {
        const emp = new CustomObject('iman');
        const serialized = service.toData(emp);
        const deserialized = service.toObject(serialized);
        return expect(deserialized).to.deep.equal(emp);
    });
});
