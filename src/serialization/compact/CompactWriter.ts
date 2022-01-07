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
    writeInt8(fieldName: string, value: number): void;
    writeInt16(fieldName: string, value: number): void;
    writeInt32(fieldName: string, value: number): void;
    writeInt64(fieldName: string, value: Long): void;
    writeFloat32(fieldName: string, value: number): void;
    writeFloat64(fieldName: string, value: number): void;
    writeString(fieldName: string, value: string | null): void;
    writeDecimal(fieldName: string, value: BigDecimal | null): void;
    writeTime(fieldName: string, value: LocalTime | null): void;
    writeDate(fieldName: string, value: LocalDate | null): void;
    writeTimestamp(fieldName: string, value: LocalDateTime | null): void;
    writeTimestampWithTimezone(fieldName: string, value: OffsetDateTime | null): void;
    writeCompact<T>(fieldName: string, value: T | null): Promise<void>;
    writeArrayOfBoolean(fieldName: string, value: boolean[] | null): void;
    writeArrayOfInt8(fieldName: string, value: Buffer | null): void;
    writeArrayOfInt16(fieldName: string, value: number[] | null): void;
    writeArrayOfInt32(fieldName: string, value: number[] | null): void;
    writeArrayOfInt64(fieldName: string, value: Long[] | null): void;
    writeArrayOfFloat32(fieldName: string, value: number[] | null): void;
    writeArrayOfFloat64(fieldName: string, value: number[] | null): void;
    writeArrayOfString(fieldName: string, value: string[] | null): void;
    writeArrayOfDecimal(fieldName: string, value: BigDecimal[] | null): void;
    writeArrayOfTime(fieldName: string, value: LocalTime[] | null): void;
    writeArrayOfDate(fieldName: string, value: LocalDate[] | null): void;
    writeArrayOfTimestamp(fieldName: string, value: LocalDateTime[] | null): void;
    writeArrayOfTimestampWithTimezone(fieldName: string, value: OffsetDateTime[] | null): void;
    writeArrayOfCompact<T>(fieldName: string, value: T[] | null): Promise<void>;
    writeNullableBoolean(fieldName: string, value: boolean | null): void;
    writeNullableInt8(fieldName: string, value: number | null): void;
    writeNullableInt16(fieldName: string, value: number | null): void;
    writeNullableInt32(fieldName: string, value: number | null): void;
    writeNullableInt64(fieldName: string, value: Long | null): void;
    writeNullableFloat32(fieldName: string, value: number | null): void;
    writeNullableFloat64(fieldName: string, value: number | null): void;
    writeArrayOfNullableBoolean(fieldName: string, value: (boolean | null)[] | null): void;
    writeArrayOfNullableInt8(fieldName: string, value: (number | null)[] | null): void;
    writeArrayOfNullableInt16(fieldName: string, value: (number | null)[] | null): void;
    writeArrayOfNullableInt32(fieldName: string, value: (number | null)[] | null): void;
    writeArrayOfNullableInt64(fieldName: string, value: (Long | null)[] | null): void;
    writeArrayOfNullableFloat32(fieldName: string, value: (number | null)[] | null): void;
    writeArrayOfNullableFloat64(fieldName: string, value: (number | null)[] | null): void;
}
