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

import {GenericRecord, IS_GENERIC_RECORD_SYMBOL} from './GenericRecord';
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
import {Field} from './Field';
import {Schema} from '../compact/Schema';
import {SchemaWriter} from '../compact/SchemaWriter';
import {FieldDescriptor} from './FieldDescriptor';
import {CompactUtil} from '../compact/CompactUtil';
import * as Long from 'long';

/**
 * @internal
 */
export interface CompactGenericRecord extends GenericRecord {
    getSchema(): Schema;
}

/**
 * @internal
 */
export class CompactGenericRecordImpl implements CompactGenericRecord {

    private readonly [IS_GENERIC_RECORD_SYMBOL] = true;
    private readonly schema;

    constructor(
        typeName: string,
        private readonly fields: {[name: string]: Field<any>},
        private readonly values: {[name: string]: any}
    ) {
        const schemaWriter = new SchemaWriter(typeName);
        for (const [fieldName, field] of Object.entries(fields)) {
            schemaWriter.addField(new FieldDescriptor(fieldName, field.kind));
        }
        this.schema = schemaWriter.build();
    }

    private check(fieldName: string, ...kinds: FieldKind[]) : FieldKind {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === undefined) {
            throw new HazelcastSerializationError(`Invalid field name: '${fieldName}' for schema ${JSON.stringify(this.schema)}`);
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
            throw CompactUtil.toExceptionForUnexpectedNullValue(fieldName, methodSuffix);
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
                    throw CompactUtil.toExceptionForUnexpectedNullValueInArray(fieldName, methodSuffix);
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
}


