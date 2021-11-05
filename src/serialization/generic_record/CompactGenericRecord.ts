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

import {Schema} from '../compact/Schema';
import {GenericRecord} from './GenericRecord';
import {GenericRecordBuilder} from './GenericRecordBuilder';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import * as Long from 'long';
import {FieldKind} from './FieldKind';
import {FieldOperations} from './FieldOperations';

/**
 *
 * @internal
 */
export abstract class CompactGenericRecord implements GenericRecord {
    protected abstract getClassIdentifier() : any;
    abstract getSchema(): Schema;
    readAny<T>(fieldName: string): T {
        const fieldKind = this.getFieldKind(fieldName);
        return FieldOperations.fieldOperations(fieldKind).readGenericRecordOrPrimitive(this, fieldName) as T;
    }

    abstract cloneWithBuilder(): GenericRecordBuilder;

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

    abstract getArrayOfShorts(fieldName: string): number[];

    abstract getArrayOfStrings(fieldName: string): string[];

    abstract getArrayOfTimes(fieldName: string): LocalTime[];

    abstract getArrayOfTimestampWithTimezones(fieldName: string): OffsetDateTime[];

    abstract getArrayOfTimestamps(fieldName: string): LocalDateTime[];

    abstract getBoolean(fieldName: string): boolean;

    abstract getByte(fieldName: string): number;

    abstract getChar(fieldName: string): string;

    abstract getDate(fieldName: string): LocalDate;

    abstract getDecimal(fieldName: string): BigDecimal;

    abstract getDouble(fieldName: string): number;

    abstract getFieldKind(fieldName: string): FieldKind;

    abstract getFieldNames(): Set<string>;

    abstract getFloat(fieldName: string): number;

    abstract getGenericRecord(fieldName: string): GenericRecord;

    abstract getInt(fieldName: string): number;

    abstract getLong(fieldName: string): Long;

    abstract getNullableBoolean(fieldName: string): boolean | null;

    abstract getNullableByte(fieldName: string): number | null;

    abstract getNullableDouble(fieldName: string): number | null;

    abstract getNullableFloat(fieldName: string): number | null;

    abstract getNullableInt(fieldName: string): number | null;

    abstract getNullableLong(fieldName: string): Long | null;

    abstract getNullableShort(fieldName: string): number | null;

    abstract getShort(fieldName: string): number;

    abstract getString(fieldName: string): string;

    abstract getTime(fieldName: string): LocalTime;

    abstract getTimestamp(fieldName: string): LocalDateTime;

    abstract getTimestampWithTimezone(fieldName: string): OffsetDateTime;

    abstract hasField(fieldName: string): boolean;

    abstract newBuilder(): GenericRecordBuilder;
}
