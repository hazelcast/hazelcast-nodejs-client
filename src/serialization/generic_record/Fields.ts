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

import * as Long from 'long';
import {FieldKind} from './FieldKind';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import {GenericRecord} from './GenericRecord';

/**
 * Represents a field that is used when building a {@link GenericRecord}. Every field is associated with a {@link FieldKind}.
 *
 * @param T The field's corresponding type in JavaScript.
 *
 * This API is currently in Beta and can change at any time.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Field<T> {
    /**
     * The kind this field is associated with.
     */
    kind: FieldKind
}

export const BOOLEAN: Field<boolean> = {
    kind: FieldKind.BOOLEAN
}
export const ARRAY_OF_BOOLEAN: Field<boolean[] | null> = {
    kind: FieldKind.ARRAY_OF_BOOLEAN
}
export const INT8: Field<number> = {
    kind: FieldKind.INT8
}
export const ARRAY_OF_INT8: Field<Buffer | null> = {
    kind: FieldKind.ARRAY_OF_INT8
}
export const INT16: Field<number> = {
    kind: FieldKind.INT16
}
export const ARRAY_OF_INT16: Field<number[] | null> = {
    kind: FieldKind.ARRAY_OF_INT16
}
export const INT32: Field<number> = {
    kind: FieldKind.INT32
}
export const ARRAY_OF_INT32: Field<number[] | null> = {
    kind: FieldKind.ARRAY_OF_INT32
}
export const INT64: Field<Long> = {
    kind: FieldKind.INT64
}
export const ARRAY_OF_INT64: Field<Long[] | null> = {
    kind: FieldKind.ARRAY_OF_INT64
}
export const FLOAT32: Field<number> = {
    kind: FieldKind.FLOAT32
}
export const ARRAY_OF_FLOAT32: Field<number[] | null> = {
    kind: FieldKind.ARRAY_OF_FLOAT32
}
export const FLOAT64: Field<number> = {
    kind: FieldKind.FLOAT64
}
export const ARRAY_OF_FLOAT64: Field<number[] | null> = {
    kind: FieldKind.ARRAY_OF_FLOAT64
}
export const STRING: Field<string | null> = {
    kind: FieldKind.STRING
}
export const ARRAY_OF_STRING: Field<(string | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_STRING
}
export const DECIMAL: Field<BigDecimal | null> = {
    kind: FieldKind.DECIMAL
}
export const ARRAY_OF_DECIMAL: Field<(BigDecimal | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_DECIMAL
}
export const TIME: Field<LocalTime | null> = {
    kind: FieldKind.TIME
}
export const ARRAY_OF_TIME: Field<(LocalTime | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_TIME
}
export const DATE: Field<LocalDate | null> = {
    kind: FieldKind.DATE
}
export const ARRAY_OF_DATE: Field<(LocalDate | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_DATE
}
export const TIMESTAMP: Field<(LocalDateTime | null)> = {
    kind: FieldKind.TIMESTAMP
}
export const ARRAY_OF_TIMESTAMP: Field<(LocalDateTime | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_TIMESTAMP
}
export const TIMESTAMP_WITH_TIMEZONE: Field<OffsetDateTime | null> = {
    kind: FieldKind.TIMESTAMP_WITH_TIMEZONE
}
export const ARRAY_OF_TIMESTAMP_WITH_TIMEZONE: Field<(OffsetDateTime | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE
}
export const NULLABLE_BOOLEAN: Field<boolean | null> = {
    kind: FieldKind.NULLABLE_BOOLEAN
}
export const ARRAY_OF_NULLABLE_BOOLEAN: Field<(boolean | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_BOOLEAN
}
export const NULLABLE_INT8: Field<number | null> = {
    kind: FieldKind.NULLABLE_INT8
}
export const ARRAY_OF_NULLABLE_INT8: Field<(number | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_INT8
}
export const NULLABLE_INT16: Field<number | null> = {
    kind: FieldKind.NULLABLE_INT16
}
export const ARRAY_OF_NULLABLE_INT16: Field<(number | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_INT16
}
export const NULLABLE_INT32: Field<number | null> = {
    kind: FieldKind.NULLABLE_INT32
}
export const ARRAY_OF_NULLABLE_INT32: Field<(number | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_INT32
}
export const NULLABLE_INT64: Field<Long | null> = {
    kind: FieldKind.NULLABLE_INT64
}
export const ARRAY_OF_NULLABLE_INT64: Field<(Long | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_INT64
}
export const NULLABLE_FLOAT32: Field<number | null> = {
    kind: FieldKind.NULLABLE_FLOAT32
}
export const ARRAY_OF_NULLABLE_FLOAT32: Field<(number | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_FLOAT32
}
export const NULLABLE_FLOAT64: Field<number | null> = {
    kind: FieldKind.NULLABLE_FLOAT64
}
export const ARRAY_OF_NULLABLE_FLOAT64: Field<(number | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_NULLABLE_FLOAT64
}
export const GENERIC_RECORD: Field<GenericRecord | null> = {
    kind: FieldKind.COMPACT
}
export const ARRAY_OF_GENERIC_RECORD: Field<(GenericRecord | null)[] | null> = {
    kind: FieldKind.ARRAY_OF_COMPACT
}
