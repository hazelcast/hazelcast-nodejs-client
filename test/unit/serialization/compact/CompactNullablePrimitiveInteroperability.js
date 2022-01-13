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
const { createSerializationService } = require('./CompactUtil');

describe.skip('CompactNullablePrimitiveInteroperability', function () {
    const assertReadAsNullable = record => {
        record.getNullableBoolean('boolean').should.be.true;
        record.getNullableByte('byte').should.be.equal(2);
        record.getNullableShort('short').should.be.equal(4);
        record.getNullableInt('int').should.be.equal(8);
        record.getNullableLong('long').equals(Long.fromNumber(4444)).should.be.true;
        // Delta is big with floats, since we are converting a float to a double, leading to big differences.
        record.getNullableFloat('float').should.be.closeTo(8321.321, 0.001);
        record.getNullableDouble('double').should.be.closeTo(41231.32, 0.0000001);

        record.getArrayOfNullableBooleans('booleans').should.be.deep.equal([true, false]);

        // NOTE: The following line is not working for now since we deserialize eagerly to make generic api sync.
        // Fast deserialization leads to a buffer, not a number array as in the case of getArrayOfNullableBytes.

        // record.getArrayOfNullableBytes('bytes').should.be.deep.equal([1, 2]);
        record.getArrayOfNullableShorts('shorts').should.be.deep.equal([1, 4]);
        record.getArrayOfNullableInts('ints').should.be.deep.equal([1, 8]);
        record.getArrayOfNullableLongs('longs').should.be.deep.equal([Long.fromNumber(1), Long.fromNumber(4444)]);

        const floats = record.getArrayOfNullableFloats('floats');
        floats.length.should.be.equal(2);
        floats[0].should.be.closeTo(1.0, 0.001);
        floats[1].should.be.closeTo(8321.321, 0.001);

        const doubles = record.getArrayOfNullableDoubles('doubles');
        doubles.length.should.be.equal(2);
        doubles[0].should.be.closeTo(41231.32, 0.0000001);
        doubles[1].should.be.closeTo(2.0, 0.0000001);
    };

    const assertReadAsPrimitive = record => {
        record.getBoolean('boolean').should.be.true;
        record.getByte('byte').should.be.equal(4);
        record.getShort('short').should.be.equal(6);
        record.getInt('int').should.be.equal(8);
        record.getLong('long').equals(Long.fromNumber(4444)).should.be.true;
        // Delta is big with floats, since we are converting a float to a double, leading to big differences.
        record.getFloat('float').should.be.closeTo(8321.321, 0.001);
        record.getDouble('double').should.be.closeTo(41231.32, 0.0000001);

        record.getArrayOfBooleans('booleans').should.be.deep.equal([true, false]);

        // NOTE: The following line is not working for now since we deserialize eagerly to make generic api sync.
        // Fast deserialization leads to a buffer, not a number array as in the case of getArrayOfBytes.

        // record.getArrayOfBytes('bytes').should.be.deep.equal([1, 2]);
        record.getArrayOfShorts('shorts').should.be.deep.equal([1, 2]);
        record.getArrayOfInts('ints').should.be.deep.equal([1, 8]);
        record.getArrayOfLongs('longs').should.be.deep.equal([Long.fromNumber(1), Long.fromNumber(4444)]);

        const floats = record.getArrayOfFloats('floats');
        floats.length.should.be.equal(2);
        floats[0].should.be.closeTo(1.0, 0.001);
        floats[1].should.be.closeTo(8321.321, 0.001);

        const doubles = record.getArrayOfDoubles('doubles');
        doubles.length.should.be.equal(2);
        doubles[0].should.be.closeTo(41231.32, 0.0000001);
        doubles[1].should.be.closeTo(2.0, 0.0000001);
    };

    const assertReadNullAsPrimitiveThrowsException = record => {
        should.throw(() => record.getBoolean('boolean'), HazelcastSerializationError);
        should.throw(() => record.getByte('byte'), HazelcastSerializationError);
        should.throw(() => record.getShort('short'), HazelcastSerializationError);
        should.throw(() => record.getInt('int'), HazelcastSerializationError);
        should.throw(() => record.getLong('long'), HazelcastSerializationError);
        should.throw(() => record.getFloat('float'), HazelcastSerializationError);
        should.throw(() => record.getDouble('double'), HazelcastSerializationError);

        should.throw(() => record.getArrayOfBooleans('booleans'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfBytes('bytes'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfShorts('shorts'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfInts('ints'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfLongs('longs'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfFloats('floats'), HazelcastSerializationError);
        should.throw(() => record.getArrayOfDoubles('doubles'), HazelcastSerializationError);
    };

    it('should write primitive read nullable', async function () {
        const schema = {
            boolean: Fields.boolean,
            byte: Fields.byte,
            short: Fields.short,
            int: Fields.int,
            long: Fields.long,
            float: Fields.float,
            double: Fields.double,
            booleans: Fields.arrayOfBooleans,
            bytes: Fields.arrayOfBytes,
            shorts: Fields.arrayOfShorts,
            ints: Fields.arrayOfInts,
            longs: Fields.arrayOfLongs,
            floats: Fields.arrayOfFloats,
            doubles: Fields.arrayOfDoubles
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
            bytes: [1, 2],
            shorts: [1, 4],
            ints: [1, 8],
            longs: [Long.fromNumber(1), Long.fromNumber(4444)],
            floats: [1, 8321.321],
            doubles: [41231.32, 2]
        });

        record.should.be.instanceof(CompactGenericRecordImpl);
        assertReadAsNullable(record);

        const serializationService = createSerializationService();
        const data = await serializationService.toData(record);
        const serializedRecord = await serializationService.toObject(data);

        serializedRecord.should.be.instanceOf(CompactGenericRecordImpl);
        assertReadAsNullable(serializedRecord);
    });

    it('should write nullable read primitive', async function () {
        const schema = {
            boolean: Fields.nullableBoolean,
            byte: Fields.nullableByte,
            short: Fields.nullableShort,
            int: Fields.nullableInt,
            long: Fields.nullableLong,
            float: Fields.nullableFloat,
            double: Fields.nullableDouble,
            booleans: Fields.arrayOfNullableBooleans,
            bytes: Fields.arrayOfNullableBytes,
            shorts: Fields.arrayOfNullableShorts,
            ints: Fields.arrayOfNullableInts,
            longs: Fields.arrayOfNullableLongs,
            floats: Fields.arrayOfNullableFloats,
            doubles: Fields.arrayOfNullableDoubles
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
        const data = await serializationService.toData(record);
        const serializedRecord = await serializationService.toObject(data);

        serializedRecord.should.be.instanceOf(CompactGenericRecordImpl);
        assertReadAsPrimitive(serializedRecord);
    });

    it('should raise error if write null and read primitive', async function () {
        const schema = {
            boolean: Fields.nullableBoolean,
            byte: Fields.nullableByte,
            short: Fields.nullableShort,
            int: Fields.nullableInt,
            long: Fields.nullableLong,
            float: Fields.nullableFloat,
            double: Fields.nullableDouble,
            booleans: Fields.arrayOfNullableBooleans,
            bytes: Fields.arrayOfNullableBytes,
            shorts: Fields.arrayOfNullableShorts,
            ints: Fields.arrayOfNullableInts,
            longs: Fields.arrayOfNullableLongs,
            floats: Fields.arrayOfNullableFloats,
            doubles: Fields.arrayOfNullableDoubles
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
        const data = await serializationService.toData(record);
        const serializedRecord = await serializationService.toObject(data);

        serializedRecord.should.be.instanceOf(CompactGenericRecordImpl);
        assertReadNullAsPrimitiveThrowsException(serializedRecord);
    });
});
