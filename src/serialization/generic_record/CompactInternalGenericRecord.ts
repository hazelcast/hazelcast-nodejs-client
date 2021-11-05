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

import {CompactGenericRecord} from './CompactGenericRecord';
import {GenericRecordBuilder} from './GenericRecordBuilder';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime, UnsupportedOperationError} from '../../core';
import {GenericRecord} from './GenericRecord';
import * as Long from 'long';
import {FieldKind} from './FieldKind';
import {Schema} from '../compact/Schema';
import {InternalGenericRecord} from './InternalGenericRecord';
import {CompactStreamSerializer} from '../compact/CompactStreamSerializer';
import {DataInput} from '../Data';

/**
 *
 * @internal
 */
export class CompactInternalGenericRecord extends CompactGenericRecord implements InternalGenericRecord {
    constructor(
        private serializer: CompactStreamSerializer,
        private input: DataInput,
        private schema: Schema,
        private className: string | null,
        private schemaIncludedInBinary: boolean
    ) {
        super();
    }

    getBooleanFromArray(fieldName: string, index: number): boolean {
        throw new Error('Method not implemented.');
    }
    getByteFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    getCharFromArray(fieldName: string, index: number): string {
        throw new UnsupportedOperationError('Compact format does not support reading from an array of chars field.');
    }
    getShortFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    getIntFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    getLongFromArray(fieldName: string, index: number): Long.Long {
        throw new Error('Method not implemented.');
    }
    getFloatFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    getDoubleFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    getStringFromArray(fieldName: string, index: number): string {
        throw new Error('Method not implemented.');
    }
    getGenericRecordFromArray(fieldName: string, index: number): GenericRecord {
        throw new Error('Method not implemented.');
    }
    getObjectFromArray<T>(fieldName: string, index: number): T {
        throw new Error('Method not implemented.');
    }
    getArrayOfObjects<T>(fieldName: string, componentType: new () => T): T[] {
        throw new Error('Method not implemented.');
    }
    getObject<T>(fieldName: string): T {
        throw new Error('Method not implemented.');
    }
    getDecimalFromArray(fieldName: string, index: number): BigDecimal {
        throw new Error('Method not implemented.');
    }
    getTimeFromArray(fieldName: string, index: number): LocalTime {
        throw new Error('Method not implemented.');
    }
    getDateFromArray(fieldName: string, index: number): LocalDate {
        throw new Error('Method not implemented.');
    }
    getTimestampFromArray(fieldName: string, index: number): LocalDateTime {
        throw new Error('Method not implemented.');
    }
    getTimestampWithTimezoneFromArray(fieldName: string, index: number): OffsetDateTime {
        throw new Error('Method not implemented.');
    }
    getNullableBooleanFromArray(fieldName: string, index: number): boolean {
        throw new Error('Method not implemented.');
    }
    getNullableByteFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    getNullableShortFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    getNullableIntFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    getNullableLongFromArray(fieldName: string, index: number): Long.Long {
        throw new Error('Method not implemented.');
    }
    getNullableFloatFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    getNullableDoubleFromArray(fieldName: string, index: number): number {
        throw new Error('Method not implemented.');
    }
    cloneWithBuilder(): GenericRecordBuilder {
        return undefined;
    }

    getArrayOfBooleans(fieldName: string): boolean[] {
        return [];
    }

    getArrayOfBytes(fieldName: string): Buffer {
        return undefined;
    }

    getArrayOfChars(fieldName: string): string[] {
        throw new UnsupportedOperationError('Compact format does not support reading an array of chars field.');
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
        throw new UnsupportedOperationError('Compact format does not support reading a char field.');
    }

    protected getClassIdentifier(): any {
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

    getSchema(): Schema {
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

    newBuilder(): GenericRecordBuilder {
        return undefined;
    }


}
