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
    getInt8(fieldName: string): number;
    getChar(fieldName: string): string;
    getFloat64(fieldName: string): number;
    getFloat32(fieldName: string): number;
    getInt32(fieldName: string): number;
    getInt64(fieldName: string): Long;
    getInt16(fieldName: string): number;
    getString(fieldName: string): string;
    getDecimal(fieldName: string): BigDecimal;
    getTime(fieldName: string): LocalTime;
    getDate(fieldName: string): LocalDate;
    getTimestamp(fieldName: string): LocalDateTime;
    getTimestampWithTimezone(fieldName: string): OffsetDateTime;
    getGenericRecord(fieldName: string): GenericRecord;
    getArrayOfBoolean(fieldName: string): boolean[];
    getArrayOfInt8(fieldName: string): Buffer;
    getArrayOfChar(fieldName: string): string[];
    getArrayOfFloat64(fieldName: string): number[];
    getArrayOfFloat32(fieldName: string): number[];
    getArrayOfInt32(fieldName: string): number[];
    getArrayOfInt64(fieldName: string): Long[];
    getArrayOfInt16(fieldName: string): number[];
    getArrayOfString(fieldName: string): string[];
    getArrayOfDecimal(fieldName: string): BigDecimal[];
    getArrayOfTime(fieldName: string): LocalTime[];
    getArrayOfDate(fieldName: string): LocalDate[];
    getArrayOfTimestamp(fieldName: string): LocalDateTime[];
    getArrayOfTimestampWithTimezone(fieldName: string): OffsetDateTime[];
    getArrayOfGenericRecord(fieldName: string): GenericRecord[];
    getNullableBoolean(fieldName: string): boolean | null;
    getNullableInt8(fieldName: string): number | null;
    getNullableFloat64(fieldName: string): number | null;
    getNullableFloat32(fieldName: string): number | null;
    getNullableInt32(fieldName: string): number | null;
    getNullableInt64(fieldName: string): Long | null;
    getNullableInt16(fieldName: string): number | null;
    getArrayOfNullableBoolean(fieldName: string): (boolean | null)[];
    getArrayOfNullableInt8(fieldName: string): (number | null)[];
    getArrayOfNullableFloat64(fieldName: string): (number | null)[];
    getArrayOfNullableFloat32(fieldName: string): (number | null)[];
    getArrayOfNullableInt32(fieldName: string): (number | null)[];
    getArrayOfNullableInt64(fieldName: string): (Long | null)[];
    getArrayOfNullableInt16(fieldName: string): (number | null)[];
}
