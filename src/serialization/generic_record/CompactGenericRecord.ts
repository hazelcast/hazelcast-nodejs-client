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
/** @ignore *//** */

import {GenericRecord} from './GenericRecord';
import {
    BigDecimal,
    HazelcastSerializationError,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime,
} from '../../core';
import {FieldKind} from './FieldKind';
import {Field} from './Fields';
import {Schema} from '../compact/Schema';
import {SchemaWriter} from '../compact/SchemaWriter';
import {FieldDescriptor} from './FieldDescriptor';
import {CompactExceptions} from '../compact/CompactUtil';
import {FieldValidator} from './FieldValidator';
import * as Long from 'long';

/**
 * Represents a deserialized compact generic record. This class is what user gets.
 * @internal
 */
export class CompactGenericRecordImpl implements GenericRecord {

    private readonly schema: Schema;

    constructor(
        typeName: string,
        private readonly fields: {[name: string]: Field<any>},
        readonly values: {[name: string]: any},
        // When building from DefaultCompactReader, we can reuse the schema
        schema?: Schema
    ) {
        if (typeof typeName !== 'string') {
            throw new TypeError('Type name must be a string');
        }

        if (schema !== undefined) {
            this.schema = schema;
            for (const [fieldName, field] of Object.entries(fields)) {
                FieldValidator.validateField(fieldName, field.kind, this.values[fieldName]);
            }
        } else {
            const schemaWriter = new SchemaWriter(typeName);
            for (const [fieldName, field] of Object.entries(fields)) {
                FieldValidator.validateField(fieldName, field.kind, this.values[fieldName]);
                schemaWriter.addField(new FieldDescriptor(fieldName, field.kind));
            }
            this.schema = schemaWriter.build();
        }
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

    getFieldNames(): Set<string> {
        return new Set(Object.keys(this.fields));
    }

    getFieldKind(fieldName: string): FieldKind {
        if (!this.schema.fieldDefinitionMap.has(fieldName)) {
            throw RangeError('There is no field named as '+ fieldName);
        }
        return this.schema.fieldDefinitionMap.get(fieldName).kind;
    }

    hasField(fieldName: string): boolean {
        return this.fields.hasOwnProperty(fieldName);
    }

    getBoolean(fieldName: string): boolean {
        return this.getNonNull(fieldName, FieldKind.BOOLEAN, FieldKind.NULLABLE_BOOLEAN, 'Boolean');
    }

    getInt8(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.INT8, FieldKind.NULLABLE_INT8, 'Int8');
    }

    getInt16(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.INT16, FieldKind.NULLABLE_INT16, 'Int16');
    }

    getInt32(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.INT32, FieldKind.NULLABLE_INT32, 'Int32');
    }

    getInt64(fieldName: string): Long {
        return this.getNonNull(fieldName, FieldKind.INT64, FieldKind.NULLABLE_INT64, 'Int64');
    }

    getFloat32(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.FLOAT32, FieldKind.NULLABLE_FLOAT32, 'Float32');
    }

    getFloat64(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.FLOAT64, FieldKind.NULLABLE_FLOAT64, 'Float64');
    }

    getString(fieldName: string): string | null {
        return this.get(fieldName, FieldKind.STRING);
    }

    getDecimal(fieldName: string): BigDecimal | null {
        return this.get(fieldName, FieldKind.DECIMAL);
    }

    getTime(fieldName: string): LocalTime | null {
        return this.get(fieldName, FieldKind.TIME);
    }

    getDate(fieldName: string): LocalDate | null {
        return this.get(fieldName, FieldKind.DATE);
    }

    getTimestamp(fieldName: string): LocalDateTime | null {
        return this.get(fieldName, FieldKind.TIMESTAMP);
    }

    getTimestampWithTimezone(fieldName: string): OffsetDateTime | null {
        return this.get(fieldName, FieldKind.TIMESTAMP_WITH_TIMEZONE);
    }

    getGenericRecord(fieldName: string): GenericRecord {
        return this.get(fieldName, FieldKind.COMPACT);
    }

    getArrayOfBoolean(fieldName: string): boolean[] {
        return this.getArrayOfPrimitives(
            fieldName, 'ArrayOfBoolean', FieldKind.ARRAY_OF_BOOLEAN, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN
        );
    }

    getArrayOfInt8(fieldName: string): Buffer {
        return Buffer.from(this.getArrayOfPrimitives(
            fieldName, 'ArrayOfInt8', FieldKind.ARRAY_OF_INT8, FieldKind.ARRAY_OF_NULLABLE_INT8
        ));
    }

    getArrayOfInt16(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'ArrayOfInt16', FieldKind.ARRAY_OF_INT16, FieldKind.ARRAY_OF_NULLABLE_INT16
        );
    }

    getArrayOfInt32(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'ArrayOfInt32', FieldKind.ARRAY_OF_INT32, FieldKind.ARRAY_OF_NULLABLE_INT32
        );
    }

    getArrayOfInt64(fieldName: string): Long[] {
        return this.getArrayOfPrimitives(
            fieldName, 'ArrayOfInt64', FieldKind.ARRAY_OF_INT64, FieldKind.ARRAY_OF_NULLABLE_INT64
        );
    }

    getArrayOfFloat32(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'ArrayOfFloat32', FieldKind.ARRAY_OF_FLOAT32, FieldKind.ARRAY_OF_NULLABLE_FLOAT32
        );
    }

    getArrayOfFloat64(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'ArrayOfFloat64', FieldKind.ARRAY_OF_FLOAT64, FieldKind.ARRAY_OF_NULLABLE_FLOAT64
        );
    }

    getArrayOfString(fieldName: string): (string | null)[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_STRING);
    }

    getArrayOfDecimal(fieldName: string): (BigDecimal | null)[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_DECIMAL);
    }

    getArrayOfTime(fieldName: string): (LocalTime | null)[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_TIME);
    }

    getArrayOfDate(fieldName: string): (LocalDate | null)[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_DATE);
    }

    getArrayOfTimestamp(fieldName: string): (LocalDateTime | null)[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_TIMESTAMP);
    }

    getArrayOfTimestampWithTimezone(fieldName: string): (OffsetDateTime | null)[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE);
    }

    getArrayOfGenericRecord(fieldName: string): (GenericRecord | null)[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_COMPACT);
    }

    getNullableBoolean(fieldName: string): boolean | null {
        return this.get(fieldName, FieldKind.BOOLEAN, FieldKind.NULLABLE_BOOLEAN);
    }

    getNullableInt8(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.INT8, FieldKind.NULLABLE_INT8);
    }

    getNullableInt16(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.INT16, FieldKind.NULLABLE_INT16);
    }

    getNullableInt32(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.INT32, FieldKind.NULLABLE_INT32);
    }

    getNullableInt64(fieldName: string): Long | null {
        return this.get(fieldName, FieldKind.INT64, FieldKind.NULLABLE_INT64);
    }

    getNullableFloat32(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.FLOAT32, FieldKind.NULLABLE_FLOAT32);
    }

    getNullableFloat64(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.FLOAT64, FieldKind.NULLABLE_FLOAT64);
    }

    getArrayOfNullableBoolean(fieldName: string): (boolean | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_BOOLEAN, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN);
    }

    getArrayOfNullableInt8(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_INT8, FieldKind.ARRAY_OF_NULLABLE_INT8);
    }

    getArrayOfNullableInt16(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_INT16, FieldKind.ARRAY_OF_NULLABLE_INT16);
    }

    getArrayOfNullableInt32(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_INT32, FieldKind.ARRAY_OF_NULLABLE_INT32);
    }

    getArrayOfNullableInt64(fieldName: string): (Long | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_INT64, FieldKind.ARRAY_OF_NULLABLE_INT64);
    }

    getArrayOfNullableFloat32(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_FLOAT32, FieldKind.ARRAY_OF_NULLABLE_FLOAT32);
    }

    getArrayOfNullableFloat64(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_FLOAT64, FieldKind.ARRAY_OF_NULLABLE_FLOAT64);
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

    getSchema(): Schema {
        return this.schema;
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

        let v: any;
        const cloned: any = Array.isArray(obj) ? [] : {};
        for (const k in obj) {
            v = obj[k];
            cloned[k] = (typeof v === 'object') ? CompactGenericRecordImpl.deepCloneCompactGenericRecordValues(v) : v;
        }

        return cloned;
    }

    private check(fieldName: string, firstKind: FieldKind, secondKind?: FieldKind) : FieldKind {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === undefined) {
            throw new HazelcastSerializationError(`Invalid field name: '${fieldName}' for schema ${this.schema}`);
        }
        const fieldKind = fd.kind;
        let fieldKindsString = FieldKind[firstKind];
        let valid = false;

        valid = valid || (fieldKind === firstKind);

        if (secondKind !== undefined) {
            valid = valid || (fieldKind === secondKind);
            fieldKindsString += ` or ${FieldKind[secondKind]}`;
        }

        if (!valid) {
            throw new HazelcastSerializationError(`Invalid field kind: '${fieldKind}' for schema '${this.schema}',`
                + `valid field kinds: ${fieldKindsString}, found: ${fieldKind}`);
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

    private get(fieldName: string, firstKind: FieldKind, secondKind?: FieldKind): any {
        this.check(fieldName, firstKind, secondKind);
        return this.values[fieldName];
    }

    private getArrayOfPrimitives(
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

    private getArrayOfNullables(
        fieldName: string, primitiveFieldKind: FieldKind, nullableFieldKind: FieldKind
    ): any[] {
        this.check(fieldName, primitiveFieldKind, nullableFieldKind);
        return this.values[fieldName];
    }
}
