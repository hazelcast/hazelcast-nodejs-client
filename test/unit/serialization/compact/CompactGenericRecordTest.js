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
    mimicSchemaReplication,
    validationTestParams,
    referenceObjects,
    Employee
} = require('../../../integration/backward_compatible/parallel/serialization/compact/CompactUtil');
const { Fields, FieldKind } = require('../../../../lib/serialization/generic_record');
const { CompactStreamSerializer } = require('../../../../lib/serialization/compact/CompactStreamSerializer');
const Long = require('long');

const testIntRange = (invalidValueFn, validValueFn) => {
    for (const test of [
        {
            field: Fields.int8,
            validValues: [-128, 127, 12, 0, 122],
            invalidValues: [11111111, -129, -1232, 128, 1000]
        },
        {
            field: Fields.int16,
            validValues: [-128, 127, 12, 0, 122, -32768, 32767, 10000, -10000],
            invalidValues: [11111111, 32768, 52768, -32769, -132768]
        },
        {
            field: Fields.int32,
            validValues: [-128, 127, 12, 0, 122, -32768, 32767, 10000, -10000, 1234567890, -1234567890, -2147483648, 2147483647],
            invalidValues: [Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, -2147483649, 2147483648, 2147483648213]
        }
    ]) {
        test.invalidValues.forEach(invalidValue => invalidValueFn(test.field, invalidValue));
        test.validValues.forEach(validValue => validValueFn(test.field, validValue));
    }
};

describe('CompactGenericRecordTest', function () {
    it('toString should produce valid JSON string', async function() {
        const serializationService = createSerializationService(
            [new MainDTOSerializer(), new InnerDTOSerializer(), new NamedDTOSerializer()]
        );
        const serializationService2 = createSerializationService(); // serializationService that does not have the serializers
        const expectedDTO = createMainDTO();
        expectedDTO.nullableBool = null;
        expectedDTO.inner.localDateTimes[0] = null;
        const data = await serialize(serializationService, expectedDTO);
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

    it('should be able to be cloned after converted to object from data', async function() {
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

    it('should be able to be cloned after created via API', async function() {
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
    });

    it('should not support reading and writing char field', async function() {
        (() => GenericRecords.compact('writeChar', {
            foo: Fields.char
        }, {
            foo: 'a'
        })).should.throw(UnsupportedOperationError, /char/);

        (() => GenericRecords.compact('readChar', {}, {}).getChar('foo')).should.throw(UnsupportedOperationError, /char/);
    });

    it('should not support reading and writing charArray field', async function() {
        (() => GenericRecords.compact('writeCharArray', {
            foo: Fields.arrayOfChar
        }, {
            foo: ['a', 'b']
        })).should.throw(UnsupportedOperationError, /char/);

        (() => GenericRecords.compact('readCharArray', {}, {}).getArrayOfChar('foo'))
        .should.throw(UnsupportedOperationError, /char/);
    });

    it('should be able to read array of generic records', async function() {
        const genericRecord = GenericRecords.compact('a', {foo: Fields.int32}, {foo: 1});
        const values = {
            bar: [genericRecord]
        };

        const record = GenericRecords.compact('b', {
            bar: Fields.arrayOfGenericRecord
        }, values);

        record.getArrayOfGenericRecord('bar').should.be.deep.equal([genericRecord]);
    });

    it('should be able to read generic record', async function() {
        const genericRecord = GenericRecords.compact('a', {foo: Fields.int32}, {foo: 1});
        const values = {
            bar: genericRecord
        };

        const record = GenericRecords.compact('b', {
            bar: Fields.genericRecord
        }, values);

        record.getGenericRecord('bar').should.be.deep.equal(genericRecord);
    });

    it('should be able to get field names', async function() {
        const record = GenericRecords.compact('b', {
            foo: Fields.int16,
            bar: Fields.string
        }, {foo: 1, bar: 's'});

        record.getFieldNames().should.be.deep.equal(new Set(['foo', 'bar']));
    });

    it('should have working getters', async function() {
        CompactStreamSerializer.classToSerializersMap.set(Employee, {});
        const values = {};
        const fields = {};

        for (const key in referenceObjects) {
            values[key] = referenceObjects[key].value;
            switch (FieldKind[key]) {
                case FieldKind.BOOLEAN:
                    fields[key] = Fields.boolean;
                    break;
                case FieldKind.ARRAY_OF_BOOLEAN:
                    fields[key] = Fields.arrayOfBoolean;
                    break;
                case FieldKind.INT8:
                    fields[key] = Fields.int8;
                    break;
                case FieldKind.ARRAY_OF_INT8:
                    fields[key] = Fields.arrayOfInt8;
                    break;
                case FieldKind.INT16:
                    fields[key] = Fields.int16;
                    break;
                case FieldKind.ARRAY_OF_INT16:
                    fields[key] = Fields.arrayOfInt16;
                    break;
                case FieldKind.INT32:
                    fields[key] = Fields.int32;
                    break;
                case FieldKind.ARRAY_OF_INT32:
                    fields[key] = Fields.arrayOfInt32;
                    break;
                case FieldKind.INT64:
                    fields[key] = Fields.int64;
                    break;
                case FieldKind.ARRAY_OF_INT64:
                    fields[key] = Fields.arrayOfInt64;
                    break;
                case FieldKind.FLOAT32:
                    fields[key] = Fields.float32;
                    break;
                case FieldKind.ARRAY_OF_FLOAT32:
                    fields[key] = Fields.arrayOfFloat32;
                    break;
                case FieldKind.FLOAT64:
                    fields[key] = Fields.float64;
                    break;
                case FieldKind.ARRAY_OF_FLOAT64:
                    fields[key] = Fields.arrayOfFloat64;
                    break;
                case FieldKind.STRING:
                    fields[key] = Fields.string;
                    break;
                case FieldKind.ARRAY_OF_STRING:
                    fields[key] = Fields.arrayOfString;
                    break;
                case FieldKind.DECIMAL:
                    fields[key] = Fields.decimal;
                    break;
                case FieldKind.ARRAY_OF_DECIMAL:
                    fields[key] = Fields.arrayOfDecimal;
                    break;
                case FieldKind.TIME:
                    fields[key] = Fields.time;
                    break;
                case FieldKind.ARRAY_OF_TIME:
                    fields[key] = Fields.arrayOfTime;
                    break;
                case FieldKind.DATE:
                    fields[key] = Fields.date;
                    break;
                case FieldKind.ARRAY_OF_DATE:
                    fields[key] = Fields.arrayOfDate;
                    break;
                case FieldKind.TIMESTAMP:
                    fields[key] = Fields.timestamp;
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMP:
                    fields[key] = Fields.arrayOfTimestamp;
                    break;
                case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                    fields[key] = Fields.timestampWithTimezone;
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE:
                    fields[key] = Fields.arrayOfTimestampWithTimezone;
                    break;
                case FieldKind.COMPACT:
                    fields[key] = Fields.genericRecord;
                    break;
                case FieldKind.ARRAY_OF_COMPACT:
                    fields[key] = Fields.arrayOfGenericRecord;
                    break;
                case FieldKind.NULLABLE_BOOLEAN:
                    fields[key] = Fields.nullableBoolean;
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                    fields[key] = Fields.arrayOfNullableBoolean;
                    break;
                case FieldKind.NULLABLE_INT8:
                    fields[key] = Fields.nullableInt8;
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT8:
                    fields[key] = Fields.arrayOfNullableInt8;
                    break;
                case FieldKind.NULLABLE_INT16:
                    fields[key] = Fields.nullableInt16;
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT16:
                    fields[key] = Fields.arrayOfNullableInt16;
                    break;
                case FieldKind.NULLABLE_INT32:
                    fields[key] = Fields.nullableInt32;
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT32:
                    fields[key] = Fields.arrayOfNullableInt32;
                    break;
                case FieldKind.NULLABLE_INT64:
                    fields[key] = Fields.nullableInt64;
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT64:
                    fields[key] = Fields.arrayOfNullableInt64;
                    break;
                case FieldKind.NULLABLE_FLOAT32:
                    fields[key] = Fields.float32;
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_FLOAT32:
                    fields[key] = Fields.arrayOfNullableFloat32;
                    break;
                case FieldKind.NULLABLE_FLOAT64:
                    fields[key] = Fields.nullableFloat64;
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_FLOAT64:
                    fields[key] = Fields.arrayOfNullableFloat64;
                    break;
            }
        }

        const record = GenericRecords.compact('a', fields, values);

        for (const key in referenceObjects) {
            const value = referenceObjects[key].value;
            switch (FieldKind[key]) {
                case FieldKind.BOOLEAN:
                    record.getBoolean(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_BOOLEAN:
                    record.getArrayOfBoolean(key).should.be.deep.equal(value);
                    break;
                case FieldKind.INT8:
                    record.getInt8(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_INT8:
                    record.getArrayOfInt8(key).should.be.deep.equal(value);
                    break;
                case FieldKind.INT16:
                    record.getInt16(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_INT16:
                    record.getArrayOfInt16(key).should.be.deep.equal(value);
                    break;
                case FieldKind.INT32:
                    record.getInt32(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_INT32:
                    record.getArrayOfInt32(key).should.be.deep.equal(value);
                    break;
                case FieldKind.INT64:
                    record.getInt64(key).eq(value).should.be.true;
                    break;
                case FieldKind.ARRAY_OF_INT64:
                    record.getArrayOfInt64(key).should.be.deep.equal(value);
                    break;
                case FieldKind.FLOAT32:
                    record.getFloat32(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_FLOAT32:
                    record.getArrayOfFloat32(key).should.be.deep.equal(value);
                    break;
                case FieldKind.FLOAT64:
                    record.getFloat64(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_FLOAT64:
                    record.getArrayOfFloat64(key).should.be.deep.equal(value);
                    break;
                case FieldKind.STRING:
                    record.getString(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_STRING:
                    record.getArrayOfString(key).should.be.deep.equal(value);
                    break;
                case FieldKind.DECIMAL:
                    record.getDecimal(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_DECIMAL:
                    record.getArrayOfDecimal(key).should.be.deep.equal(value);
                    break;
                case FieldKind.TIME:
                    record.getTime(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_TIME:
                    record.getArrayOfTime(key).should.be.deep.equal(value);
                    break;
                case FieldKind.DATE:
                    record.getDate(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_DATE:
                    record.getArrayOfDate(key).should.be.deep.equal(value);
                    break;
                case FieldKind.TIMESTAMP:
                    record.getTimestamp(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMP:
                    record.getArrayOfTimestamp(key).should.be.deep.equal(value);
                    break;
                case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                    record.getTimestampWithTimezone(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE:
                    record.getArrayOfTimestampWithTimezone(key).should.be.deep.equal(value);
                    break;
                case FieldKind.COMPACT:
                    record.getGenericRecord(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_COMPACT:
                    record.getArrayOfGenericRecord(key).should.be.deep.equal(value);
                    break;
                case FieldKind.NULLABLE_BOOLEAN:
                    record.getNullableBoolean(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                    record.getArrayOfNullableBoolean(key).should.be.deep.equal(value);
                    break;
                case FieldKind.NULLABLE_INT8:
                    record.getNullableInt8(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT8:
                    record.getArrayOfNullableInt8(key).should.be.deep.equal(value);
                    break;
                case FieldKind.NULLABLE_INT16:
                    record.getNullableInt16(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT16:
                    record.getArrayOfNullableInt16(key).should.be.deep.equal(value);
                    break;
                case FieldKind.NULLABLE_INT32:
                    record.getNullableInt32(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT32:
                    record.getArrayOfNullableInt32(key).should.be.deep.equal(value);
                    break;
                case FieldKind.NULLABLE_INT64:
                    record.getNullableInt64(key).eq(value).should.be.true;
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT64:
                    record.getArrayOfNullableInt64(key).should.be.deep.equal(value);
                    break;
                case FieldKind.NULLABLE_FLOAT32:
                    record.getNullableFloat32(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_FLOAT32:
                    record.getArrayOfNullableFloat32(key).should.be.deep.equal(value);
                    break;
                case FieldKind.NULLABLE_FLOAT64:
                    record.getNullableFloat64(key).should.be.equal(value);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_FLOAT64:
                    record.getArrayOfNullableFloat64(key).should.be.deep.equal(value);
                    break;
            }
        }
    });

    it('should be able to get kind of a field', async function() {
        const genericRecord = GenericRecords.compact('a', {foo: Fields.int32}, {foo: 1});
        genericRecord.getFieldKind('foo').should.be.equal(FieldKind.INT32);
    });

    it('should throw RangeError in getFieldKind if field with that name does not exist', async function() {
        const genericRecord = GenericRecords.compact('a', {foo: Fields.int32}, {foo: 1});
        (() => genericRecord.getFieldKind('nonexistant')).should.throw(RangeError);
    });

    describe('validation', function () {
        describe('construction', function () {
            it('should throw error if type name is not a string', function () {
                (() => GenericRecords.compact(1, {
                    foo: Fields.int32
                }, {foo: 1})).should.throw(TypeError, /Type name/);
            });

            it('should throw error if values does not have some fields', function () {
                (() => GenericRecords.compact('foo', {
                    foo: Fields.int32,
                    bar: Fields.int64
                }, {foo: 12})).should.throw(TypeError, 'bar');
            });

            it('should not throw error if values have extra fields', function () {
                (() => GenericRecords.compact('foo', {
                    foo: Fields.int32
                }, {foo: 12, bar: 122})).should.not.throw();
            });

            it('should throw RangeError if provided integer is out of range and should not otherwise', function () {
                testIntRange((field, invalidValue) => {
                    (() => {
                        GenericRecords.compact('typeName', {
                            foo: field
                        }, {foo: invalidValue});
                    }).should.throw(RangeError, 'range');
                }, (field, validValue) => {
                    (() => {
                        GenericRecords.compact('typeName', {
                                foo: field
                        }, {foo: validValue});
                    }).should.not.throw();
                }
                );
            });

            it('should throw TypeError if value has invalid type and should not throw if value has valid type', function () {
                for (const value of Object.values(validationTestParams)) {
                    const [validValues, invalidValues] = value.values;
                    const field = value.field;
                    const fieldKindName = FieldKind[field.kind];

                    invalidValues.forEach(invalidValue => {
                        try {
                            GenericRecords.compact('typeName', {
                                foo: field
                            }, {foo: invalidValue});
                        } catch (e) {
                            if (e instanceof RangeError &&
                                 e.message.includes('Generic record field validation error: Expected a number in range')) {
                                return;
                            }
                        }

                        const invalidValueStr = JSON.stringify(invalidValue, (key, value) =>
                            typeof value === 'bigint'
                                ? 'BigInt: ' + value.toString()
                                : value // return everything else unchanged
                        );

                        (() => GenericRecords.compact('typeName', {
                            foo: field
                        }, {foo: invalidValue})).should.throw(TypeError, undefined,
                            `Using invalid value ${invalidValueStr} with ${fieldKindName}` +
                             ' must have thrown, but it did not.');
                    });

                    validValues.forEach(validValue => {
                        try {
                            GenericRecords.compact('typeName', {
                                foo: field
                            }, {foo: validValue});
                        } catch (e) {
                            if (e instanceof RangeError &&
                                 e.message.includes('Generic record field validation error: Expected a number in range')) {
                                return;
                            }
                        }

                        const validValueStr = JSON.stringify(validValue, (key, value) =>
                            typeof value === 'bigint'
                                ? 'BigInt: ' + value.toString()
                                : value // return everything else unchanged
                        );

                        (() => GenericRecords.compact('typeName', {
                            foo: field
                        }, {foo: validValue})).should.not.throw(undefined, undefined,
                            `Using valid value ${validValueStr} with ${fieldKindName}` +
                            ' must have thrown, but it did not.');
                    });
                }
            });
        });

        describe('cloning', function () {
            it('should throw RangeError if provided integer is out of range and should not otherwise', function () {
                testIntRange((field, invalidValue) => {
                    (() => {
                        GenericRecords.compact('typeName', {
                                foo: field
                        }, {foo: 0}).clone({foo: invalidValue});
                    }).should.throw(RangeError, 'range');
                }, (field, validValue) => {
                    (() => {
                        GenericRecords.compact('typeName', {
                                    foo: field
                        }, {foo: 0}).clone({foo: validValue});
                    }).should.not.throw();
                }
                );
            });

            it('should throw RangeError if unexistent typename\'s replacement value is given', function() {
                for (const value of Object.values(validationTestParams)) {
                    const validValues = value.values[0];
                    const field = value.field;
                    const record = GenericRecords.compact('typeName', {
                        foo: field
                    }, {foo: validValues[0]});
                    const fieldKindName = FieldKind[field.kind];

                    validValues.forEach(validValue => {
                        try {
                            record.clone({ foobar: validValue });
                        } catch (e) {
                            // This is for excluding RangeErrors that happens
                            // because of using a single number array for all integer types
                            if (e instanceof RangeError &&
                                 e.message.includes('Generic to be cloned does not have a field with name')) {
                                return;
                            }
                        }

                        const validValueStr = JSON.stringify(validValue, (key, value) =>
                            typeof value === 'bigint'
                                ? 'BigInt: ' + value.toString()
                                : value // return everything else unchanged
                        );

                        (() => record.clone({
                            foo: validValue
                        })).should.not.throw(undefined, undefined,
                            `Using valid value ${validValueStr} with ${fieldKindName}`+
                            ' must have thrown, but it did not.');
                    });
                }
            });

            it('should throw TypeError if wrong type of replacement value is given, should not otherwise', function () {
                for (const value of Object.values(validationTestParams)) {
                    const [validValues, invalidValues] = value.values;
                    const field = value.field;
                    const record = GenericRecords.compact('typeName', {
                        foo: field
                    }, {foo: validValues[0]});
                    const fieldKindName = FieldKind[field.kind];

                    invalidValues.forEach(invalidValue => {
                        try {
                            record.clone({ foo: invalidValue });
                        } catch (e) {
                            // This is for excluding RangeErrors that happens
                            // because of using a single number array for all integer types
                            if (e instanceof RangeError &&
                                 e.message.includes('Generic record field validation error: Expected a number in range')) {
                                return;
                            }
                        }

                        const invalidValueStr = JSON.stringify(invalidValue, (key, value) =>
                            typeof value === 'bigint'
                                ? 'BigInt: ' + value.toString()
                                : value // return everything else unchanged
                        );

                        (() => record.clone({
                            foo: invalidValue
                        })).should.throw(TypeError, undefined,
                            `Using invalid value ${invalidValueStr} with ${fieldKindName}` +
                            ' must have thrown, but it did not.');
                    });

                    validValues.forEach(validValue => {
                        try {
                            record.clone({ foo: validValue });
                        } catch (e) {
                            // This is for excluding RangeErrors that happens
                            // because of using a single number array for all integer types
                            if (e instanceof RangeError &&
                                 e.message.includes('Generic record field validation error: Expected a number in range')) {
                                return;
                            }
                        }

                        const validValueStr = JSON.stringify(validValue, (key, value) =>
                            typeof value === 'bigint'
                                ? 'BigInt: ' + value.toString()
                                : value // return everything else unchanged
                        );

                        (() => record.clone({
                            foo: validValue
                        })).should.not.throw(undefined, undefined,
                            `Using valid value ${validValueStr} with ${fieldKindName}`+
                            ' should not throw, but it did.');
                    });

                    (() => record.clone()).should.not.throw();
                }
            });
        });
    });
});
