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

import {CompactWriter} from './CompactWriter';
import {Schema} from './Schema';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import * as Long from 'long';
import {FieldDescriptor} from '../generic_record/FieldDescriptor';
import {FieldKind} from '../generic_record/FieldKind';

/**
 * @internal
 */
export class SchemaWriter implements CompactWriter {
    private readonly typeName: string;
    private readonly fields: FieldDescriptor[];

    constructor(typeName: string) {
        this.typeName = typeName;
        this.fields = [];
    }

    writeBoolean(fieldName: string, value: boolean): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.BOOLEAN));
    }

    writeInt8(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT8));
    }

    writeInt16(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT16));
    }

    writeInt32(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT32));
    }

    writeInt64(fieldName: string, value: Long): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.INT64));
    }

    writeFloat32(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.FLOAT32));
    }

    writeFloat64(fieldName: string, value: number): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.FLOAT64));
    }

    writeString(fieldName: string, value: string | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.STRING));
    }

    writeDecimal(fieldName: string, value: BigDecimal | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.DECIMAL));
    }

    writeTime(fieldName: string, value: LocalTime | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.TIME));
    }

    writeDate(fieldName: string, value: LocalDate | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.DATE));
    }

    writeTimestamp(fieldName: string, value: LocalDateTime | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.TIMESTAMP));
    }

    writeTimestampWithTimezone(fieldName: string, value: OffsetDateTime | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.TIMESTAMP_WITH_TIMEZONE));
    }

    writeCompact<T>(fieldName: string, value: T | null): Promise<void> {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.COMPACT));
        return Promise.resolve();
    }

    writeArrayOfBoolean(fieldName: string, value: boolean[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_BOOLEAN));
    }

    writeArrayOfInt8(fieldName: string, value: Buffer | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INT8));
    }

    writeArrayOfInt16(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INT16));
    }

    writeArrayOfInt32(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INT32));
    }

    writeArrayOfInt64(fieldName: string, value: Long[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_INT64));
    }

    writeArrayOfFloat32(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_FLOAT32));
    }

    writeArrayOfFloat64(fieldName: string, value: number[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_FLOAT64));
    }

    writeArrayOfString(fieldName: string, value: (string | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_STRING));
    }

    writeArrayOfDecimal(fieldName: string, value: (BigDecimal | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DECIMAL));
    }

    writeArrayOfTime(fieldName: string, value: (LocalTime | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIME));
    }

    writeArrayOfDate(fieldName: string, value: (LocalDate | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_DATE));
    }

    writeArrayOfTimestamp(fieldName: string, value: (LocalDateTime | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMESTAMP));
    }

    writeArrayOfTimestampWithTimezone(fieldName: string, value: (OffsetDateTime | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE));
    }

    writeArrayOfCompact<T>(fieldName: string, value: (T | null)[] | null): Promise<void> {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_COMPACT));
        return Promise.resolve();
    }

    writeNullableBoolean(fieldName: string, value: boolean | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_BOOLEAN));
    }

    writeNullableInt8(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT8));
    }

    writeNullableInt16(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT16));
    }

    writeNullableInt32(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT32));
    }

    writeNullableInt64(fieldName: string, value: Long | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_INT64));
    }

    writeNullableFloat32(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_FLOAT32));
    }

    writeNullableFloat64(fieldName: string, value: number | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.NULLABLE_FLOAT64));
    }

    writeArrayOfNullableBoolean(fieldName: string, value: (boolean | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN));
    }

    writeArrayOfNullableInt8(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT8));
    }

    writeArrayOfNullableInt16(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT16));
    }

    writeArrayOfNullableInt32(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT32));
    }

    writeArrayOfNullableInt64(fieldName: string, value: (Long | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT64));
    }

    writeArrayOfNullableFloat32(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT32));
    }

    writeArrayOfNullableFloat64(fieldName: string, value: (number | null)[] | null): void {
        this.fields.push(new FieldDescriptor(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT64));
    }

    addField(field: FieldDescriptor): void {
        this.fields.push(field);
    }

    build() : Schema {
        return new Schema(this.typeName, this.fields.sort((field1, field2) => {
            return field1.fieldName > field2.fieldName ? 1 : -1;
        }));
    }
}
