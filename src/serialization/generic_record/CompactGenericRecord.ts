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
        className: string,
        private readonly fields: {[name: string]: Field<any>},
        private readonly values: {[name: string]: any}
    ) {
        const schemaWriter = new SchemaWriter(className);
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

    getArrayOfBooleans(fieldName: string): boolean[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Booleans', FieldKind.ARRAY_OF_BOOLEANS, FieldKind.ARRAY_OF_NULLABLE_BOOLEANS
        );
    }

    getArrayOfBytes(fieldName: string): Buffer {
        return Buffer.from(this.getArrayOfPrimitives(
            fieldName, 'Bytes', FieldKind.ARRAY_OF_BYTES, FieldKind.ARRAY_OF_NULLABLE_BYTES
        ));
    }

    getArrayOfChars(fieldName: string): string[] {
        throw new UnsupportedOperationError('Compact format does not support reading an array of chars field');
    }

    getArrayOfDates(fieldName: string): LocalDate[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_DATES);
    }

    getArrayOfDecimals(fieldName: string): BigDecimal[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_DECIMALS);
    }

    getArrayOfDoubles(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Doubles', FieldKind.ARRAY_OF_DOUBLES, FieldKind.ARRAY_OF_NULLABLE_DOUBLES
        );
    }

    getArrayOfFloats(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Floats', FieldKind.ARRAY_OF_FLOATS, FieldKind.ARRAY_OF_NULLABLE_FLOATS
        );
    }

    getArrayOfGenericRecords(fieldName: string): GenericRecord[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_COMPACTS);
    }

    getArrayOfInts(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Ints', FieldKind.ARRAY_OF_INTS, FieldKind.ARRAY_OF_NULLABLE_INTS
        );
    }

    getArrayOfLongs(fieldName: string): Long[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Longs', FieldKind.ARRAY_OF_LONGS, FieldKind.ARRAY_OF_NULLABLE_LONGS
        );
    }

    getArrayOfNullableBooleans(fieldName: string): (boolean | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_BOOLEANS, FieldKind.ARRAY_OF_NULLABLE_BOOLEANS);
    }

    getArrayOfNullableBytes(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_BYTES, FieldKind.ARRAY_OF_NULLABLE_BYTES);
    }

    getArrayOfNullableDoubles(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_DOUBLES, FieldKind.ARRAY_OF_NULLABLE_DOUBLES);
    }

    getArrayOfNullableFloats(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_FLOATS, FieldKind.ARRAY_OF_NULLABLE_FLOATS);
    }

    getArrayOfNullableInts(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_INTS, FieldKind.ARRAY_OF_NULLABLE_INTS);
    }

    getArrayOfNullableLongs(fieldName: string): (Long | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_LONGS, FieldKind.ARRAY_OF_NULLABLE_LONGS);
    }

    getArrayOfNullableShorts(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(fieldName, FieldKind.ARRAY_OF_SHORTS, FieldKind.ARRAY_OF_NULLABLE_SHORTS);
    }

    getArrayOfShorts(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName, 'Shorts', FieldKind.ARRAY_OF_SHORTS, FieldKind.ARRAY_OF_NULLABLE_SHORTS
        );
    }

    getArrayOfStrings(fieldName: string): string[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_STRINGS);
    }

    getArrayOfTimes(fieldName: string): LocalTime[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_TIMES);
    }

    getArrayOfTimestampWithTimezones(fieldName: string): OffsetDateTime[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONES);
    }

    getArrayOfTimestamps(fieldName: string): LocalDateTime[] {
        return this.get(fieldName, FieldKind.ARRAY_OF_TIMESTAMPS);
    }

    getBoolean(fieldName: string): boolean {
        return this.getNonNull(fieldName, FieldKind.BOOLEAN, FieldKind.NULLABLE_BOOLEAN, 'Boolean');
    }

    getByte(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.BYTE, FieldKind.NULLABLE_BYTE, 'Byte');
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

    getFloat(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.FLOAT, FieldKind.NULLABLE_FLOAT, 'Float');
    }

    getFieldKind(fieldName: string): FieldKind {
        return this.schema.fieldDefinitionMap.get(fieldName).kind;
    }

    getFieldNames(): Set<string> {
        return new Set(Object.keys(this.fields));
    }

    getDouble(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.DOUBLE, FieldKind.NULLABLE_DOUBLE, 'Double');
    }

    getGenericRecord(fieldName: string): GenericRecord {
        return this.get(fieldName, FieldKind.COMPACT);
    }

    getInt(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.INT, FieldKind.NULLABLE_INT, 'Int');
    }

    getLong(fieldName: string): Long {
        return this.getNonNull(fieldName, FieldKind.LONG, FieldKind.NULLABLE_LONG, 'Long');
    }

    getNullableBoolean(fieldName: string): boolean | null {
        return this.get(fieldName, FieldKind.BOOLEAN, FieldKind.NULLABLE_BOOLEAN);
    }

    getNullableByte(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.BYTE, FieldKind.NULLABLE_BYTE);
    }

    getNullableDouble(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.DOUBLE, FieldKind.NULLABLE_DOUBLE);
    }

    getNullableFloat(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.FLOAT, FieldKind.NULLABLE_FLOAT);
    }

    getNullableInt(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.INT, FieldKind.NULLABLE_INT);
    }

    getNullableLong(fieldName: string): Long | null {
        return this.get(fieldName, FieldKind.LONG, FieldKind.NULLABLE_LONG);
    }

    getNullableShort(fieldName: string): number | null {
        return this.get(fieldName, FieldKind.SHORT, FieldKind.NULLABLE_SHORT);
    }

    getShort(fieldName: string): number {
        return this.getNonNull(fieldName, FieldKind.SHORT, FieldKind.NULLABLE_SHORT, 'Short');
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


