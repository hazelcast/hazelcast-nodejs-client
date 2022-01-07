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
import {FieldKind} from './FieldKind';
import * as Long from 'long';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import {Buffer} from 'buffer';

export const IS_GENERIC_RECORD_SYMBOL = Symbol('IS_GENERIC_RECORD');

export interface GenericRecord {
    getFieldNames(): Set<string>;
    // throws TypeError if the field name does not exist in the class definition
    getFieldKind(fieldName: string): FieldKind;
    hasField(fieldName: string): boolean;
    getBoolean(fieldName: string): boolean;
    getByte(fieldName: string): number;
    getChar(fieldName: string): string;
    getDouble(fieldName: string): number;
    getFloat(fieldName: string): number;
    getInt(fieldName: string): number;
    getLong(fieldName: string): Long;
    getShort(fieldName: string): number;
    getString(fieldName: string): string;
    getDecimal(fieldName: string): BigDecimal;
    getTime(fieldName: string): LocalTime;
    getDate(fieldName: string): LocalDate;
    getTimestamp(fieldName: string): LocalDateTime;
    getTimestampWithTimezone(fieldName: string): OffsetDateTime;
    getGenericRecord(fieldName: string): GenericRecord;
    getArrayOfBooleans(fieldName: string): boolean[];
    getArrayOfBytes(fieldName: string): Buffer;
    getArrayOfChars(fieldName: string): string[];
    getArrayOfDoubles(fieldName: string): number[];
    getArrayOfFloats(fieldName: string): number[];
    getArrayOfInts(fieldName: string): number[];
    getArrayOfLongs(fieldName: string): Long[];
    getArrayOfShorts(fieldName: string): number[];
    getArrayOfStrings(fieldName: string): string[];
    getArrayOfDecimals(fieldName: string): BigDecimal[];
    getArrayOfTimes(fieldName: string): LocalTime[];
    getArrayOfDates(fieldName: string): LocalDate[];
    getArrayOfTimestamps(fieldName: string): LocalDateTime[];
    getArrayOfTimestampWithTimezones(fieldName: string): OffsetDateTime[];
    getArrayOfGenericRecords(fieldName: string): GenericRecord[];
    getNullableBoolean(fieldName: string): boolean | null;
    getNullableByte(fieldName: string): number | null;
    getNullableDouble(fieldName: string): number | null;
    getNullableFloat(fieldName: string): number | null;
    getNullableInt(fieldName: string): number | null;
    getNullableLong(fieldName: string): Long | null;
    getNullableShort(fieldName: string): number | null;
    getArrayOfNullableBooleans(fieldName: string): (boolean | null)[];
    getArrayOfNullableBytes(fieldName: string): (number | null)[];
    getArrayOfNullableDoubles(fieldName: string): (number | null)[];
    getArrayOfNullableFloats(fieldName: string): (number | null)[];
    getArrayOfNullableInts(fieldName: string): (number | null)[];
    getArrayOfNullableLongs(fieldName: string): (Long | null)[];
    getArrayOfNullableShorts(fieldName: string): (number | null)[];
}
