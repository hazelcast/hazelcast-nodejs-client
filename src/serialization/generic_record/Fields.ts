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


/**
 * Represents a field that is used when building a {@link GenericRecord}. Every field is associated with a {@link FieldKind}.
 *
 * @param T The field's corresponding type in JavaScript.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Field<T> {
    /**
     * The kind this field is associated with.
     */
    kind: FieldKind
}

export const boolean: Field<boolean> = {
    kind: FieldKind.BOOLEAN
}
export const arrayOfBoolean: Field<boolean[]> = {
    kind: FieldKind.ARRAY_OF_BOOLEAN
}
export const int8: Field<number> = {
    kind: FieldKind.INT8
}
export const arrayOfInt8: Field<Buffer> = {
    kind: FieldKind.ARRAY_OF_INT8
}
export const int16: Field<number> = {
    kind: FieldKind.INT16
}
export const arrayOfInt16: Field<number[]> = {
    kind: FieldKind.ARRAY_OF_INT16
}
export const int32: Field<number> = {
    kind: FieldKind.INT32
}
export const arrayOfInt32: Field<number[]> = {
    kind: FieldKind.ARRAY_OF_INT32
}
export const int64: Field<Long> = {
    kind: FieldKind.INT64
}
export const arrayOfInt64: Field<Long[]> = {
    kind: FieldKind.ARRAY_OF_INT64
}
export const float32: Field<number> = {
    kind: FieldKind.FLOAT32
}
export const arrayOfFloat32: Field<number[]> = {
    kind: FieldKind.ARRAY_OF_FLOAT32
}
export const float64: Field<number> = {
    kind: FieldKind.FLOAT64
}
export const arrayOfFloat64: Field<number[]> = {
    kind: FieldKind.ARRAY_OF_FLOAT64
}
export const string: Field<string> = {
    kind: FieldKind.STRING
}
export const arrayOfString: Field<string[]> = {
    kind: FieldKind.ARRAY_OF_STRING
}
export const decimal: Field<BigDecimal> = {
    kind: FieldKind.DECIMAL
}
export const arrayOfDecimal: Field<BigDecimal[]> = {
    kind: FieldKind.ARRAY_OF_DECIMAL
}
export const time: Field<LocalTime> = {
    kind: FieldKind.TIME
}
export const arrayOfTime: Field<LocalTime[]> = {
    kind: FieldKind.ARRAY_OF_TIME
}
export const date: Field<LocalDate> = {
    kind: FieldKind.DATE
}
export const arrayOfDate: Field<LocalDate[]> = {
    kind: FieldKind.ARRAY_OF_DATE
}
export const timestamp: Field<LocalDateTime> = {
    kind: FieldKind.TIMESTAMP
}
export const arrayOfTimestamp: Field<LocalDateTime[]> = {
    kind: FieldKind.ARRAY_OF_TIMESTAMP
}
export const timestampWithTimezone: Field<OffsetDateTime> = {
    kind: FieldKind.TIMESTAMP_WITH_TIMEZONE
}
export const arrayOfTimestampWithTimezone: Field<OffsetDateTime[]> = {
    kind: FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE
}
export const nullableBoolean: Field<boolean | null> = {
    kind: FieldKind.NULLABLE_BOOLEAN
}
export const arrayOfNullableBoolean: Field<(boolean | null)[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_BOOLEAN
}
export const nullableInt8: Field<number | null> = {
    kind: FieldKind.NULLABLE_INT8
}
export const arrayOfNullableInt8: Field<(number | null)[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_INT8
}
export const nullableInt16: Field<number | null> = {
    kind: FieldKind.NULLABLE_INT16
}
export const arrayOfNullableInt16: Field<(number | null)[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_INT16
}
export const nullableInt32: Field<number | null> = {
    kind: FieldKind.NULLABLE_INT32
}
export const arrayOfNullableInt32: Field<(number | null)[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_INT32
}
export const nullableInt64: Field<Long | null> = {
    kind: FieldKind.NULLABLE_INT64
}
export const arrayOfNullableInt64: Field<(Long | null)[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_INT64
}
export const nullableFloat32: Field<number | null> = {
    kind: FieldKind.NULLABLE_FLOAT32
}
export const arrayOfNullableFloat32: Field<(number | null)[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_FLOAT32
}
export const nullableFloat64: Field<number | null> = {
    kind: FieldKind.NULLABLE_FLOAT64
}
export const arrayOfNullableFloat64: Field<(number | null)[]> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_FLOAT64
}
export const genericRecord: Field<GenericRecord> = {
    kind: FieldKind.COMPACT
}
export const arrayOfGenericRecord: Field<GenericRecord[]> = {
    kind: FieldKind.ARRAY_OF_COMPACT
}
