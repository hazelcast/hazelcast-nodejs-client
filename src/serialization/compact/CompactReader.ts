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
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';

/**
 * Provides means of reading compact serialized fields from the binary data.
 *
 * Read operations might throw {@link HazelcastSerializationError}
 * when a field with the given name is not found or there is a type mismatch. On such
 * occasions, one might provide default values to the read methods to return it in case
 * of the failure scenarios described above. Providing default values might be especially
 * useful, if the class might evolve in future, either by adding or removing fields.
 *
 */
export interface CompactReader {
    /**
     * Reads a boolean or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readBoolean(fieldName: string, defaultValue?: boolean): boolean;

    /**
     * Reads an 8-bit two's complement signed integer or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readInt8(fieldName: string, defaultValue?: number): number;

    /**
     * Reads a 16-bit two's complement signed integer or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readInt16(fieldName: string, defaultValue?: number): number;

    /**
     * Reads a 32-bit two's complement signed integer or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readInt32(fieldName: string, defaultValue?: number): number;

    /**
     * Reads a 64-bit two's complement signed integer (a Long object) or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readInt64(fieldName: string, defaultValue?: Long): Long;

    /**
     * Reads a 32-bit IEEE 754 floating point number or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readFloat32(fieldName: string, defaultValue?: number): number;

    /**
     * Reads a 64-bit IEEE 754 floating point number or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readFloat64(fieldName: string, defaultValue?: number): number;

    /**
     * Reads a UTF-8 encoded string or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readString(fieldName: string, defaultValue?: string | null): string | null;

    /**
     * Reads an arbitrary precision and scale floating point number
     * or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readDecimal(fieldName: string, defaultValue?: BigDecimal | null): BigDecimal | null;

    /**
     * Reads a {@link LocalTime} consisting of hour, minute, second, and nano seconds
     * or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readTime(fieldName: string, defaultValue?: LocalTime | null): LocalTime | null;

    /**
     * Reads a {@link LocalDate} consisting of year, month, and day or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readDate(fieldName: string, defaultValue?: LocalDate | null): LocalDate | null;

    /**
     * Reads a {@link LocalDateTime} consisting of date and time or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readTimestamp(fieldName: string, defaultValue?: LocalDateTime | null): LocalDateTime | null;

    /**
     * Reads a {@link OffsetDateTime} consisting of date, time and timezone offset
     * or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readTimestampWithTimezone(fieldName: string, defaultValue?: OffsetDateTime | null): OffsetDateTime | null;

    /**
     * Reads a compact object
     * or returns the default value
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readCompact<T>(fieldName: string, defaultValue?: T | null): T | null;

    /**
     * Reads an array of booleans or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfBoolean(fieldName: string, defaultValue?: boolean[] | null): boolean[] | null;

    /**
     * Reads an array of 8-bit two's complement signed integers as Buffer or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfInt8(fieldName: string, defaultValue?: Buffer | null): Buffer | null;

    /**
     * Reads an array of 16-bit two's complement signed integers or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfInt16(fieldName: string, defaultValue?: number[] | null): number[] | null;

    /**
     * Reads an array of 32-bit two's complement signed integers or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfInt32(fieldName: string, defaultValue?: number[] | null): number[] | null;

    /**
     * Reads an array of 64-bit two's complement signed integers (Long objects) or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfInt64(fieldName: string, defaultValue?: Long[] | null): Long[] | null;

    /**
     * Reads an array of 32-bit IEEE 754 floating point numbers or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfFloat32(fieldName: string, defaultValue?: number[] | null): number[] | null;

    /**
     * Reads an array of 64-bit IEEE 754 floating point numbers or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfFloat64(fieldName: string, defaultValue?: number[] | null): number[] | null;

    /**
     * Reads an array of UTF-8 encoded strings or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfString(fieldName: string, defaultValue?: string[] | null): string[] | null;

    /**
     * Reads an array of {@link BigDecimal} objects or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfDecimal(fieldName: string, defaultValue?: BigDecimal[] | null): BigDecimal[] | null;

    /**
     * Reads an array of {@link LocalTime} objects consisting of hour, minute, second,
     * and nanoseconds or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfTime(fieldName: string, defaultValue?: LocalTime[] | null): LocalTime[] | null;

    /**
     * Reads an array of {@link LocalDate} objects consisting of year, month, and day or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfDate(fieldName: string, defaultValue?: LocalDate[] | null): LocalDate[] | null;

    /**
     * Reads an array of {@link LocalDateTime} objects consisting of date and time or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfTimestamp(fieldName: string, defaultValue?: LocalDateTime[] | null): LocalDateTime[] | null;

    /**
     * Reads an array of {@link OffsetDateTime} objects consisting of date, time and timezone offset or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfTimestampWithTimezone(fieldName: string, defaultValue?: OffsetDateTime[] | null): OffsetDateTime[] | null;

    /**
     * Reads an array of compact objects or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfCompact<T>(fieldName: string, defaultValue?: T[] | null): T[] | null;

    /**
     * Reads a nullable boolean or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readNullableBoolean(fieldName : string, defaultValue?: boolean | null) : boolean | null;

    /**
     * Reads a nullable 8-bit two's complement signed integer or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readNullableInt8(fieldName : string, defaultValue?: number | null) : number | null;

    /**
     * Reads a nullable 16-bit two's complement signed integer or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readNullableInt16(fieldName : string, defaultValue?: number | null) : number | null;

    /**
     * Reads a nullable 32-bit two's complement signed integer or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readNullableInt32(fieldName : string, defaultValue?: number | null) : number | null;

    /**
     * Reads a nullable 64-bit two's complement signed integer (Long object) or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readNullableInt64(fieldName : string, defaultValue?: Long | null) : Long | null;

    /**
     * Reads a nullable 32-bit IEEE 754 floating point number or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readNullableFloat32(fieldName : string, defaultValue?: number | null) : number | null;

    /**
     * Reads a nullable 64-bit IEEE 754 floating point number or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readNullableFloat64(fieldName : string, defaultValue?: number | null) : number | null;

    /**
     * Reads a nullable array of nullable booleans or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfNullableBoolean(fieldName : string, defaultValue?: (boolean | null)[] | null) : (boolean | null)[] | null;

    /**
     * Reads a nullable array of nullable 8-bit two's complement signed integers or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfNullableInt8(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;

    /**
     * Reads a nullable array of nullable 16-bit two's complement signed integers or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfNullableInt16(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;

    /**
     * Reads a nullable array of nullable 32-bit two's complement signed integers or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfNullableInt32(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;

    /**
     * Reads a nullable array of nullable 64-bit two's complement signed integers (Long objects) or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfNullableInt64(fieldName : string, defaultValue?: (Long | null)[] | null) : (Long | null)[] | null;

    /**
     * Reads a nullable array of nullable 32-bit IEEE 754 floating point numbers or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfNullableFloat32(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;

    /**
     * Reads a nullable array of nullable 64-bit IEEE 754 floating point numbers or returns the default value.
     *
     * @param fieldName    name of the field.
     * @param defaultValue default value to return if the field with the given name
     *                     does not exist in the schema or the type of the field does
     *                     not match with the one defined in the schema.
     * @throws {@link HazelcastSerializationError} if defaultValue is not provided and
     * the field does not exist in the schema, or the type of the field does not match
     * with the one defined in the schema.
     * @return the value or the default value of the field.
     */
    readArrayOfNullableFloat64(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
}
