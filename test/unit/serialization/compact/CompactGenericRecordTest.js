/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
const { CompactGenericRecordImpl, GenericRecords } = require('../../../../lib');
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
    ArrayOfCompact,
    ArrayOfCompactSerializer,
    SampleObject1,
    SampleObject2,
    SampleObject1Serializer,
    SampleObject2Serializer
} = require('../../../integration/backward_compatible/parallel/serialization/compact/CompactUtil');
const { Fields, FieldKind } = require('../../../../lib/serialization/generic_record');
const Long = require('long');
const TestUtil = require('../../../TestUtil');
const { HazelcastSerializationError } = require('../../../../lib');

const testIntRange = (invalidValueFn, validValueFn) => {
    for (const test of [
        {
            field: Fields.INT8,
            validValues: [-128, 127, 12, 0, 122],
            invalidValues: [11111111, -129, -1232, 128, 1000]
        },
        {
            field: Fields.INT16,
            validValues: [-128, 127, 12, 0, 122, -32768, 32767, 10000, -10000],
            invalidValues: [11111111, 32768, 52768, -32769, -132768]
        },
        {
            field: Fields.INT32,
            validValues: [-128, 127, 12, 0, 122, -32768, 32767, 10000, -10000, 1234567890, -1234567890, -2147483648, 2147483647],
            invalidValues: [Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, -2147483649, 2147483648, 2147483648213]
        }
    ]) {
        test.invalidValues.forEach(invalidValue => invalidValueFn(test.field, invalidValue));
        test.validValues.forEach(validValue => validValueFn(test.field, validValue));
    }
};

const sampleGenericRecord = GenericRecords.compact('aa', {nested: Fields.GENERIC_RECORD},
    {nested: GenericRecords.compact('bb', {}, {})});

const sampleArrayOfGenericRecords = [GenericRecords.compact('dd', {foo: Fields.INT16}, {foo: 3}),
GenericRecords.compact('dd', {foo: Fields.INT16}, {foo: 55})];

const sampleArrayOfGenericRecordsDifferentTypes = [GenericRecords.compact('dd', {foo: Fields.INT16}, {foo: 3}),
GenericRecords.compact('cc', {bar: Fields.STRING}, {bar: 'sample value'})];

const getGenericRecordArray = (type) => {
    const values = {
        ARRAY_OF_COMPACT: type == 'same' ? sampleArrayOfGenericRecords : sampleArrayOfGenericRecordsDifferentTypes
    };
    const fields = {
        ARRAY_OF_COMPACT: Fields.ARRAY_OF_GENERIC_RECORD
    };
    return GenericRecords.compact('a', fields, values);
};

const getGiganticRecord = () => {
    const values = {};
    const fields = {};

    for (const key in referenceObjects) {
        if (FieldKind[key] === FieldKind.COMPACT) {
            values[key] = sampleGenericRecord;
        } else if (FieldKind[key] === FieldKind.ARRAY_OF_COMPACT) {
            values[key] = sampleArrayOfGenericRecords;
        } else {
            values[key] = referenceObjects[key].value;
        }
        switch (FieldKind[key]) {
            case FieldKind.BOOLEAN:
                fields[key] = Fields.BOOLEAN;
                break;
            case FieldKind.ARRAY_OF_BOOLEAN:
                fields[key] = Fields.ARRAY_OF_BOOLEAN;
                break;
            case FieldKind.INT8:
                fields[key] = Fields.INT8;
                break;
            case FieldKind.ARRAY_OF_INT8:
                fields[key] = Fields.ARRAY_OF_INT8;
                break;
            case FieldKind.INT16:
                fields[key] = Fields.INT16;
                break;
            case FieldKind.ARRAY_OF_INT16:
                fields[key] = Fields.ARRAY_OF_INT16;
                break;
            case FieldKind.INT32:
                fields[key] = Fields.INT32;
                break;
            case FieldKind.ARRAY_OF_INT32:
                fields[key] = Fields.ARRAY_OF_INT32;
                break;
            case FieldKind.INT64:
                fields[key] = Fields.INT64;
                break;
            case FieldKind.ARRAY_OF_INT64:
                fields[key] = Fields.ARRAY_OF_INT64;
                break;
            case FieldKind.FLOAT32:
                fields[key] = Fields.FLOAT32;
                break;
            case FieldKind.ARRAY_OF_FLOAT32:
                fields[key] = Fields.ARRAY_OF_FLOAT32;
                break;
            case FieldKind.FLOAT64:
                fields[key] = Fields.FLOAT64;
                break;
            case FieldKind.ARRAY_OF_FLOAT64:
                fields[key] = Fields.ARRAY_OF_FLOAT64;
                break;
            case FieldKind.STRING:
                fields[key] = Fields.STRING;
                break;
            case FieldKind.ARRAY_OF_STRING:
                fields[key] = Fields.ARRAY_OF_STRING;
                break;
            case FieldKind.DECIMAL:
                fields[key] = Fields.DECIMAL;
                break;
            case FieldKind.ARRAY_OF_DECIMAL:
                fields[key] = Fields.ARRAY_OF_DECIMAL;
                break;
            case FieldKind.TIME:
                fields[key] = Fields.TIME;
                break;
            case FieldKind.ARRAY_OF_TIME:
                fields[key] = Fields.ARRAY_OF_TIME;
                break;
            case FieldKind.DATE:
                fields[key] = Fields.DATE;
                break;
            case FieldKind.ARRAY_OF_DATE:
                fields[key] = Fields.ARRAY_OF_DATE;
                break;
            case FieldKind.TIMESTAMP:
                fields[key] = Fields.TIMESTAMP;
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP:
                fields[key] = Fields.ARRAY_OF_TIMESTAMP;
                break;
            case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                fields[key] = Fields.TIMESTAMP_WITH_TIMEZONE;
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE:
                fields[key] = Fields.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE;
                break;
            case FieldKind.COMPACT:
                fields[key] = Fields.GENERIC_RECORD;
                break;
            case FieldKind.ARRAY_OF_COMPACT:
                fields[key] = Fields.ARRAY_OF_GENERIC_RECORD;
                break;
            case FieldKind.NULLABLE_BOOLEAN:
                fields[key] = Fields.NULLABLE_BOOLEAN;
                break;
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                fields[key] = Fields.ARRAY_OF_NULLABLE_BOOLEAN;
                break;
            case FieldKind.NULLABLE_INT8:
                fields[key] = Fields.NULLABLE_INT8;
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT8:
                fields[key] = Fields.ARRAY_OF_NULLABLE_INT8;
                break;
            case FieldKind.NULLABLE_INT16:
                fields[key] = Fields.NULLABLE_INT16;
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT16:
                fields[key] = Fields.ARRAY_OF_NULLABLE_INT16;
                break;
            case FieldKind.NULLABLE_INT32:
                fields[key] = Fields.NULLABLE_INT32;
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT32:
                fields[key] = Fields.ARRAY_OF_NULLABLE_INT32;
                break;
            case FieldKind.NULLABLE_INT64:
                fields[key] = Fields.NULLABLE_INT64;
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT64:
                fields[key] = Fields.ARRAY_OF_NULLABLE_INT64;
                break;
            case FieldKind.NULLABLE_FLOAT32:
                fields[key] = Fields.FLOAT32;
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT32:
                fields[key] = Fields.ARRAY_OF_NULLABLE_FLOAT32;
                break;
            case FieldKind.NULLABLE_FLOAT64:
                fields[key] = Fields.NULLABLE_FLOAT64;
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT64:
                fields[key] = Fields.ARRAY_OF_NULLABLE_FLOAT64;
                break;
        }
    }

    return GenericRecords.compact('a', fields, values);
};

describe('CompactGenericRecordTest', function () {
    it('toString should produce valid JSON string', async function() {
        const {serializationService, schemaService: schemaService1} = createSerializationService(
            [new MainDTOSerializer(), new InnerDTOSerializer(), new NamedDTOSerializer()]
        );
        // create a serializationService that does not have the serializers
        const {serializationService: serializationService2, schemaService: schemaService2} = createSerializationService();
        const expectedDTO = createMainDTO();
        expectedDTO.nullableBool = null;
        expectedDTO.inner.localDateTimes[0] = null;
        const data = await serialize(serializationService, schemaService1, expectedDTO);
        data.isCompact().should.be.true;

        mimicSchemaReplication(schemaService1, schemaService2);

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
            foo: Fields.INT32,
            bar: Fields.INT64
        }, values);

        const {serializationService, schemaService} = createSerializationService();

        const data = await serialize(serializationService, schemaService, record);
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
            foo: Fields.INT32,
            bar: Fields.INT64
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

    it('should be able to read array of generic records', async function() {
        const genericRecord = GenericRecords.compact('a', {foo: Fields.INT32}, {foo: 1});
        const values = {
            bar: [genericRecord]
        };

        const record = GenericRecords.compact('b', {
            bar: Fields.ARRAY_OF_GENERIC_RECORD
        }, values);

        record.getArrayOfGenericRecord('bar').should.be.deep.equal([genericRecord]);
    });

    it('should be able to read generic record', async function() {
        const genericRecord = GenericRecords.compact('a', {foo: Fields.INT32}, {foo: 1});
        const values = {
            bar: genericRecord
        };

        const record = GenericRecords.compact('b', {
            bar: Fields.GENERIC_RECORD
        }, values);

        record.getGenericRecord('bar').should.be.deep.equal(genericRecord);
    });

    it('should be able to get field names', async function() {
        const record = GenericRecords.compact('b', {
            foo: Fields.INT16,
            bar: Fields.STRING
        }, {foo: 1, bar: 's'});

        record.getFieldNames().should.be.deep.equal(new Set(['foo', 'bar']));
    });

    it('should have working getters', async function() {
        const record = getGiganticRecord();

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
                    record.getGenericRecord(key).should.be.equal(sampleGenericRecord);
                    break;
                case FieldKind.ARRAY_OF_COMPACT:
                    record.getArrayOfGenericRecord(key).should.be.deep.equal(sampleArrayOfGenericRecords);
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

    it('should be able to write every field', async function() {
        const record = getGiganticRecord();
        const {serializationService, schemaService} = createSerializationService();
        await serialize(serializationService, schemaService, record);
    });

    it('should be able to get kind of a field', async function() {
        const genericRecord = GenericRecords.compact('a', {foo: Fields.INT32}, {foo: 1});
        genericRecord.getFieldKind('foo').should.be.equal(FieldKind.INT32);
    });

    it('should throw RangeError in getFieldKind if field with that name does not exist', async function() {
        const genericRecord = GenericRecords.compact('a', {foo: Fields.INT32}, {foo: 1});
        (() => genericRecord.getFieldKind('nonexistant')).should.throw(RangeError);
    });

    describe('validation', function () {
        describe('construction', function () {
            it('should throw error if type name is not a string', function () {
                (() => GenericRecords.compact(1, {
                    foo: Fields.INT32
                }, {foo: 1})).should.throw(TypeError, /Type name/);
            });

            it('should throw error if values does not have some fields', function () {
                (() => GenericRecords.compact('foo', {
                    foo: Fields.INT32,
                    bar: Fields.INT64
                }, {foo: 12})).should.throw(TypeError, 'bar');
            });

            it('should not throw error if values have extra fields', function () {
                (() => GenericRecords.compact('foo', {
                    foo: Fields.INT32
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

        describe('array restrictions', function () {
            it('should not throw error if object types are equal on ARRAY_OF_COMPACT', function () {
                (async () => {
                    const {serializationService, schemaService} = createSerializationService(
                        [new ArrayOfCompactSerializer(), new SampleObject1Serializer()]
                    );
                    const object1 = new SampleObject1('type1', Long.fromNumber(102310312));
                    const object2 = new SampleObject1('type2', Long.fromNumber(102310312));
                    const arrayOfObjects = [
                        object1,
                        object2
                    ];
                    const arrayOfCompactObject = new ArrayOfCompact(arrayOfObjects);
                    await serialize(serializationService, schemaService, arrayOfCompactObject);
                }).should.not.throw();
            });
            it('should throw error if object types are not equal on ARRAY_OF_COMPACT', async function () {
                const {serializationService, schemaService} = createSerializationService(
                    [new ArrayOfCompactSerializer(), new SampleObject1Serializer(), new SampleObject2Serializer()]
                );
                const object1 = new SampleObject1('type1', Long.fromNumber(102310312));
                const object2 = new SampleObject2('name1', Long.fromNumber(102310312));
                const arrayOfObjects = [
                    object1,
                    object2
                ];
                const arrayOfCompactObject = new ArrayOfCompact(arrayOfObjects);

                const error = await TestUtil.getRejectionReasonOrThrow(async () => {
                    await serialize(serializationService, schemaService, arrayOfCompactObject);
                });

                error.should.be.instanceOf(HazelcastSerializationError);
                error.message.includes('It is not allowed to serialize an array of Compact serializable objects'
                +' containing different item types.').should.be.true;
            });
            it('should not throw error array of GenericRecord objects containing same schemas.', function () {
                (async () => {
                    const {serializationService, schemaService} = createSerializationService();
                    const arrayofGenericRecords = getGenericRecordArray('same');
                    await serialize(serializationService, schemaService, arrayofGenericRecords);
                }).should.not.throw();
            });
            it('should throw error array of GenericRecord objects does not containing same schemas.', async function () {
                const {serializationService, schemaService} = createSerializationService();
                const arrayofGenericRecords = getGenericRecordArray('diff');

                const error = await TestUtil.getRejectionReasonOrThrow(async () => {
                    await serialize(serializationService, schemaService, arrayofGenericRecords);
                });
                error.should.be.instanceOf(HazelcastSerializationError);
                error.message.includes('It is not allowed to serialize an array of Compact serializable '
                +'GenericRecord objects containing different schemas.').should.be.true;
            });
        });

        describe('cloning', function () {
            it('should be able to clone every field', function() {
                const record = getGiganticRecord();
                record.clone();
            });

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
