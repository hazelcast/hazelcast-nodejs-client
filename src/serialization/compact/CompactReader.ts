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

export interface CompactReader {
    readBoolean(fieldName: string, defaultValue?: boolean): boolean;
    readByte(fieldName: string, defaultValue?: number): number;
    readShort(fieldName: string, defaultValue?: number): number;
    readInt(fieldName: string, defaultValue?: number): number;
    readLong(fieldName: string, defaultValue?: Long): Long;
    readFloat(fieldName: string, defaultValue?: number): number;
    readDouble(fieldName: string, defaultValue?: number): number;
    readString(fieldName: string, defaultValue?: string | null): string | null;
    readDecimal(fieldName: string, defaultValue?: BigDecimal | null): BigDecimal | null;
    readTime(fieldName: string, defaultValue?: LocalTime | null): LocalTime | null;
    readDate(fieldName: string, defaultValue?: LocalDate | null): LocalDate | null;
    readTimestamp(fieldName: string, defaultValue?: LocalDateTime | null): LocalDateTime | null;
    readTimestampWithTimezone(fieldName: string, defaultValue?: OffsetDateTime | null): OffsetDateTime | null;
    readCompact<T>(fieldName: string, defaultValue?: T | null): T | null;
    readArrayOfBooleans(fieldName: string, defaultValue?: boolean[] | null): boolean[] | null;
    readArrayOfBytes(fieldName: string, defaultValue?: Buffer | null): Buffer | null;
    readArrayOfShorts(fieldName: string, defaultValue?: number[] | null): number[] | null;
    readArrayOfInts(fieldName: string, defaultValue?: number[] | null): number[] | null;
    readArrayOfLongs(fieldName: string, defaultValue?: Long[] | null): Long[] | null;
    readArrayOfFloats(fieldName: string, defaultValue?: number[] | null): number[] | null;
    readArrayOfDoubles(fieldName: string, defaultValue?: number[] | null): number[] | null;
    readArrayOfStrings(fieldName: string, defaultValue?: string[] | null): string[] | null;
    readArrayOfDecimals(fieldName: string, defaultValue?: BigDecimal[] | null): BigDecimal[] | null;
    readArrayOfTimes(fieldName: string, defaultValue?: LocalTime[] | null): LocalTime[] | null;
    readArrayOfDates(fieldName: string, defaultValue?: LocalDate[] | null): LocalDate[] | null;
    readArrayOfTimestamps(fieldName: string, defaultValue?: LocalDateTime[] | null): LocalDateTime[] | null;
    readArrayOfTimestampWithTimezones(fieldName: string, defaultValue?: OffsetDateTime[] | null): OffsetDateTime[] | null;
    readArrayOfCompacts<T>(fieldName: string, componentType: new() => T, defaultValue?: T[] | null): T[] | null;
    readNullableBoolean(fieldName : string, defaultValue?: boolean | null) : boolean | null;
    readNullableByte(fieldName : string, defaultValue?: number | null) : number | null;
    readNullableShort(fieldName : number, defaultValue?: number | null) : number | null ;
    readNullableInt(fieldName : string, defaultValue?: number | null) : number | null;
    readNullableLong(fieldName : string, defaultValue?: Long | null) : Long | null;
    readNullableFloat(fieldName : string, defaultValue?: number | null) : number | null;
    readNullableDouble(fieldName : string, defaultValue?: number | null) : number | null;
    readArrayOfNullableBooleans(fieldName : string, defaultValue?: (boolean | null)[] | null) : (boolean | null)[] | null;
    readArrayOfNullableBytes(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
    readArrayOfNullableShorts(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
    readArrayOfNullableInts(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
    readArrayOfNullableLongs(fieldName : string, defaultValue?: (Long | null)[] | null) : (Long | null)[] | null;
    readArrayOfNullableFloats(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
    readArrayOfNullableDoubles(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
}
