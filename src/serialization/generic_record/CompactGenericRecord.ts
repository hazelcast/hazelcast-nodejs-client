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
/** @ignore *//** */

import {GenericRecord} from './GenericRecord';
import {
    BigDecimal,
    HazelcastSerializationError,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime,
    UnsupportedOperationError
} from '../../core';
import {FieldKind} from './FieldKind';
import {Field} from './Fields';
import {Schema} from '../compact/Schema';
import {SchemaWriter} from '../compact/SchemaWriter';
import {FieldDescriptor} from './FieldDescriptor';
import {CompactExceptions} from '../compact/CompactUtil';
import * as Long from 'long';

/**
 * @internal
 */
export interface CompactGenericRecord extends GenericRecord {
    getSchema(): Schema;
}

/**
 * Represents a deserialized compact generic record. This class is what user gets.
 * @internal
 */
export class CompactGenericRecordImpl implements CompactGenericRecord {

    private readonly schema: Schema;

    constructor(
        typeName = '',
        private readonly fields: {[name: string]: Field<any>} = {},
        readonly values: {[name: string]: any} = {}
    ) {
        const schemaWriter = new SchemaWriter(typeName);
        for (const [fieldName, field] of Object.entries(fields)) {
            this.validateField(fieldName, field.kind, this.values[fieldName]);
            schemaWriter.addField(new FieldDescriptor(fieldName, field.kind));
        }
        this.schema = schemaWriter.build();
    }

    validateField(fieldName: string, fieldKind: FieldKind, value: any, checkingElement = false): void {
        const getErrorStringElement =
            (typeName: string) => 'Generic record field validation error: ' +
                `Expected a ${typeName} element in field ${fieldName}, but got: ${value}`;
        const getErrorStringForField =
            (typeName: string) => 'Generic record field validation error: ' +
                `Expected ${typeName} for field ${fieldName}, but got: ${value}`;
        const checkFn = checkingElement ? getErrorStringElement : getErrorStringForField;
        const throwTypeErrorWithMessage = (typeName: string) => {
            throw new TypeError(checkFn(typeName));
        };
        const checkArrayOrNull = () => {
            if (!Array.isArray(value) && value !== null) {
                throw new TypeError(`Expected an array or null for field ${fieldName}, but got: ${value}`);
            }
        };

        const validateArray = (elementKind: FieldKind) => {
            checkArrayOrNull();
            if (value !== null) {
                for (const element of value) {
                    this.validateField(fieldName, elementKind, element, true);
                }
            }
        }

        const validateType = (jsTypeName: string) => {
            if (typeof value !== jsTypeName) {
                throwTypeErrorWithMessage(jsTypeName);
            }
        }

        const validateNullableType = (jsTypeName: string) => {
            if (typeof value !== jsTypeName && value !== null) {
                throwTypeErrorWithMessage(jsTypeName);
            }
        }

        const validateNumberRange = (min: number, max: number) => {
            if (value < min || value > max) {
                throw new RangeError(
                    'Generic record field validation error: ' +
                    `Expected a number in range [${min}, ${max}] for field ${fieldName}, but got: ${value}`
                );
            }
        }

        const validateInt8Range = () => validateNumberRange(-128, 127);
        const validateInt16Range = () => validateNumberRange(-32768, 32767);
        const validateInt32Range = () => validateNumberRange(-2147483648, 2147483647);

        switch (fieldKind) {
            case FieldKind.BOOLEAN:
                validateType('boolean');
                break;
            case FieldKind.ARRAY_OF_BOOLEAN:
                validateArray(FieldKind.BOOLEAN);
                break;
            case FieldKind.INT8:
                validateType('number');
                validateInt8Range();
                break;
            case FieldKind.ARRAY_OF_INT8:
                if (!Buffer.isBuffer(value) && value !== null) {
                    throw new TypeError(getErrorStringForField('Buffer or null'));
                }
                break;
            case FieldKind.CHAR:
                throw new UnsupportedOperationError('Compact format does not support writing a char field');
            case FieldKind.ARRAY_OF_CHAR:
                throw new UnsupportedOperationError('Compact format does not support writing an array of chars field');
            case FieldKind.INT16:
                validateType('number');
                validateInt16Range();
                break;
            case FieldKind.ARRAY_OF_INT16:
                validateArray(FieldKind.INT16);
                break;
            case FieldKind.INT32:
                validateType('number');
                validateInt32Range();
                break;
            case FieldKind.ARRAY_OF_INT32:
                validateArray(FieldKind.INT32);
                break;
            case FieldKind.INT64:
                if (!Long.isLong(value)) {
                    throwTypeErrorWithMessage('Long');
                }
                break;
            case FieldKind.ARRAY_OF_INT64:
                validateArray(FieldKind.INT64);
                break;
            case FieldKind.FLOAT32:
                validateType('number');
                break;
            case FieldKind.ARRAY_OF_FLOAT32:
                validateArray(FieldKind.FLOAT32);
                break;
            case FieldKind.FLOAT64:
                validateType('number');
                break;
            case FieldKind.ARRAY_OF_FLOAT64:
                validateArray(FieldKind.FLOAT64);
                break;
            case FieldKind.STRING:
                if (typeof value !== 'string' && value !== null) {
                    throwTypeErrorWithMessage('String or null');
                }
                break;
            case FieldKind.ARRAY_OF_STRING:
                validateArray(FieldKind.STRING);
                break;
            case FieldKind.DECIMAL:
                if (!(value instanceof BigDecimal) && value !== null) {
                    throwTypeErrorWithMessage('BigDecimal or null');
                }
                break;
            case FieldKind.ARRAY_OF_DECIMAL:
                validateArray(FieldKind.DECIMAL);
                break;
            case FieldKind.TIME:
                if (!(value instanceof LocalTime) && value !== null) {
                    throwTypeErrorWithMessage('LocalTime or null');
                }
                break;
            case FieldKind.ARRAY_OF_TIME:
                validateArray(FieldKind.TIME);
                break;
            case FieldKind.DATE:
                if (!(value instanceof LocalDate) && value !== null) {
                    throwTypeErrorWithMessage('LocalDate or null');
                }
                break;
            case FieldKind.ARRAY_OF_DATE:
                validateArray(FieldKind.DATE);
                break;
            case FieldKind.TIMESTAMP:
                if (!(value instanceof LocalDateTime) && value !== null) {
                    throwTypeErrorWithMessage('LocalDateTime or null');
                }
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP:
                validateArray(FieldKind.TIMESTAMP);
                break;
            case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                if (!(value instanceof OffsetDateTime) && value !== null) {
                    throwTypeErrorWithMessage('OffsetDateTime or null');
                }
                break;
            case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE:
                validateArray(FieldKind.TIMESTAMP_WITH_TIMEZONE);
                break;
            case FieldKind.COMPACT:
                if (value !== null && !(value instanceof CompactGenericRecordImpl)) {
                    throwTypeErrorWithMessage('Compact');
                }
                break;
            case FieldKind.ARRAY_OF_COMPACT:
                validateArray(FieldKind.COMPACT);
                break;
            case FieldKind.PORTABLE:
                throw new TypeError('Compact format does not support writing a portable field');
            case FieldKind.ARRAY_OF_PORTABLE:
                validateArray(FieldKind.PORTABLE);
                break;
            case FieldKind.NULLABLE_BOOLEAN:
                validateNullableType('boolean');
                break;
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                validateArray(FieldKind.NULLABLE_BOOLEAN);
                break;
            case FieldKind.NULLABLE_INT8:
                validateNullableType('number');
                validateInt8Range();
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT8:
                validateArray(FieldKind.NULLABLE_INT8);
                break;
            case FieldKind.NULLABLE_INT16:
                validateNullableType('number');
                validateInt16Range();
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT16:
                validateArray(FieldKind.NULLABLE_INT16);
                break;
            case FieldKind.NULLABLE_INT32:
                validateNullableType('number');
                validateInt32Range();
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT32:
                validateArray(FieldKind.NULLABLE_INT32);
                break;
            case FieldKind.NULLABLE_INT64:
                if (!Long.isLong(value) && value !== null) {
                    throwTypeErrorWithMessage('Long or null');
                }
                break;
            case FieldKind.ARRAY_OF_NULLABLE_INT64:
                validateArray(FieldKind.NULLABLE_INT64);
                break;
            case FieldKind.NULLABLE_FLOAT32:
                validateNullableType('number');
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT32:
                validateArray(FieldKind.NULLABLE_FLOAT32);
                break;
            case FieldKind.NULLABLE_FLOAT64:
                validateNullableType('number');
                break;
            case FieldKind.ARRAY_OF_NULLABLE_FLOAT64:
                validateArray(FieldKind.NULLABLE_FLOAT64);
                break;
        }
    }

    /**
     * Deep clones an object. Based on: https://stackoverflow.com/a/34624648/9483495
     * @param obj
     */
    private static deepCloneCompactGenericRecordValues(obj: any) {
        // Prevent undefined objects
        if (!obj) {
            return obj;
        }

        if (obj instanceof CompactGenericRecordImpl) {
            return obj.clone();
        }

        if (obj instanceof Long) {
            return new Long(obj.low, obj.high, obj.unsigned);
        }

        if (Buffer.isBuffer(obj)) {
            return Buffer.from(obj);
        }

        if (obj instanceof LocalDate) {
            return new LocalDate(obj.year, obj.month, obj.date);
        }

        if (obj instanceof LocalTime) {
            return new LocalTime(obj.hour, obj.minute, obj.second, obj.nano);
        }

        if (obj instanceof LocalDateTime) {
            return new LocalDateTime(obj.localDate, obj.localTime);
        }

        if (obj instanceof OffsetDateTime) {
            return new OffsetDateTime(obj.localDateTime, obj.offsetSeconds);
        }

        if (obj instanceof BigDecimal) {
            return new BigDecimal(obj.unscaledValue, obj.scale);
        }

        if (obj instanceof BigDecimal) {
            return new BigDecimal(obj.unscaledValue, obj.scale);
        }

        let v: any;
        const cloned: any = Array.isArray(obj) ? [] : {};
        for (const k in obj) {

            // Prevent self-references to parent object
            // if (Object.is(obj[k], obj)) continue;

            v = obj[k];
            cloned[k] = (typeof v === 'object') ? CompactGenericRecordImpl.deepCloneCompactGenericRecordValues(v) : v;
        }

        return cloned;
    }

    clone(fieldsToUpdate?: { [fieldName: string]: any }): GenericRecord {
        const clonedValues = CompactGenericRecordImpl.deepCloneCompactGenericRecordValues(this.values);

        for (const fieldName in fieldsToUpdate) {
            if (!this.hasField(fieldName)) {
                throw RangeError(`Generic to be cloned does not have a field with name ${fieldName}`);
            }
            clonedValues[fieldName] = fieldsToUpdate[fieldName];
        }

        return new CompactGenericRecordImpl(this.schema.typeName, this.fields, clonedValues);
    }

    private check(fieldName: string, ...kinds: FieldKind[]) : FieldKind {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === undefined) {
            throw new HazelcastSerializationError(`Invalid field name: '${fieldName}' for schema ${this.schema}`);
        }
        let valid = false;
        const fieldKind = fd.kind;
        for (const kind of kinds) {
            valid = valid || (fieldKind === kind);
        }
        if (!valid) {
            throw new HazelcastSerializationError(`Invalid field kind: '${fieldKind}' for schema '${this.schema}',`
                + `valid field kinds: ${kinds}, found: ${fieldKind}`);
        }
        return fieldKind;
    }

    private getNonNull(
        fieldName: string, primitiveFieldKind: FieldKind, nullableFieldKind: FieldKind, methodSuffix: string
    ): any {
        this.check(fieldName, primitiveFieldKind, nullableFieldKind);
        const value = this.values[fieldName];
        if (value === null) {
            throw CompactExceptions.toExceptionForUnexpectedNullValue(fieldName, methodSuffix);
        }
        return value;
    }

    private get(fieldName: string, ...fieldKind: FieldKind[]): any {
        this.check(fieldName, ...fieldKind);
        return this.values[fieldName];
    }

    getSchema(): Schema {
        return this.schema;
    }

    getArrayOfPrimitives(
        fieldName: string, methodSuffix: string, primitiveFieldKind: FieldKind, nullableFieldKind: FieldKind
    ): any[] {
        const fieldKind = this.check(fieldName, primitiveFieldKind, nullableFieldKind);
        if (fieldKind === nullableFieldKind) {
            const array = this.values[fieldName];
            const result = new Array(array.length);
            for (let i = 0; i < array.length; i++) {
                if (array[i] === null) {
                    throw CompactExceptions.toExceptionForUnexpectedNullValueInArray(fieldName, methodSuffix);
                }
                result[i] = array[i];
            }
            return result;
        }
        return this.values[fieldName];
    }

    getArrayOfNullables(
        fieldName: string, primitiveFieldKind: FieldKind, nullableFieldKind: FieldKind
    ): any[] {
        this.check(fieldName, primitiveFieldKind, nullableFieldKind);
        return this.values[fieldName];
    }

    getArrayOfBoolean(fieldName: string): boolean[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Booleans', FieldKind.ARRAY_OF_BOOLEAN, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN
        );
    }

    getArrayOfInt8(fieldName: string): Buffer {
        return Buffer.from(this.getArrayOfPrimitives(
            fieldName, 'Bytes', FieldKind.ARRAY_OF_INT8, FieldKind.ARRAY_OF_NULLABLE_INT8
        ));
    }

    getArrayOfChar(fieldName: string): string[] {
        throw new UnsupportedOperationError('Compact format does not support reading an array of chars field');
    }

    getArrayOfDate(fieldName: string): LocalDate[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_DATE);
    }

    getArrayOfDecimal(fieldName: string): BigDecimal[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_DECIMAL);
    }

    getArrayOfFloat64(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Doubles', FieldKind.ARRAY_OF_FLOAT64, FieldKind.ARRAY_OF_NULLABLE_FLOAT64
        );
    }

    getArrayOfFloat32(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Floats', FieldKind.ARRAY_OF_FLOAT32, FieldKind.ARRAY_OF_NULLABLE_FLOAT32
        );
    }

    getArrayOfGenericRecord(fieldName: string): GenericRecord[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_COMPACT);
    }

    getArrayOfInt32(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Ints', FieldKind.ARRAY_OF_INT32, FieldKind.ARRAY_OF_NULLABLE_INT32
        );
    }

    getArrayOfInt64(fieldName: string): Long[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Longs', FieldKind.ARRAY_OF_INT64, FieldKind.ARRAY_OF_NULLABLE_INT64
        );
    }

    getArrayOfNullableBoolean(fieldName: string): (boolean | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_BOOLEAN, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN);
    }

    getArrayOfNullableInt8(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_INT8, FieldKind.ARRAY_OF_NULLABLE_INT8);
    }

    getArrayOfNullableFloat64(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_FLOAT64, FieldKind.ARRAY_OF_NULLABLE_FLOAT64);
    }

    getArrayOfNullableFloat32(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_FLOAT32, FieldKind.ARRAY_OF_NULLABLE_FLOAT32);
    }

    getArrayOfNullableInt32(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_INT32, FieldKind.ARRAY_OF_NULLABLE_INT32);
    }

    getArrayOfNullableInt64(fieldName: string): (Long | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_INT64, FieldKind.ARRAY_OF_NULLABLE_INT64);
    }

    getArrayOfNullableInt16(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_INT16, FieldKind.ARRAY_OF_NULLABLE_INT16);
    }

    getArrayOfInt16(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Shorts', FieldKind.ARRAY_OF_INT16, FieldKind.ARRAY_OF_NULLABLE_INT16
        );
    }

    getArrayOfString(fieldName: string): string[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_STRING);
    }

    getArrayOfTime(fieldName: string): LocalTime[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_TIME);
    }

    getArrayOfTimestampWithTimezone(fieldName: string): OffsetDateTime[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE);
    }

    getArrayOfTimestamp(fieldName: string): LocalDateTime[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_TIMESTAMP);
    }

    getBoolean(fieldName: string): boolean {
        return this.getNonNull(fieldName, FieldKind.BOOLEAN, FieldKind.NULLABLE_BOOLEAN, 'Boolean');
    }

    getInt8(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.INT8, FieldKind.NULLABLE_INT8, 'Byte');
    }

    getChar(fieldName: string): string {
        throw new UnsupportedOperationError('Compact format does not support reading a char field.');
    }

    getDate(fieldName: string): LocalDate {
        return this.get(fieldName, FieldKind.DATE);
    }

    getDecimal(fieldName: string): BigDecimal {
        return this.get(fieldName, FieldKind.DECIMAL);
    }

    getFloat32(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.FLOAT32, FieldKind.NULLABLE_FLOAT32, 'Float');
    }

    getFieldKind(fieldName: string): FieldKind {
        if (!this.schema.fieldDefinitionMap.has(fieldName)) {
            throw RangeError('There is no field named as '+ fieldName);
        }
        return this.schema.fieldDefinitionMap.get(fieldName).kind;
    }

    getFieldNames(): Set<string> {
        return new Set(Object.keys(this.fields));
    }

    getFloat64(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.FLOAT64, FieldKind.NULLABLE_FLOAT64, 'Double');
    }

    getGenericRecord(fieldName: string): GenericRecord {
        return this.get(fieldName, FieldKind.COMPACT);
    }

    getInt32(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.INT32, FieldKind.NULLABLE_INT32, 'Int');
    }

    getInt64(fieldName: string): Long {
        return this.getNonNull(fieldName, FieldKind.INT64, FieldKind.NULLABLE_INT64, 'Long');
    }

    getNullableBoolean(fieldName: string): boolean | null {
        return this.get(fieldName, FieldKind.BOOLEAN, FieldKind.NULLABLE_BOOLEAN);
    }

    getNullableInt8(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.INT8, FieldKind.NULLABLE_INT8);
    }

    getNullableFloat64(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.FLOAT64, FieldKind.NULLABLE_FLOAT64);
    }

    getNullableFloat32(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.FLOAT32, FieldKind.NULLABLE_FLOAT32);
    }

    getNullableInt32(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.INT32, FieldKind.NULLABLE_INT32);
    }

    getNullableInt64(fieldName: string): Long | null {
        return this.get(fieldName, FieldKind.INT64, FieldKind.NULLABLE_INT64);
    }

    getNullableInt16(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.INT16, FieldKind.NULLABLE_INT16);
    }

    getInt16(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.INT16, FieldKind.NULLABLE_INT16, 'Short');
    }

    getString(fieldName: string): string {
        return this.get(fieldName, FieldKind.STRING);
    }

    getTime(fieldName: string): LocalTime {
        return this.get(fieldName, FieldKind.TIME);
    }

    getTimestamp(fieldName: string): LocalDateTime {
        return this.get(fieldName, FieldKind.TIMESTAMP);
    }

    getTimestampWithTimezone(fieldName: string): OffsetDateTime {
        return this.get(fieldName, FieldKind.TIMESTAMP_WITH_TIMEZONE);
    }

    hasField(fieldName: string): boolean {
        return this.fields.hasOwnProperty(fieldName);
    }
    toString(): string {
        // replaces BigDecimals with strings to avoid BigInt error of JSON.stringify.
        // Also replaces some data types to make them more readable.
        return JSON.stringify({
            [this.schema.typeName]: this.values
        }, (key, value) => {
            if (value instanceof CompactGenericRecordImpl) {
                return value.values;
            }
            if (value instanceof BigDecimal) {
                return {
                    type: 'BigDecimal',
                    data: value.toString()
                };
            }
            if (value instanceof Long) {
                return {
                    type: 'Long',
                    data: value.toString()
                };
            }
            if (value instanceof LocalTime) {
                return {
                    type: 'LocalTime',
                    data: value.toString()
                };
            }
            if (value instanceof LocalDate) {
                return {
                    type: 'LocalDate',
                    data: value.toString()
                };
            }
            if (value instanceof LocalDateTime) {
                return {
                    type: 'LocalDateTime',
                    data: value.toString()
                };
            }
            if (value instanceof OffsetDateTime) {
                return {
                    type: 'OffsetDateTime',
                    data: value.toString()
                };
            }
            return value;
        });
    }
}


