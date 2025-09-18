/// <reference types="node" />
import * as Long from 'long';
import { BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime } from '../../core';
import { FieldKind } from '../generic_record';
/**
 * Provides means of reading compact serialized fields from the binary data.
 *
 * Read operations might throw {@link HazelcastSerializationError}
 * when a field with the given name is not found or there is a type mismatch. On such
 * occasions, one might handle this case via the {@link getFieldKind} method. Handling this situation
 * might be especially useful if the class might evolve in future, either by adding or
 * removing fields.
 *
 */
export interface CompactReader {
    /**
     * Returns field type for the given field name. Returns {@link FieldKind.NOT_AVAILABLE} if such field does not exist.
     *
     * @param fieldName the name of the field
     */
    getFieldKind(fieldName: string): FieldKind;
    /**
     * Reads a boolean.
     *
     * This method can also read a nullable boolean, as long as it is not
     * `null`. If a `null` value is read with this method,
     * {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readBoolean(fieldName: string): boolean;
    /**
     * Reads an 8-bit two's complement signed integer.
     *
     * This method can also read a nullable int8, as long as it is not
     * `null`. If a `null` value is read with this method,
     * {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readInt8(fieldName: string): number;
    /**
     * Reads a 16-bit two's complement signed integer.
     *
     * This method can also read a nullable int16, as long as it is not
     * `null`. If a `null` value is read with this method,
     * {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readInt16(fieldName: string): number;
    /**
     * Reads a 32-bit two's complement signed integer.
     *
     * This method can also read a nullable int32, as long as it is not
     * `null`. If a `null` value is read with this method,
     * {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readInt32(fieldName: string): number;
    /**
     * Reads a 64-bit two's complement signed integer.
     *
     * This method can also read a nullable int64, as long as it is not
     * `null`. If a `null` value is read with this method,
     * {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readInt64(fieldName: string): Long;
    /**
     * Reads a 32-bit IEEE 754 floating point number.
     *
     * This method can also read a nullable float32, as long as it is not
     * `null`. If a `null` value is read with this method,
     * {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readFloat32(fieldName: string): number;
    /**
     * Reads a 64-bit IEEE 754 floating point number.
     *
     * This method can also read a nullable float64, as long as it is not
     * `null`. If a `null` value is read with this method,
     * {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readFloat64(fieldName: string): number;
    /**
     * Reads a UTF-8 encoded string.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readString(fieldName: string): string | null;
    /**
     * Reads an arbitrary precision and scale floating point number.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readDecimal(fieldName: string): BigDecimal | null;
    /**
     * Reads a {@link LocalTime} consisting of hour, minute, second, and nano seconds.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readTime(fieldName: string): LocalTime | null;
    /**
     * Reads a {@link LocalDate} consisting of year, month, and day.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readDate(fieldName: string): LocalDate | null;
    /**
     * Reads a {@link LocalDateTime} consisting of date and time.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readTimestamp(fieldName: string): LocalDateTime | null;
    /**
     * Reads a {@link OffsetDateTime} consisting of date, time and timezone offset.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readTimestampWithTimezone(fieldName: string): OffsetDateTime | null;
    /**
     * Reads a compact object.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readCompact<T>(fieldName: string): T | null;
    /**
     * Reads an array of booleans.
     *
     * This method can also read an array of nullable booleans, as long as it
     * does not contain `null` values. If a `null` array item is
     * read with this method, {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfBoolean(fieldName: string): boolean[] | null;
    /**
     * Reads an array of 8-bit two's complement signed integers.
     *
     * This method can also read an array of nullable int8s, as long as it
     * does not contain `null` values. If a `null` array item is
     * read with this method, {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfInt8(fieldName: string): Buffer | null;
    /**
     * Reads an array of 16-bit two's complement signed integers.
     *
     * This method can also read an array of nullable int16s, as long as it
     * does not contain `null` values. If a `null` array item is
     * read with this method, {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfInt16(fieldName: string): number[] | null;
    /**
     * Reads an array of 32-bit two's complement signed integers.
     *
     * This method can also read an array of nullable int32s, as long as it
     * does not contain `null` values. If a `null` array item is
     * read with this method, {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfInt32(fieldName: string): number[] | null;
    /**
     * Reads an array of 64-bit two's complement signed integers.
     *
     * This method can also read an array of nullable int64s, as long as it
     * does not contain `null` values. If a `null` array item is
     * read with this method, {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfInt64(fieldName: string): Long[] | null;
    /**
     * Reads an array of 32-bit IEEE 754 floating point numbers.
     *
     * This method can also read an array of nullable float32s, as long as it
     * does not contain `null` values. If a `null` array item is
     * read with this method, {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfFloat32(fieldName: string): number[] | null;
    /**
     * Reads an array of 64-bit IEEE 754 floating point numbers.
     *
     * This method can also read an array of nullable float64s, as long as it
     * does not contain `null` values. If a `null` array item is
     * read with this method, {@link HazelcastSerializationError} is thrown.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfFloat64(fieldName: string): number[] | null;
    /**
     * Reads an array of UTF-8 encoded strings.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfString(fieldName: string): (string | null)[] | null;
    /**
     * Reads an array of {@link BigDecimal} objects.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfDecimal(fieldName: string): (BigDecimal | null)[] | null;
    /**
     * Reads an array of {@link LocalTime} objects consisting of hour, minute, second,
     * and nanoseconds.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfTime(fieldName: string): (LocalTime | null)[] | null;
    /**
     * Reads an array of {@link LocalDate} objects consisting of year, month, and day.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfDate(fieldName: string): (LocalDate | null)[] | null;
    /**
     * Reads an array of {@link LocalDateTime} objects consisting of date and time.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfTimestamp(fieldName: string): (LocalDateTime | null)[] | null;
    /**
     * Reads an array of {@link OffsetDateTime} objects consisting of date, time and timezone offset.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfTimestampWithTimezone(fieldName: string): (OffsetDateTime | null)[] | null;
    /**
     * Reads an array of compact objects.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfCompact<T>(fieldName: string): (T | null)[] | null;
    /**
     * Reads a nullable boolean.
     *
     * This method can also read a non-nullable boolean.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readNullableBoolean(fieldName: string): boolean | null;
    /**
     * Reads a nullable 8-bit two's complement signed integer.
     *
     * This method can also read a non-nullable int8.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readNullableInt8(fieldName: string): number | null;
    /**
     * Reads a nullable 16-bit two's complement signed integer.
     *
     * This method can also read a non-nullable int16.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readNullableInt16(fieldName: string): number | null;
    /**
     * Reads a nullable 32-bit two's complement signed integer.
     *
     * This method can also read a non-nullable int32.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readNullableInt32(fieldName: string): number | null;
    /**
     * Reads a nullable 64-bit two's complement signed integer.
     *
     * This method can also read a non-nullable int64.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readNullableInt64(fieldName: string): Long | null;
    /**
     * Reads a nullable 32-bit IEEE 754 floating point number.
     *
     * This method can also read a non-nullable float32.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readNullableFloat32(fieldName: string): number | null;
    /**
     * Reads a nullable 64-bit IEEE 754 floating point number.
     *
     * This method can also read a non-nullable float64.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readNullableFloat64(fieldName: string): number | null;
    /**
     * Reads a nullable array of nullable booleans.
     *
     * This method can also read array of non-nullable booleans.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfNullableBoolean(fieldName: string): (boolean | null)[] | null;
    /**
     * Reads a nullable array of nullable 8-bit two's complement signed integers.
     *
     * This method can also read array of non-nullable int8s.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfNullableInt8(fieldName: string): (number | null)[] | null;
    /**
     * Reads a nullable array of nullable 16-bit two's complement signed integers.
     *
     * This method can also read array of non-nullable int16s.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfNullableInt16(fieldName: string): (number | null)[] | null;
    /**
     * Reads a nullable array of nullable 32-bit two's complement signed integers.
     *
     * This method can also read array of non-nullable int32s.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfNullableInt32(fieldName: string): (number | null)[] | null;
    /**
     * Reads a nullable array of nullable 64-bit two's complement signed integers.
     *
     * This method can also read array of non-nullable int64s.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfNullableInt64(fieldName: string): (Long | null)[] | null;
    /**
     * Reads a nullable array of nullable 32-bit IEEE 754 floating point numbers.
     *
     * This method can also read array of non-nullable float32s.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfNullableFloat32(fieldName: string): (number | null)[] | null;
    /**
     * Reads a nullable array of nullable 64-bit IEEE 754 floating point numbers.
     *
     * This method can also read array of non-nullable float64s.
     *
     * @param fieldName name of the field.
     * @throws {@link HazelcastSerializationError} if the field does not exist in the
     * schema, or the type of the field does not match with the one defined in the schema.
     * @return the value of the field.
     */
    readArrayOfNullableFloat64(fieldName: string): (number | null)[] | null;
}
