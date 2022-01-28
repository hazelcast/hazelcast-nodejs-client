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
const Long = require('long');
const should = chai.should();
const { Fields, GenericRecords, CompactGenericRecordImpl, HazelcastSerializationError } = require('../../../../lib');
const { createSerializationService, serialize } = require('./CompactUtil');

describe('CompactNullablePrimitiveInteroperability', function () {
    const assertReadAsNullable = record => {
        record.getNullableBoolean('boolean').should.be.true;
        record.getNullableInt8('byte').should.be.equal(2);
        record.getNullableInt16('short').should.be.equal(4);
        record.getNullableInt32('int').should.be.equal(8);
        record.getNullableInt64('long').equals(Long.fromNumber(4444)).should.be.true;
        // Delta is big with floats, since we are converting a float to a double, leading to big differences.
        record.getNullableFloat32('float').should.be.closeTo(8321.321, 0.001);
        record.getNullableFloat64('double').should.be.closeTo(41231.32, 0.0000001);

        record.getArrayOfNullableBoolean('booleans').should.be.deep.equal([true, false]);

        // NOTE: The following line is not working for now since we deserialize eagerly to make generic api sync.
        // Fast deserialization leads to a buffer, not a number array as in the case of getArrayOfNullableInt8.

        // record.getArrayOfNullableInt8('bytes').should.be.deep.equal([1, 2]);
        record.getArrayOfNullableInt16('shorts').should.be.deep.equal([1, 4]);
        record.getArrayOfNullableInt32('ints').should.be.deep.equal([1, 8]);
        record.getArrayOfNullableInt64('longs').should.be.deep.equal([Long.fromNumber(1), Long.fromNumber(4444)]);

        const floats = record.getArrayOfNullableFloat32('floats');
        floats.length.should.be.equal(2);
        floats[0].should.be.closeTo(1.0, 0.001);
        floats[1].should.be.closeTo(8321.321, 0.001);

        const doubles = record.getArrayOfNullableFloat64('doubles');
        doubles.length.should.be.equal(2);
        doubles[0].should.be.closeTo(41231.32, 0.0000001);
        doubles[1].should.be.closeTo(2.0, 0.0000001);
    };

    const assertReadAsPrimitive = record => {
        record.getBoolean('boolean').should.be.true;
        record.getInt8('byte').should.be.equal(4);
        record.getInt16('short').should.be.equal(6);
        record.getInt32('int').should.be.equal(8);
        record.getInt64('long').equals(Long.fromNumber(4444)).should.be.true;
        // Delta is big with floats, since we are converting a float to a double, leading to big differences.
        record.getFloat32('float').should.be.closeTo(8321.321, 0.001);
        record.getFloat64('double').should.be.closeTo(41231.32, 0.0000001);

        record.getArrayOfBoolean('booleans').should.be.deep.equal([true, false]);

        // NOTE: The following line is not working for now since we deserialize eagerly to make generic api sync.
        // Fast deserialization leads to a buffer, not a number array as in the case of getArrayOfBytes.

        // record.getArrayOfBytes('bytes').should.be.deep.equal([1, 2]);
        record.getArrayOfInt16('shorts').should.be.deep.equal([1, 2]);
        record.getArrayOfInt32('ints').should.be.deep.equal([1, 8]);
        record.getArrayOfInt64('longs').should.be.deep.equal([Long.fromNumber(1), Long.fromNumber(4444)]);

        const floats = record.getArrayOfFloat32('floats');
        floats.length.should.be.equal(2);
        floats[0].should.be.closeTo(1.0, 0.001);
        floats[1].should.be.closeTo(8321.321, 0.001);

        const doubles = record.getArrayOfFloat64('doubles');
        doubles.length.should.be.equal(2);
        doubles[0].should.be.closeTo(41231.32, 0.0000001);
        doubles[1].should.be.closeTo(2.0, 0.0000001);
    };

    const assertReadNullAsPrimitiveThrowsException = record => {
        should.throw(() => record.getBoolean('boolean'), HazelcastSerializationError);
        should.throw(() => record.getInt8('byte'), HazelcastSerializationError);
        should.throw(() => record.getInt16('short'), HazelcastSerializationError);
        should.throw(() => record.getInt32('int'), HazelcastSerializationError);
        should.throw(() => record.getInt64('long'), HazelcastSerializationError);
        should.throw(() => record.getFloat32('float'), HazelcastSerializationError);
        should.throw(() => record.getFloat64('double'), HazelcastSerializationError);

        should.throw(() => record.getArrayOfBoolean('booleans'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfInt8('bytes'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfInt16('shorts'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfInt32('ints'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfInt64('longs'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfFloat32('floats'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfFloat64('doubles'), HazelcastSerializationError);
    };

    it('should write primitive read nullable', async function () {
        const schema = {
            boolean: Fields.boolean,
            byte: Fields.int8,
            short: Fields.int16,
            int: Fields.int32,
            long: Fields.int64,
            float: Fields.float32,
            double: Fields.float64,
            booleans: Fields.arrayOfBoolean,
            bytes: Fields.arrayOfInt8,
            shorts: Fields.arrayOfInt16,
            ints: Fields.arrayOfInt32,
            longs: Fields.arrayOfInt64,
            floats: Fields.arrayOfFloat32,
            doubles: Fields.arrayOfFloat64
        };

        const record = GenericRecords.compact('test', schema, {
            boolean: true,
            byte: 2,
            short: 4,
            int: 8,
            long: Long.fromNumber(4444),
            float: 8321.321,
            double: 41231.32,
            booleans: [true, false],
            bytes: Buffer.from([1, 2]),
            shorts: [1, 4],
            ints: [1, 8],
            longs: [Long.fromNumber(1), Long.fromNumber(4444)],
            floats: [1, 8321.321],
            doubles: [41231.32, 2]
        });

        record.should.be.instanceof(CompactGenericRecordImpl);
        assertReadAsNullable(record);

        const serializationService = createSerializationService();
        const data = await serialize(serializationService, record);
        const serializedRecord = serializationService.toObject(data);

        serializedRecord.should.be.instanceOf(CompactGenericRecordImpl);
        assertReadAsNullable(serializedRecord);
    });

    it('should write nullable read primitive', async function () {
        const schema = {
            boolean: Fields.nullableBoolean,
            byte: Fields.nullableInt8,
            short: Fields.nullableInt16,
            int: Fields.nullableInt32,
            long: Fields.nullableInt64,
            float: Fields.nullableFloat32,
            double: Fields.nullableFloat64,
            booleans: Fields.arrayOfNullableBoolean,
            bytes: Fields.arrayOfNullableInt8,
            shorts: Fields.arrayOfNullableInt16,
            ints: Fields.arrayOfNullableInt32,
            longs: Fields.arrayOfNullableInt64,
            floats: Fields.arrayOfNullableFloat32,
            doubles: Fields.arrayOfNullableFloat64
        };

        const record = GenericRecords.compact('test', schema, {
            boolean: true,
            byte: 4,
            short: 6,
            int: 8,
            long: Long.fromNumber(4444),
            float: 8321.321,
            double: 41231.32,
            booleans: [true, false],
            bytes: [1, 2],
            shorts: [1, 2],
            ints: [1, 8],
            longs: [Long.fromNumber(1), Long.fromNumber(4444)],
            floats: [1, 8321.321],
            doubles: [41231.32, 2.0]
        });

        record.should.be.instanceof(CompactGenericRecordImpl);
        assertReadAsPrimitive(record);

        const serializationService = createSerializationService();
        const data = await serialize(serializationService, record);
        const serializedRecord = serializationService.toObject(data);

        serializedRecord.should.be.instanceOf(CompactGenericRecordImpl);
        assertReadAsPrimitive(serializedRecord);
    });

    it('should raise error if write null and read primitive', async function () {
        const schema = {
            boolean: Fields.nullableBoolean,
            byte: Fields.nullableInt8,
            short: Fields.nullableInt16,
            int: Fields.nullableInt32,
            long: Fields.nullableInt64,
            float: Fields.nullableFloat32,
            double: Fields.nullableFloat64,
            booleans: Fields.arrayOfNullableBoolean,
            bytes: Fields.arrayOfNullableInt8,
            shorts: Fields.arrayOfNullableInt16,
            ints: Fields.arrayOfNullableInt32,
            longs: Fields.arrayOfNullableInt64,
            floats: Fields.arrayOfNullableFloat32,
            doubles: Fields.arrayOfNullableFloat64
        };

        const record = GenericRecords.compact('test', schema, {
            boolean: null,
            byte: null,
            short: null,
            int: null,
            long: null,
            float: null,
            double: null,
            booleans: [null, false],
            bytes: [1, null],
            shorts: [null, 2],
            ints: [1, null],
            longs: [null, Long.fromNumber(2)],
            floats: [null, 2.0],
            doubles: [1.0, null]
        });

        assertReadNullAsPrimitiveThrowsException(record);

        const serializationService = createSerializationService();
        const data = await serialize(serializationService, record);
        const serializedRecord = serializationService.toObject(data);

        serializedRecord.should.be.instanceOf(CompactGenericRecordImpl);
        assertReadNullAsPrimitiveThrowsException(serializedRecord);
    });
});
