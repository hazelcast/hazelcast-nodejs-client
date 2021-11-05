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

import {CompactInternalGenericRecord} from '../generic_record/CompactInternalGenericRecord';
import {CompactReader} from './CompactReader';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import * as Long from 'long';
import {CompactStreamSerializer} from './CompactStreamSerializer';
import {DataInput} from '../Data';
import {Schema} from './Schema';

/**
 * @internal
 */
export class DefaultCompactReader extends CompactInternalGenericRecord implements CompactReader {
    constructor(
        serializer: CompactStreamSerializer,
        input: DataInput,
        schema: Schema,
        className: string | null,
        schemaIncludedInBinary: boolean
    ) {
        super(serializer, input, schema, className, schemaIncludedInBinary);
    }

    readArrayOfBooleans(fieldName: string, defaultValue?: boolean[] | null): boolean[] | null {
        return undefined;
    }

    readArrayOfBytes(fieldName: string, defaultValue?: Buffer | null): Buffer | null {
        return undefined;
    }

    readArrayOfCompacts<T>(fieldName: string, componentType: { new(): T }, defaultValue?: T[] | null): T[] | null {
        return undefined;
    }

    readArrayOfDates(fieldName: string, defaultValue?: LocalDate[] | null): LocalDate[] | null {
        return undefined;
    }

    readArrayOfDecimals(fieldName: string, defaultValue?: BigDecimal[] | null): BigDecimal[] | null {
        return undefined;
    }

    readArrayOfDoubles(fieldName: string, defaultValue?: number[] | null): number[] | null {
        return undefined;
    }

    readArrayOfFloats(fieldName: string, defaultValue?: number[] | null): number[] | null {
        return undefined;
    }

    readArrayOfInts(fieldName: string, defaultValue?: number[] | null): number[] | null {
        return undefined;
    }

    readArrayOfLongs(fieldName: string, defaultValue?: Long[] | null): Long[] | null {
        return undefined;
    }

    readArrayOfNullableBooleans(fieldName: string, defaultValue?: (boolean | null)[] | null): (boolean | null)[] | null {
        return undefined;
    }

    readArrayOfNullableBytes(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        return undefined;
    }

    readArrayOfNullableDoubles(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        return undefined;
    }

    readArrayOfNullableFloats(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        return undefined;
    }

    readArrayOfNullableInts(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        return undefined;
    }

    readArrayOfNullableLongs(fieldName: string, defaultValue?: (Long | null)[] | null): (Long | null)[] | null {
        return undefined;
    }

    readArrayOfNullableShorts(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        return undefined;
    }

    readArrayOfShorts(fieldName: string, defaultValue?: number[] | null): number[] | null {
        return undefined;
    }

    readArrayOfStrings(fieldName: string, defaultValue?: string[] | null): string[] | null {
        return undefined;
    }

    readArrayOfTimes(fieldName: string, defaultValue?: LocalTime[] | null): LocalTime[] | null {
        return undefined;
    }

    readArrayOfTimestampWithTimezones(fieldName: string, defaultValue?: OffsetDateTime[] | null): OffsetDateTime[] | null {
        return undefined;
    }

    readArrayOfTimestamps(fieldName: string, defaultValue?: LocalDateTime[] | null): LocalDateTime[] | null {
        return undefined;
    }

    readBoolean(fieldName: string, defaultValue?: boolean): boolean {
        return false;
    }

    readByte(fieldName: string, defaultValue?: number): number {
        return 0;
    }

    readCompact<T>(fieldName: string, defaultValue?: T | null): T | null {
        return undefined;
    }

    readDate(fieldName: string, defaultValue?: LocalDate | null): LocalDate | null {
        return undefined;
    }

    readDecimal(fieldName: string, defaultValue?: BigDecimal | null): BigDecimal | null {
        return undefined;
    }

    readDouble(fieldName: string, defaultValue?: number): number {
        return 0;
    }

    readFloat(fieldName: string, defaultValue?: number): number {
        return 0;
    }

    readInt(fieldName: string, defaultValue?: number): number {
        return 0;
    }

    readLong(fieldName: string, defaultValue?: Long): Long {
        return undefined;
    }

    readNullableBoolean(fieldName: string, defaultValue?: boolean | null): boolean | null {
        return undefined;
    }

    readNullableByte(fieldName: string, defaultValue?: number | null): number | null {
        return undefined;
    }

    readNullableDouble(fieldName: string, defaultValue?: number | null): number | null {
        return undefined;
    }

    readNullableFloat(fieldName: string, defaultValue?: number | null): number | null {
        return undefined;
    }

    readNullableInt(fieldName: string, defaultValue?: number | null): number | null {
        return undefined;
    }

    readNullableLong(fieldName: string, defaultValue?: Long | null): Long | null {
        return undefined;
    }

    readNullableShort(fieldName: number, defaultValue?: number | null): number | null {
        return undefined;
    }

    readShort(fieldName: string, defaultValue?: number): number {
        return 0;
    }

    readString(fieldName: string, defaultValue?: string | null): string | null {
        return undefined;
    }

    readTime(fieldName: string, defaultValue?: LocalTime | null): LocalTime | null {
        return undefined;
    }

    readTimestamp(fieldName: string, defaultValue?: LocalDateTime | null): LocalDateTime | null {
        return undefined;
    }

    readTimestampWithTimezone(fieldName: string, defaultValue?: OffsetDateTime | null): OffsetDateTime | null {
        return undefined;
    }

}
