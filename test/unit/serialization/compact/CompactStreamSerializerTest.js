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
const {
    createSerializationService,
    Bits,
    BitsSerializer,
    EmployeeSerializer,
    Employee,
    EmployerSerializer,
    Employer,
    HIRING_STATUS
} = require('./CompactUtil');
const Long = require('long');

describe('CompactStreamSerializerTest', function () {
    it('should work with Bits', async function () {
        const serializationService = createSerializationService([new BitsSerializer()]);

        const bits = new Bits();
        bits.a = true;
        bits.h = true;
        bits.id = 121;
        bits.booleans = Array(8).fill(false);
        bits.booleans[0] = true;
        bits.booleans[4] = true;

        const data = await serializationService.toData(bits);

        // hash(4) + typeid(4) + schemaId(8) + (4 byte length) + (1 bytes for 8 bits) + (4 bytes for int)
        // (4 byte length of byte array) + (1 byte for booleans array of 8 bits) + (1 byte offset bytes)
        data.toBuffer().length.should.be.equal(31);
        const object = await serializationService.toObject(data);
        object.should.be.deep.equal(bits);
    });

    it('should work with nested fields', async function () {
        const serializationService = createSerializationService([new EmployeeSerializer(), new EmployerSerializer()]);

        const employee = new Employee(30, Long.fromNumber(102310312));
        const ids = [Long.fromNumber(22), Long.fromNumber(44)];

        const employees = Array(5);
        for (let i = 0; i < employees.length; i++) {
            employees[i] = new Employee(20 + i, Long.fromNumber(i).mul(100));
        }
        const employer = new Employer('nbss', 40, HIRING_STATUS.HIRING, ids, employee, employees);

        const data = await serializationService.toData(employer);
        const object = await serializationService.toObject(data);
        object.should.be.deep.equal(employer);
    });
});
