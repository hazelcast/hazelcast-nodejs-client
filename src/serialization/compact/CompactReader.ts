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
    readInt8(fieldName: string, defaultValue?: number): number;
    readInt16(fieldName: string, defaultValue?: number): number;
    readInt32(fieldName: string, defaultValue?: number): number;
    readInt64(fieldName: string, defaultValue?: Long): Long;
    readFloat32(fieldName: string, defaultValue?: number): number;
    readFloat64(fieldName: string, defaultValue?: number): number;
    readString(fieldName: string, defaultValue?: string | null): string | null;
    readDecimal(fieldName: string, defaultValue?: BigDecimal | null): BigDecimal | null;
    readTime(fieldName: string, defaultValue?: LocalTime | null): LocalTime | null;
    readDate(fieldName: string, defaultValue?: LocalDate | null): LocalDate | null;
    readTimestamp(fieldName: string, defaultValue?: LocalDateTime | null): LocalDateTime | null;
    readTimestampWithTimezone(fieldName: string, defaultValue?: OffsetDateTime | null): OffsetDateTime | null;
    readCompact<T>(fieldName: string, defaultValue?: T | null): T | null;
    readArrayOfBoolean(fieldName: string, defaultValue?: boolean[] | null): boolean[] | null;
    readArrayOfInt8(fieldName: string, defaultValue?: Buffer | null): Buffer | null;
    readArrayOfInt16(fieldName: string, defaultValue?: number[] | null): number[] | null;
    readArrayOfInt32(fieldName: string, defaultValue?: number[] | null): number[] | null;
    readArrayOfInt64(fieldName: string, defaultValue?: Long[] | null): Long[] | null;
    readArrayOfFloat32(fieldName: string, defaultValue?: number[] | null): number[] | null;
    readArrayOfFloat64(fieldName: string, defaultValue?: number[] | null): number[] | null;
    readArrayOfString(fieldName: string, defaultValue?: string[] | null): string[] | null;
    readArrayOfDecimal(fieldName: string, defaultValue?: BigDecimal[] | null): BigDecimal[] | null;
    readArrayOfTime(fieldName: string, defaultValue?: LocalTime[] | null): LocalTime[] | null;
    readArrayOfDate(fieldName: string, defaultValue?: LocalDate[] | null): LocalDate[] | null;
    readArrayOfTimestamp(fieldName: string, defaultValue?: LocalDateTime[] | null): LocalDateTime[] | null;
    readArrayOfTimestampWithTimezone(fieldName: string, defaultValue?: OffsetDateTime[] | null): OffsetDateTime[] | null;
    readArrayOfCompact<T>(fieldName: string, defaultValue?: T[] | null): T[] | null;
    readNullableBoolean(fieldName : string, defaultValue?: boolean | null) : boolean | null;
    readNullableInt8(fieldName : string, defaultValue?: number | null) : number | null;
    readNullableInt16(fieldName : string, defaultValue?: number | null) : number | null ;
    readNullableInt32(fieldName : string, defaultValue?: number | null) : number | null;
    readNullableInt64(fieldName : string, defaultValue?: Long | null) : Long | null;
    readNullableFloat32(fieldName : string, defaultValue?: number | null) : number | null;
    readNullableFloat64(fieldName : string, defaultValue?: number | null) : number | null;
    readArrayOfNullableBoolean(fieldName : string, defaultValue?: (boolean | null)[] | null) : (boolean | null)[] | null;
    readArrayOfNullableInt8(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
    readArrayOfNullableInt16(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
    readArrayOfNullableInt32(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
    readArrayOfNullableInt64(fieldName : string, defaultValue?: (Long | null)[] | null) : (Long | null)[] | null;
    readArrayOfNullableFloat32(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
    readArrayOfNullableFloat64(fieldName : string, defaultValue?: (number | null)[] | null) : (number | null)[] | null;
}
