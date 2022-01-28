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
const { CompactGenericRecordImpl, GenericRecords, UnsupportedOperationError } = require('../../../../lib');
const {
    createSerializationService,
    createMainDTO,
    MainDTOSerializer,
    InnerDTOSerializer,
    NamedDTOSerializer,
    createCompactGenericRecord,
    serialize,
    mimicSchemaReplication
} = require('./CompactUtil');
const { Fields } = require('../../../../lib/serialization/generic_record');
const Long = require('long');

describe('GenericRecordTest', function () {
    it('toString should produce valid JSON string', async () => {
        const serializationService = createSerializationService([new MainDTOSerializer(), new InnerDTOSerializer(), new NamedDTOSerializer()]);
        const serializationService2 = createSerializationService(); // serializationService that does not have the serializers
        const expectedDTO = createMainDTO();
        expectedDTO.nullableBool = null;
        expectedDTO.p.localDateTimes[0] = null;
        let data;

        data = await serialize(serializationService, expectedDTO);
        data.isCompact().should.be.true;

        mimicSchemaReplication(serializationService, serializationService2);

        // GenericRecord returned from toObject
        const genericRecord = serializationService2.toObject(data);
        genericRecord.should.instanceOf(CompactGenericRecordImpl);
        JSON.parse(genericRecord.toString());

        // GenericRecord built by API
        const genericRecord2 = createCompactGenericRecord(expectedDTO);
        genericRecord2.should.instanceOf(CompactGenericRecordImpl);
        JSON.parse(genericRecord2.toString());
    });

    it('should be able to be cloned after converted to object from data', async () => {
        const values = {
            foo: 1,
            bar: Long.fromNumber(1231)
        };

        const record = GenericRecords.compact('fooBarTypeName', {
            foo: Fields.int32,
            bar: Fields.int64
        }, values);

        const serializationService = createSerializationService();

        const data = await serialize(serializationService, record);
        const recordObj = serializationService.toObject(data);

        const cloneRecord = recordObj.clone({
            foo: 2
        });

        cloneRecord.getInt32('foo').should.be.eq(2);
        (cloneRecord.getInt64('bar').eq(Long.fromNumber(1231))).should.be.true;

        // record stays unchanged
        record.getInt32('foo').should.be.eq(1);
        (record.getInt64('bar').eq(Long.fromNumber(1231))).should.be.true;
    });

    it('should be able to be cloned after created via API', async () => {
        const values = {
            foo: 1,
            bar: Long.fromNumber(1231)
        };

        const record = GenericRecords.compact('fooBarTypeName', {
            foo: Fields.int32,
            bar: Fields.int64
        }, values);

        const cloneRecord = record.clone({
            foo: 2
        });

        cloneRecord.getInt32('foo').should.be.eq(2);
        (cloneRecord.getInt64('bar').eq(Long.fromNumber(1231))).should.be.true;

        // record stays unchanged
        record.getInt32('foo').should.be.eq(1);
        (record.getInt64('bar').eq(Long.fromNumber(1231))).should.be.true;
    })

    it('should not support reading and writing char field', async () => {
        (() => GenericRecords.compact('writeChar', {
            foo: Fields.char
        }, {
            foo: 'a'
        })).should.throw(UnsupportedOperationError, /char/);

        (() => GenericRecords.compact('readChar', {}, {}).getChar('foo')).should.throw(UnsupportedOperationError, /char/);
    });

    it('should not support reading and writing charArray field', async () => {
        (() => GenericRecords.compact('writeCharArray', {
            foo: Fields.arrayOfChar
        }, {
            foo: ['a', 'b']
        })).should.throw(UnsupportedOperationError, /char/);

        (() => GenericRecords.compact('readCharArray', {}, {}).getArrayOfChar('foo')).should.throw(UnsupportedOperationError, /char/);
    });
});
