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
    validationTestParams
} = require('../../../integration/backward_compatible/parallel/serialization/compact/CompactUtil');
const { Fields, FieldKind } = require('../../../../lib/serialization/generic_record');
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
