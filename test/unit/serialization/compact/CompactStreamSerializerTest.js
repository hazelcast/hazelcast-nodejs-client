/* eslint-disable */
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
    serialize,
    createSerializationService,
    mimicSchemaReplication,
    createMainDTO,
    Bits,
    BitsSerializer,
    EmployeeSerializer,
    Employee,
    EmployerSerializer,
    Employer,
    HIRING_STATUS,
    MainDTOSerializer,
    MainDTOSerializerWithDefaults,
    InnerDTOSerializer,
    NamedDTOSerializer,
    NodeDTOSerializer,
    NodeDTO,
} = require('./CompactUtil');
const Long = require('long');
const { CompactGenericRecordImpl } = require('../../../../lib/serialization/generic_record/CompactGenericRecord');
const { GenericRecords } = require('../../../../lib');
const { Fields } = require('../../../../lib/serialization/generic_record');

describe('CompactStreamSerializerTest', function () {
    it('should work with all fields', async function (){
        const serializationService = createSerializationService([new MainDTOSerializer(), new InnerDTOSerializer(), new NamedDTOSerializer()]);

        const mainDTO = createMainDTO();
        const data = await serialize(serializationService, mainDTO);
        const object = serializationService.toObject(data);

        object.should.deep.equal(mainDTO);
    });

    it('should work with all fields and defaults enabled serializer', async function (){
        const serializationService = createSerializationService([new MainDTOSerializerWithDefaults(), new InnerDTOSerializer(), new NamedDTOSerializer()]);

        const mainDTO = createMainDTO();
        const data = await serialize(serializationService, mainDTO);
        const object = serializationService.toObject(data);

        object.should.deep.equal(mainDTO);
    });

    it('should work with recursive fields', async function (){
        const serializationService = createSerializationService([new NodeDTOSerializer()]);

        const node = new NodeDTO(0, new NodeDTO(1, new NodeDTO(2, null)));
        const data = await serialize(serializationService, node);
        const object = serializationService.toObject(data);

        object.should.deep.equal(node);
    });

    it('should deserialize to generic record when serializer is not registered', async function (){
        const serializationService = createSerializationService([new EmployeeSerializer()]);

        const employee = new Employee(30, Long.ONE);
        const data = await serialize(serializationService, employee);

        const serializationService2 = createSerializationService();

        mimicSchemaReplication(serializationService, serializationService2);

        const object = serializationService2.toObject(data);

        object.should.be.instanceof(CompactGenericRecordImpl);
        object.getInt32('age').should.be.eq(30);
        (object.getInt64('id').eq(Long.ONE)).should.be.true;
    });

    it('should work with evolved schema when field added', async function (){
        class EmployeeSerializerV2 {
            constructor() {
                this.hzClassName = 'Employee';
            }

            read(reader) {
                // no-op
            }

            write(writer, value) {
                writer.writeInt32('age', value.age);
                writer.writeInt64('id', value.id);
                writer.writeString('name', 'sir'); // This is not a recommended usage, but it is for test
            }
        }

        const serializationService = createSerializationService([new EmployeeSerializerV2()]);

        const expected = new Employee(30, Long.ONE);
        const data = await serialize(serializationService, expected);

        const serializationService2 = createSerializationService([new EmployeeSerializer()]);

        mimicSchemaReplication(serializationService, serializationService2);

        const actual = serializationService2.toObject(data);

        actual.age.should.be.eq(expected.age);
        (actual.id.eq(expected.id)).should.be.true;
    });

    it('should work with evolved schema when field removed and default value set', async function (){
        class EmployeeSerializerV2 {
            constructor() {
                this.hzClassName = 'Employee';
            }

            read(reader) {
                // no-op
            }

            write(writer, value) {
                writer.writeInt32('age', value.age);
            }
        }

        const serializationService = createSerializationService([new EmployeeSerializerV2()]);

        const expected = new Employee(30, Long.ONE);
        const data = await serialize(serializationService, expected);

        const serializationService2 = createSerializationService([new EmployeeSerializer()]);

        mimicSchemaReplication(serializationService, serializationService2);

        const actual = serializationService2.toObject(data);

        actual.age.should.be.eq(expected.age);
        (actual.id.eq(Long.ZERO)).should.be.true;
    });

    it('should work with evolved schema with generic records', async function (){
        const serializationService = createSerializationService();
        const record = GenericRecords.compact('fooBarTypeName', {
            foo: Fields.int32,
            bar: Fields.int64
        }, {
            foo: 10,
            bar: Long.ONE
        });

        const data = await serialize(serializationService, record);

        const serializationService2 = createSerializationService();

        const record2 = GenericRecords.compact('fooBarTypeName', {
            foo: Fields.int32,
            bar: Fields.int64,
            foobar: Fields.string
        }, {
            foo: 10,
            bar: Long.ONE,
            foobar: 'new field'
        });

        await serialize(serializationService2, record2);

        mimicSchemaReplication(serializationService, serializationService2);

        const obj = serializationService2.toObject(data);
        obj.hasField('foobar').should.be.false;

        obj.getInt32('foo').should.be.eq(record.getInt32('foo'));
        (obj.getInt64('bar').eq(record.getInt64('bar'))).should.be.true;
    });

    it('should work with Bits', async function () {
        const serializationService = createSerializationService([new BitsSerializer()]);

        const bits = new Bits();
        bits.a = true;
        bits.h = true;
        bits.id = 121;
        bits.booleans = Array(8).fill(false);
        bits.booleans[0] = true;
        bits.booleans[4] = true;

        const data = await serialize(serializationService, bits);

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

        const data = await serialize(serializationService, employer);
        const object = await serializationService.toObject(data);
        object.should.be.deep.equal(employer);
    });
});
