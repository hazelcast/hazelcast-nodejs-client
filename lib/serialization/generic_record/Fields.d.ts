/// <reference types="node" />
import * as Long from 'long';
import { FieldKind } from './FieldKind';
import { BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime } from '../../core';
import { GenericRecord } from './GenericRecord';
/**
 * Represents a field that is used when building a {@link GenericRecord}. Every field is associated with a {@link FieldKind}.
 *
 * @param T The field's corresponding type in JavaScript.
 *
 */
export interface Field<T> {
    /**
     * The kind this field is associated with.
     */
    kind: FieldKind;
}
export declare const BOOLEAN: Field<boolean>;
export declare const ARRAY_OF_BOOLEAN: Field<boolean[] | null>;
export declare const INT8: Field<number>;
export declare const ARRAY_OF_INT8: Field<Buffer | null>;
export declare const INT16: Field<number>;
export declare const ARRAY_OF_INT16: Field<number[] | null>;
export declare const INT32: Field<number>;
export declare const ARRAY_OF_INT32: Field<number[] | null>;
export declare const INT64: Field<Long>;
export declare const ARRAY_OF_INT64: Field<Long[] | null>;
export declare const FLOAT32: Field<number>;
export declare const ARRAY_OF_FLOAT32: Field<number[] | null>;
export declare const FLOAT64: Field<number>;
export declare const ARRAY_OF_FLOAT64: Field<number[] | null>;
export declare const STRING: Field<string | null>;
export declare const ARRAY_OF_STRING: Field<(string | null)[] | null>;
export declare const DECIMAL: Field<BigDecimal | null>;
export declare const ARRAY_OF_DECIMAL: Field<(BigDecimal | null)[] | null>;
export declare const TIME: Field<LocalTime | null>;
export declare const ARRAY_OF_TIME: Field<(LocalTime | null)[] | null>;
export declare const DATE: Field<LocalDate | null>;
export declare const ARRAY_OF_DATE: Field<(LocalDate | null)[] | null>;
export declare const TIMESTAMP: Field<(LocalDateTime | null)>;
export declare const ARRAY_OF_TIMESTAMP: Field<(LocalDateTime | null)[] | null>;
export declare const TIMESTAMP_WITH_TIMEZONE: Field<OffsetDateTime | null>;
export declare const ARRAY_OF_TIMESTAMP_WITH_TIMEZONE: Field<(OffsetDateTime | null)[] | null>;
export declare const NULLABLE_BOOLEAN: Field<boolean | null>;
export declare const ARRAY_OF_NULLABLE_BOOLEAN: Field<(boolean | null)[] | null>;
export declare const NULLABLE_INT8: Field<number | null>;
export declare const ARRAY_OF_NULLABLE_INT8: Field<(number | null)[] | null>;
export declare const NULLABLE_INT16: Field<number | null>;
export declare const ARRAY_OF_NULLABLE_INT16: Field<(number | null)[] | null>;
export declare const NULLABLE_INT32: Field<number | null>;
export declare const ARRAY_OF_NULLABLE_INT32: Field<(number | null)[] | null>;
export declare const NULLABLE_INT64: Field<Long | null>;
export declare const ARRAY_OF_NULLABLE_INT64: Field<(Long | null)[] | null>;
export declare const NULLABLE_FLOAT32: Field<number | null>;
export declare const ARRAY_OF_NULLABLE_FLOAT32: Field<(number | null)[] | null>;
export declare const NULLABLE_FLOAT64: Field<number | null>;
export declare const ARRAY_OF_NULLABLE_FLOAT64: Field<(number | null)[] | null>;
export declare const GENERIC_RECORD: Field<GenericRecord | null>;
export declare const ARRAY_OF_GENERIC_RECORD: Field<(GenericRecord | null)[] | null>;
