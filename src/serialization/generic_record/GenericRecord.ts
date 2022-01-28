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


/**
 * All generic records must implement this. This adds {@link IS_GENERIC_RECORD_SYMBOL} to all generic records.
 * @internal
 */
export abstract class AbstractGenericRecord implements GenericRecord {
    [IS_GENERIC_RECORD_SYMBOL] = true;

    abstract clone(fieldsToUpdate?: { [fieldName: string]: any }): GenericRecord;
    abstract getArrayOfBoolean(fieldName: string): boolean[];
    abstract getArrayOfChar(fieldName: string): string[];
    abstract getArrayOfDate(fieldName: string): LocalDate[];
    abstract getArrayOfDecimal(fieldName: string): BigDecimal[];
    abstract getArrayOfFloat32(fieldName: string): number[];
    abstract getArrayOfFloat64(fieldName: string): number[];
    abstract getArrayOfGenericRecord(fieldName: string): GenericRecord[];
    abstract getArrayOfInt16(fieldName: string): number[];
    abstract getArrayOfInt32(fieldName: string): number[];
    abstract getArrayOfInt64(fieldName: string): Long[];
    abstract getArrayOfInt8(fieldName: string): Buffer;
    abstract getArrayOfNullableBoolean(fieldName: string): (boolean | null)[];
    abstract getArrayOfNullableFloat32(fieldName: string): (number | null)[];
    abstract getArrayOfNullableFloat64(fieldName: string): (number | null)[];
    abstract getArrayOfNullableInt16(fieldName: string): (number | null)[];
    abstract getArrayOfNullableInt32(fieldName: string): (number | null)[];
    abstract getArrayOfNullableInt64(fieldName: string): (Long | null)[];
    abstract getArrayOfNullableInt8(fieldName: string): (number | null)[];
    abstract getArrayOfString(fieldName: string): string[];
    abstract getArrayOfTime(fieldName: string): LocalTime[];
    abstract getArrayOfTimestamp(fieldName: string): LocalDateTime[];
    abstract getArrayOfTimestampWithTimezone(fieldName: string): OffsetDateTime[];
    abstract getBoolean(fieldName: string): boolean;
    abstract getChar(fieldName: string): string;
    abstract getDate(fieldName: string): LocalDate;
    abstract getDecimal(fieldName: string): BigDecimal;
    abstract getFieldKind(fieldName: string): FieldKind;
    abstract getFieldNames(): Set<string>;
    abstract getFloat32(fieldName: string): number;
    abstract getFloat64(fieldName: string): number;
    abstract getGenericRecord(fieldName: string): GenericRecord;
    abstract getInt16(fieldName: string): number;
    abstract getInt32(fieldName: string): number;
    abstract getInt64(fieldName: string): Long;
    abstract getInt8(fieldName: string): number;
    abstract getNullableBoolean(fieldName: string): boolean | null;
    abstract getNullableFloat32(fieldName: string): number | null;
    abstract getNullableFloat64(fieldName: string): number | null;
    abstract getNullableInt16(fieldName: string): number | null;
    abstract getNullableInt32(fieldName: string): number | null;
    abstract getNullableInt64(fieldName: string): Long | null;
    abstract getNullableInt8(fieldName: string): number | null;
    abstract getString(fieldName: string): string;
    abstract getTime(fieldName: string): LocalTime;
    abstract getTimestamp(fieldName: string): LocalDateTime;
    abstract getTimestampWithTimezone(fieldName: string): OffsetDateTime;
    abstract hasField(fieldName: string): boolean;
}

export interface GenericRecord {
    /**
     * Clones this generic record and returns a new one.
     * @param fieldsToUpdate If provided, the returned generic records some fields will be updated. Keys of this object
     * are fieldNames and values are field values.
     * @throws TypeError if any value provided is of wrong type or any provided fieldName does not exist in the record.
     */
    clone(fieldsToUpdate?: {[fieldName: string] : any}): GenericRecord;
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
    toString(): string;
}
