/// <reference types="node" />
import * as Long from 'long';
import { BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime } from '../../core';
/**
 * Provides means of writing compact serialized fields to the binary data.
 *
 */
export interface CompactWriter {
    /**
     * Writes a boolean.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeBoolean(fieldName: string, value: boolean): void;
    /**
     * Writes an 8-bit two's complement signed integer.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeInt8(fieldName: string, value: number): void;
    /**
     * Writes a 16-bit two's complement signed integer.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeInt16(fieldName: string, value: number): void;
    /**
     * Writes a 32-bit two's complement signed integer.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeInt32(fieldName: string, value: number): void;
    /**
     * Writes a 64-bit two's complement signed integer (a Long object).
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeInt64(fieldName: string, value: Long): void;
    /**
     * Writes a 32-bit IEEE 754 floating point number.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeFloat32(fieldName: string, value: number): void;
    /**
     * Writes a 64-bit IEEE 754 floating point number.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeFloat64(fieldName: string, value: number): void;
    /**
     * Writes an UTF-8 encoded string.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeString(fieldName: string, value: string | null): void;
    /**
     * Writes a {@link BigDecimal}
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeDecimal(fieldName: string, value: BigDecimal | null): void;
    /**
     * Writes a {@link LocalTime}.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeTime(fieldName: string, value: LocalTime | null): void;
    /**
     * Writes a {@link LocalDate}.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeDate(fieldName: string, value: LocalDate | null): void;
    /**
     * Writes a {@link LocalDateTime}.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeTimestamp(fieldName: string, value: LocalDateTime | null): void;
    /**
     * Reads a {@link OffsetDateTime}.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeTimestampWithTimezone(fieldName: string, value: OffsetDateTime | null): void;
    /**
     * Writes a nested compact object.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeCompact<T>(fieldName: string, value: T | null): void;
    /**
     * Writes an array of booleans.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfBoolean(fieldName: string, value: boolean[] | null): void;
    /**
     * Writes an array of 8-bit two's complement signed integers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfInt8(fieldName: string, value: Buffer | null): void;
    /**
     * Writes an array of 16-bit two's complement signed integers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfInt16(fieldName: string, value: number[] | null): void;
    /**
     * Writes an array of 32-bit two's complement signed integers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfInt32(fieldName: string, value: number[] | null): void;
    /**
     * Writes an array of 64-bit two's complement signed integers (Long objects).
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfInt64(fieldName: string, value: Long[] | null): void;
    /**
     * Writes an array of 32-bit IEEE 754 floating point numbers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfFloat32(fieldName: string, value: number[] | null): void;
    /**
     * Writes an array of 64-bit IEEE 754 floating point numbers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfFloat64(fieldName: string, value: number[] | null): void;
    /**
     * Writes an array of UTF-8 encoded strings.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfString(fieldName: string, value: (string | null)[] | null): void;
    /**
     * Writes an array of {@link BigDecimal}.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfDecimal(fieldName: string, value: (BigDecimal | null)[] | null): void;
    /**
     * Writes an array of {@link LocalTime}.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfTime(fieldName: string, value: (LocalTime | null)[] | null): void;
    /**
     * Writes an array of {@link LocalDate}.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfDate(fieldName: string, value: (LocalDate | null)[] | null): void;
    /**
     * Writes an array of {@link LocalDateTime}.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfTimestamp(fieldName: string, value: (LocalDateTime | null)[] | null): void;
    /**
     * Writes an array of {@link OffsetDateTime}.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfTimestampWithTimezone(fieldName: string, value: (OffsetDateTime | null)[] | null): void;
    /**
     * Writes an array of nested compact objects.
     *
     * For compact objects, if an array contains different item types or undefined
     * a {@link HazelcastSerializationError} will be thrown.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfCompact<T>(fieldName: string, value: (T | null)[] | null): void;
    /**
     * Writes a nullable boolean.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeNullableBoolean(fieldName: string, value: boolean | null): void;
    /**
     * Writes a nullable 8-bit two's complement signed integer.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeNullableInt8(fieldName: string, value: number | null): void;
    /**
     * Writes a nullable 16-bit two's complement signed integer.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeNullableInt16(fieldName: string, value: number | null): void;
    /**
     * Writes a nullable 32-bit two's complement signed integer.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeNullableInt32(fieldName: string, value: number | null): void;
    /**
     * Writes a nullable 64-bit two's complement signed integer (a Long object).
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeNullableInt64(fieldName: string, value: Long | null): void;
    /**
     * Writes a nullable 32-bit IEEE 754 floating point number.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeNullableFloat32(fieldName: string, value: number | null): void;
    /**
     * Writes a nullable 64-bit IEEE 754 floating point number.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeNullableFloat64(fieldName: string, value: number | null): void;
    /**
     * Writes a nullable array of nullable booleans.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfNullableBoolean(fieldName: string, value: (boolean | null)[] | null): void;
    /**
     * Writes a nullable array of nullable 8-bit two's complement signed integers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfNullableInt8(fieldName: string, value: (number | null)[] | null): void;
    /**
     * Writes a nullable array of nullable 16-bit two's complement signed integers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfNullableInt16(fieldName: string, value: (number | null)[] | null): void;
    /**
     * Writes a nullable array of nullable 32-bit two's complement signed integers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfNullableInt32(fieldName: string, value: (number | null)[] | null): void;
    /**
     * Writes a nullable array of nullable 64-bit two's complement signed integers (Long objects).
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfNullableInt64(fieldName: string, value: (Long | null)[] | null): void;
    /**
     * Writes a nullable array of nullable 32-bit IEEE 754 floating point numbers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfNullableFloat32(fieldName: string, value: (number | null)[] | null): void;
    /**
     * Writes a nullable array of nullable 64-bit IEEE 754 floating point numbers.
     *
     * @param fieldName name of the field.
     * @param value     to be written.
     */
    writeArrayOfNullableFloat64(fieldName: string, value: (number | null)[] | null): void;
}
