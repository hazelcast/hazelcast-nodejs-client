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
import {FieldKind} from './FieldKind';
import {AbstractCompactGenericRecord} from './AbstractCompactGenericRecord';
import { Schema } from '../compact/Schema';
import {Field} from './Field';


/**
 * @internal
 */
export class CompactGenericRecord extends AbstractCompactGenericRecord {
    constructor(
        fields: {[name: string]: Field<any>},
        values: {[name: string]: any}
    ) {
        super();
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

    getArrayOfObjects<T>(fieldName: string, componentType: { new(): T }): T[] {
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

    getBooleanFromArray(fieldName: string, index: number): boolean | null {
        return undefined;
    }

    getByte(fieldName: string): number {
        return 0;
    }

    getByteFromArray(fieldName: string, index: number): number | null {
        return undefined;
    }

    getChar(fieldName: string): string {
        return '';
    }

    getCharFromArray(fieldName: string, index: number): string | null {
        return undefined;
    }

    getDate(fieldName: string): LocalDate {
        return undefined;
    }

    getDateFromArray(fieldName: string, index: number): LocalDate | null {
        return undefined;
    }

    getDecimal(fieldName: string): BigDecimal {
        return undefined;
    }

    getDecimalFromArray(fieldName: string, index: number): BigDecimal | null {
        return undefined;
    }

    getDouble(fieldName: string): number {
        return 0;
    }

    getDoubleFromArray(fieldName: string, index: number): number | null {
        return undefined;
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

    getFloatFromArray(fieldName: string, index: number): number | null {
        return undefined;
    }

    getGenericRecord(fieldName: string): GenericRecord {
        return undefined;
    }

    getGenericRecordFromArray(fieldName: string, index: number): GenericRecord | null {
        return undefined;
    }

    getInt(fieldName: string): number {
        return 0;
    }

    getIntFromArray(fieldName: string, index: number): number | null {
        return undefined;
    }

    getLong(fieldName: string): Long {
        return undefined;
    }

    getLongFromArray(fieldName: string, index: number): Long | null {
        return undefined;
    }

    getNullableBoolean(fieldName: string): boolean | null {
        return undefined;
    }

    getNullableBooleanFromArray(fieldName: string, index: number): boolean | null {
        return undefined;
    }

    getNullableByte(fieldName: string): number | null {
        return undefined;
    }

    getNullableByteFromArray(fieldName: string, index: number): number | null {
        return undefined;
    }

    getNullableDouble(fieldName: string): number | null {
        return undefined;
    }

    getNullableDoubleFromArray(fieldName: string, index: number): number | null {
        return undefined;
    }

    getNullableFloat(fieldName: string): number | null {
        return undefined;
    }

    getNullableFloatFromArray(fieldName: string, index: number): number | null {
        return undefined;
    }

    getNullableInt(fieldName: string): number | null {
        return undefined;
    }

    getNullableIntFromArray(fieldName: string, index: number): number | null {
        return undefined;
    }

    getNullableLong(fieldName: string): Long | null {
        return undefined;
    }

    getNullableLongFromArray(fieldName: string, index: number): Long | null {
        return undefined;
    }

    getNullableShort(fieldName: string): number | null {
        return undefined;
    }

    getNullableShortFromArray(fieldName: string, index: number): number | null {
        return undefined;
    }

    getObject<T>(fieldName: string): T {
        return undefined;
    }

    getObjectFromArray<T>(fieldName: string, index: number): T | null {
        return undefined;
    }

    getShort(fieldName: string): number {
        return 0;
    }

    getShortFromArray(fieldName: string, index: number): number | null {
        return undefined;
    }

    getString(fieldName: string): string {
        return '';
    }

    getStringFromArray(fieldName: string, index: number): string | null {
        return undefined;
    }

    getTime(fieldName: string): LocalTime {
        return undefined;
    }

    getTimeFromArray(fieldName: string, index: number): LocalTime | null {
        return undefined;
    }

    getTimestamp(fieldName: string): LocalDateTime {
        return undefined;
    }

    getTimestampFromArray(fieldName: string, index: number): LocalDateTime | null {
        return undefined;
    }

    getTimestampWithTimezone(fieldName: string): OffsetDateTime {
        return undefined;
    }

    getTimestampWithTimezoneFromArray(fieldName: string, index: number): OffsetDateTime | null {
        return undefined;
    }

    hasField(fieldName: string): boolean {
        return false;
    }

}


