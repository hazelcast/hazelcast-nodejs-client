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

import {GenericRecord, IS_GENERIC_RECORD_SYMBOL} from './GenericRecord';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import {FieldKind} from './FieldKind';
import {Field} from './Field';
import {Schema} from '../compact/Schema';

/**
 * @internal
 */
export interface CompactGenericRecord extends GenericRecord {
    getSchema(): Schema;
}

/**
 * @internal
 */
export class CompactGenericRecordImpl implements CompactGenericRecord {

    private readonly [IS_GENERIC_RECORD_SYMBOL] = true;

    constructor(
        className: string,
        fields: {[name: string]: Field<any>},
        values: {[name: string]: any}
    ) {
    }

    getSchema(): Schema {
        throw new Error('Method not implemented.');
    }

    getArrayOfBooleans(fieldName: string): boolean[] {
        return [];
    }

    getArrayOfBytes(fieldName: string): Buffer {
        return undefined;
    }

    getArrayOfChars(fieldName: string): string[] {
        return [];
    }

    getArrayOfDates(fieldName: string): LocalDate[] {
        return [];
    }

    getArrayOfDecimals(fieldName: string): BigDecimal[] {
        return [];
    }

    getArrayOfDoubles(fieldName: string): number[] {
        return [];
    }

    getArrayOfFloats(fieldName: string): number[] {
        return [];
    }

    getArrayOfGenericRecords(fieldName: string): GenericRecord[] {
        return [];
    }

    getArrayOfInts(fieldName: string): number[] {
        return [];
    }

    getArrayOfLongs(fieldName: string): Long[] {
        return [];
    }

    getArrayOfNullableBooleans(fieldName: string): (boolean | null)[] {
        return [];
    }

    getArrayOfNullableBytes(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfNullableDoubles(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfNullableFloats(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfNullableInts(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfNullableLongs(fieldName: string): (Long | null)[] {
        return [];
    }

    getArrayOfNullableShorts(fieldName: string): (number | null)[] {
        return [];
    }

    getArrayOfShorts(fieldName: string): number[] {
        return [];
    }

    getArrayOfStrings(fieldName: string): string[] {
        return [];
    }

    getArrayOfTimes(fieldName: string): LocalTime[] {
        return [];
    }

    getArrayOfTimestampWithTimezones(fieldName: string): OffsetDateTime[] {
        return [];
    }

    getArrayOfTimestamps(fieldName: string): LocalDateTime[] {
        return [];
    }

    getBoolean(fieldName: string): boolean {
        return false;
    }

    getByte(fieldName: string): number {
        return 0;
    }

    getChar(fieldName: string): string {
        return '';
    }

    getDate(fieldName: string): LocalDate {
        return undefined;
    }

    getDecimal(fieldName: string): BigDecimal {
        return undefined;
    }

    getDouble(fieldName: string): number {
        return 0;
    }

    getFieldKind(fieldName: string): FieldKind {
        return undefined;
    }

    getFieldNames(): Set<string> {
        return undefined;
    }

    getFloat(fieldName: string): number {
        return 0;
    }

    getGenericRecord(fieldName: string): GenericRecord {
        return undefined;
    }

    getInt(fieldName: string): number {
        return 0;
    }

    getLong(fieldName: string): Long {
        return undefined;
    }

    getNullableBoolean(fieldName: string): boolean | null {
        return undefined;
    }

    getNullableByte(fieldName: string): number | null {
        return undefined;
    }

    getNullableDouble(fieldName: string): number | null {
        return undefined;
    }

    getNullableFloat(fieldName: string): number | null {
        return undefined;
    }

    getNullableInt(fieldName: string): number | null {
        return undefined;
    }

    getNullableLong(fieldName: string): Long | null {
        return undefined;
    }

    getNullableShort(fieldName: string): number | null {
        return undefined;
    }

    getShort(fieldName: string): number {
        return 0;
    }

    getString(fieldName: string): string {
        return '';
    }

    getTime(fieldName: string): LocalTime {
        return undefined;
    }

    getTimestamp(fieldName: string): LocalDateTime {
        return undefined;
    }

    getTimestampWithTimezone(fieldName: string): OffsetDateTime {
        return undefined;
    }

    hasField(fieldName: string): boolean {
        return false;
    }
}


