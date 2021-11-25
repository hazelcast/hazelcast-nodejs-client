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

import * as Long from 'long';
import {FieldKind} from './FieldKind';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import {GenericRecord} from './GenericRecord';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Field<T> {
    kind: FieldKind
}

export type Nullable<T> = T | null;

export const boolean: Field<boolean> = {
    kind: FieldKind.BOOLEAN
}
export const arrayOfBooleans: Field<boolean[]> = {
    kind: FieldKind.ARRAY_OF_BOOLEANS
}
export const byte: Field<number> = {
    kind: FieldKind.BYTE
}
export const arrayOfBytes: Field<number[]> = {
    kind: FieldKind.ARRAY_OF_BYTES
}
export const char: Field<string> = {
    kind: FieldKind.CHAR
}
export const arrayOfChars: Field<string[]> = {
    kind: FieldKind.ARRAY_OF_CHARS
}
export const short: Field<number> = {
    kind: FieldKind.SHORT
}
export const arrayOfShorts: Field<number[]> = {
    kind: FieldKind.ARRAY_OF_SHORTS
}
export const int: Field<number> = {
    kind: FieldKind.INT
}
export const arrayOfInts: Field<number[]> = {
    kind: FieldKind.ARRAY_OF_INTS
}
export const long: Field<Long> = {
    kind: FieldKind.LONG
}
export const arrayOfLongs: Field<Long[]> = {
    kind: FieldKind.ARRAY_OF_LONGS
}
export const float: Field<number> = {
    kind: FieldKind.FLOAT
}
export const arrayOfFloats: Field<number[]> = {
    kind: FieldKind.ARRAY_OF_FLOATS
}
export const double: Field<number> = {
    kind: FieldKind.DOUBLE
}
export const arrayOfDoubles: Field<number[]> = {
    kind: FieldKind.ARRAY_OF_DOUBLES
}
export const string: Field<string> = {
    kind: FieldKind.STRING
}
export const arrayOfStrings: Field<string[]> = {
    kind: FieldKind.ARRAY_OF_STRINGS
}
export const decimal: Field<BigDecimal> = {
    kind: FieldKind.DECIMAL
}
export const arrayOfDecimals: Field<BigDecimal[]> = {
    kind: FieldKind.ARRAY_OF_DECIMALS
}
export const time: Field<LocalTime> = {
    kind: FieldKind.TIME
}
export const arrayOfTimes: Field<LocalTime[]> = {
    kind: FieldKind.ARRAY_OF_TIMES
}
export const date: Field<LocalDate> = {
    kind: FieldKind.DATE
}
export const arrayOfDates: Field<LocalDate[]> = {
    kind: FieldKind.ARRAY_OF_DATES
}
export const timestamp: Field<LocalDateTime> = {
    kind: FieldKind.TIMESTAMP
}
export const arrayOfTimestamps: Field<LocalDateTime[]> = {
    kind: FieldKind.ARRAY_OF_TIMESTAMPS
}
export const timestampWithTimezone: Field<OffsetDateTime> = {
    kind: FieldKind.TIMESTAMP_WITH_TIMEZONE
}
export const arrayOfTimestampWithTimezone: Field<OffsetDateTime[]> = {
    kind: FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONES
}
export const genericRecord: Field<GenericRecord> = {
    kind: FieldKind.GENERIC_RECORD
}
export const arrayOfGenericRecords: Field<GenericRecord[]> = {
    kind: FieldKind.ARRAY_OF_GENERIC_RECORDS
}
export const nullableBoolean: Field<Nullable<boolean>> = {
    kind: FieldKind.NULLABLE_BOOLEAN
}
export const arrayOfNullableBooleans: Field<Nullable<boolean>[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_BOOLEANS
}
export const nullableByte: Field<Nullable<number>> = {
    kind: FieldKind.NULLABLE_BYTE
}
export const arrayOfNullableBytes: Field<Nullable<number>[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_BYTES
}
export const nullableShort: Field<Nullable<number>> = {
    kind: FieldKind.NULLABLE_SHORT
}
export const arrayOfNullableShorts: Field<Nullable<number>[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_SHORTS
}
export const nullableInt: Field<Nullable<number>> = {
    kind: FieldKind.NULLABLE_INT
}
export const arrayOfNullableInts: Field<Nullable<number>[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_INTS
}
export const nullableLong: Field<Nullable<Long>> = {
    kind: FieldKind.NULLABLE_LONG
}
export const arrayOfNullableLongs: Field<Nullable<Long>[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_LONGS
}
export const nullableFloat: Field<Nullable<number>> = {
    kind: FieldKind.NULLABLE_FLOAT
}
export const arrayOfNullableFloats: Field<Nullable<number>[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_FLOATS
}
export const nullableDouble: Field<Nullable<number>> = {
    kind: FieldKind.NULLABLE_DOUBLE
}
export const arrayOfNullableDoubles: Field<Nullable<number>[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_DOUBLES
}
