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

export interface CompactWriter {
    writeBoolean(fieldName: string, value: boolean): void;
    writeByte(fieldName: string, value: number): void;
    writeShort(fieldName: string, value: number): void;
    writeInt(fieldName: string, value: number): void;
    writeLong(fieldName: string, value: Long): void;
    writeFloat(fieldName: string, value: number): void;
    writeDouble(fieldName: string, value: number): void;
    writeString(fieldName: string, value: string | null): void;
    writeDecimal(fieldName: string, value: BigDecimal | null): void;
    writeTime(fieldName: string, value: LocalTime | null): void;
    writeDate(fieldName: string, value: LocalDate | null): void;
    writeTimestamp(fieldName: string, value: LocalDateTime | null): void;
    writeTimestampWithTimezone(fieldName: string, value: OffsetDateTime | null): void;
    writeCompact<T>(fieldName: string, value: T | null): void;
    writeArrayOfBooleans(fieldName: string, value: boolean[] | null): void;
    writeArrayOfBytes(fieldName: string, value: Buffer | null): void;
    writeArrayOfShorts(fieldName: string, value: number[] | null): void;
    writeArrayOfInts(fieldName: string, value: number[] | null): void;
    writeArrayOfLongs(fieldName: string, value: Long[] | null): void;
    writeArrayOfFloats(fieldName: string, value: number[] | null): void;
    writeArrayOfDoubles(fieldName: string, value: number[] | null): void;
    writeArrayOfStrings(fieldName: string, value: string[] | null): void;
    writeArrayOfDecimals(fieldName: string, value: BigDecimal[] | null): void;
    writeArrayOfTimes(fieldName: string, value: LocalTime[] | null): void;
    writeArrayOfDates(fieldName: string, value: LocalDate[] | null): void;
    writeArrayOfTimestamps(fieldName: string, value: LocalDateTime[] | null): void;
    writeArrayOfTimestampWithTimezones(fieldName: string, value: OffsetDateTime[] | null): void;
    writeArrayOfCompacts<T>(fieldName: string, value: T[] | null): void;
    writeNullableBoolean(fieldName: string, value: boolean | null): void;
    writeNullableByte(fieldName: string, value: number | null): void;
    writeNullableShort(fieldName: string, value: number | null): void;
    writeNullableInt(fieldName: string, value: number | null): void;
    writeNullableLong(fieldName: string, value: Long | null): void;
    writeNullableFloat(fieldName: string, value: number | null): void;
    writeNullableDouble(fieldName: string, value: number | null): void;
    writeArrayOfNullableBooleans(fieldName: string, value: (boolean | null)[] | null): void;
    writeArrayOfNullableBytes(fieldName: string, value: (number | null)[] | null): void;
    writeArrayOfNullableShorts(fieldName: string, value: (number | null)[] | null): void;
    writeArrayOfNullableInts(fieldName: string, value: (number | null)[] | null): void;
    writeArrayOfNullableLongs(fieldName: string, value: (Long | null)[] | null): void;
    writeArrayOfNullableFloats(fieldName: string, value: (number | null)[] | null): void;
    writeArrayOfNullableDoubles(fieldName: string, value: (number | null)[] | null): void;
}
