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

/** @ignore *//** */

import {GenericRecord} from './GenericRecord';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import * as Long from 'long';
import {FieldKind} from './FieldKind';
import {Schema} from '../compact/Schema';

/**
 * @internal
 */
export abstract class AbstractCompactGenericRecord implements GenericRecord {
    abstract getSchema(): Schema;
    abstract getArrayOfBooleans(fieldName: string): boolean[];
    abstract getArrayOfBytes(fieldName: string): Buffer;
    abstract getArrayOfChars(fieldName: string): string[];
    abstract getArrayOfDates(fieldName: string): LocalDate[];
    abstract getArrayOfDecimals(fieldName: string): BigDecimal[];
    abstract getArrayOfDoubles(fieldName: string): number[];
    abstract getArrayOfFloats(fieldName: string): number[];
    abstract getArrayOfGenericRecords(fieldName: string): GenericRecord[];
    abstract getArrayOfInts(fieldName: string): number[];
    abstract getArrayOfLongs(fieldName: string): Long[];
    abstract getArrayOfNullableBooleans(fieldName: string): (boolean | null)[];
    abstract getArrayOfNullableBytes(fieldName: string): (number | null)[];
    abstract getArrayOfNullableDoubles(fieldName: string): (number | null)[];
    abstract getArrayOfNullableFloats(fieldName: string): (number | null)[];
    abstract getArrayOfNullableInts(fieldName: string): (number | null)[];
    abstract getArrayOfNullableLongs(fieldName: string): (Long | null)[];
    abstract getArrayOfNullableShorts(fieldName: string): (number | null)[];
    abstract getArrayOfObjects<T>(fieldName: string, componentType: { new(): T }): T[];
    abstract getArrayOfShorts(fieldName: string): number[];
    abstract getArrayOfStrings(fieldName: string): string[];
    abstract getArrayOfTimes(fieldName: string): LocalTime[];
    abstract getArrayOfTimestampWithTimezones(fieldName: string): OffsetDateTime[];
    abstract getArrayOfTimestamps(fieldName: string): LocalDateTime[];
    abstract getBoolean(fieldName: string): boolean;
    abstract getBooleanFromArray(fieldName: string, index: number): boolean | null;
    abstract getByte(fieldName: string): number;
    abstract getByteFromArray(fieldName: string, index: number): number | null;
    abstract getChar(fieldName: string): string;
    abstract getCharFromArray(fieldName: string, index: number): string | null;
    abstract getDate(fieldName: string): LocalDate;
    abstract getDateFromArray(fieldName: string, index: number): LocalDate | null;
    abstract getDecimal(fieldName: string): BigDecimal;
    abstract getDecimalFromArray(fieldName: string, index: number): BigDecimal | null;
    abstract getDouble(fieldName: string): number;
    abstract getDoubleFromArray(fieldName: string, index: number): number | null;
    abstract getFieldKind(fieldName: string): FieldKind;
    abstract getFieldNames(): Set<string>;
    abstract getFloat(fieldName: string): number;
    abstract getFloatFromArray(fieldName: string, index: number): number | null;
    abstract getGenericRecord(fieldName: string): GenericRecord;
    abstract getGenericRecordFromArray(fieldName: string, index: number): GenericRecord | null;
    abstract getInt(fieldName: string): number;
    abstract getIntFromArray(fieldName: string, index: number): number | null;
    abstract getLong(fieldName: string): Long;
    abstract getLongFromArray(fieldName: string, index: number): Long | null;
    abstract getNullableBoolean(fieldName: string): boolean | null;
    abstract getNullableBooleanFromArray(fieldName: string, index: number): boolean | null;
    abstract getNullableByte(fieldName: string): number | null;
    abstract getNullableByteFromArray(fieldName: string, index: number): number | null;
    abstract getNullableDouble(fieldName: string): number | null;
    abstract getNullableDoubleFromArray(fieldName: string, index: number): number | null;
    abstract getNullableFloat(fieldName: string): number | null;
    abstract getNullableFloatFromArray(fieldName: string, index: number): number | null;
    abstract getNullableInt(fieldName: string): number | null;
    abstract getNullableIntFromArray(fieldName: string, index: number): number | null;
    abstract getNullableLong(fieldName: string): Long | null;
    abstract getNullableLongFromArray(fieldName: string, index: number): Long | null;
    abstract getNullableShort(fieldName: string): number | null;
    abstract getNullableShortFromArray(fieldName: string, index: number): number | null;
    abstract getObject<T>(fieldName: string): T;
    abstract getObjectFromArray<T>(fieldName: string, index: number): T | null;
    abstract getShort(fieldName: string): number;
    abstract getShortFromArray(fieldName: string, index: number): number | null;
    abstract getString(fieldName: string): string;
    abstract getStringFromArray(fieldName: string, index: number): string | null;
    abstract getTime(fieldName: string): LocalTime;
    abstract getTimeFromArray(fieldName: string, index: number): LocalTime | null;
    abstract getTimestamp(fieldName: string): LocalDateTime;
    abstract getTimestampFromArray(fieldName: string, index: number): LocalDateTime | null;
    abstract getTimestampWithTimezone(fieldName: string): OffsetDateTime;
    abstract getTimestampWithTimezoneFromArray(fieldName: string, index: number): OffsetDateTime | null;
    abstract hasField(fieldName: string): boolean;

}
