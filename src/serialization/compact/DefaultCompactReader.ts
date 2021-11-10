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

import {CompactReader} from './CompactReader';
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core';
import * as Long from 'long';
import {CompactStreamSerializer} from './CompactStreamSerializer';
import {Schema} from './Schema';
import {ObjectDataInput} from '../ObjectData';
import {FieldKind} from '../generic_record/FieldKind';
import {CompactInternalGenericRecord} from '../generic_record/CompactInternalGenericRecord';

/**
 * @internal
 */
export class DefaultCompactReader extends CompactInternalGenericRecord implements CompactReader {
    constructor(
        serializer: CompactStreamSerializer,
        input: ObjectDataInput,
        schema: Schema,
        className: string | null,
        schemaIncludedInBinary: boolean
    ) {
        super(serializer, input, schema, className, schemaIncludedInBinary);
    }

    readArrayOfBooleans(fieldName: string, defaultValue?: boolean[] | null): boolean[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfBooleans(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_BOOLEANS) ? this.getArrayOfBooleans(fieldName) : defaultValue;
        }
    }

    readArrayOfBytes(fieldName: string, defaultValue?: Buffer | null): Buffer | null {
        if (defaultValue === undefined) {
            return this.getArrayOfBytes(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_BYTES) ? this.getArrayOfBytes(fieldName) : defaultValue;
        }
    }

    readArrayOfCompacts<T>(fieldName: string, componentType: { new(): T }, defaultValue?: T[] | null): T[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfObjects(fieldName, componentType);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_COMPACTS)
                ? this.getArrayOfObjects(fieldName, componentType) : defaultValue;
        }
    }

    readArrayOfDates(fieldName: string, defaultValue?: LocalDate[] | null): LocalDate[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfDates(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_DATES) ? this.getArrayOfDates(fieldName) : defaultValue;
        }
    }

    readArrayOfDecimals(fieldName: string, defaultValue?: BigDecimal[] | null): BigDecimal[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfDecimals(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_DECIMALS) ? this.getArrayOfDecimals(fieldName) : defaultValue;
        }
    }

    readArrayOfDoubles(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfDoubles(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_DOUBLES) ? this.getArrayOfDoubles(fieldName) : defaultValue;
        }
    }

    readArrayOfFloats(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfFloats(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_FLOATS) ? this.getArrayOfFloats(fieldName) : defaultValue;
        }
    }

    readArrayOfInts(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfInts(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_INTS) ? this.getArrayOfInts(fieldName) : defaultValue;
        }
    }

    readArrayOfLongs(fieldName: string, defaultValue?: Long[] | null): Long[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfLongs(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_LONGS) ? this.getArrayOfLongs(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableBooleans(fieldName: string, defaultValue?: (boolean | null)[] | null): (boolean | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableBooleans(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEANS) ?
                this.getArrayOfNullableBooleans(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableBytes(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableBytes(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_BYTES) ?
                this.getArrayOfNullableBytes(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableDoubles(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableDoubles(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_DOUBLES) ?
                this.getArrayOfNullableDoubles(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableFloats(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableFloats(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOATS) ?
                this.getArrayOfNullableFloats(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableInts(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableInts(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_INTS) ?
                this.getArrayOfNullableInts(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableLongs(fieldName: string, defaultValue?: (Long | null)[] | null): (Long | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableLongs(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_LONGS)
                ? this.getArrayOfNullableLongs(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableShorts(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableShorts(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_SHORTS)
                ? this.getArrayOfNullableShorts(fieldName) : defaultValue;
        }
    }

    readArrayOfShorts(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfShorts(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_SHORTS) ? this.getArrayOfShorts(fieldName) : defaultValue;
        }
    }

    readArrayOfStrings(fieldName: string, defaultValue?: string[] | null): string[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfStrings(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_STRINGS) ? this.getArrayOfStrings(fieldName) : defaultValue;
        }
    }

    readArrayOfTimes(fieldName: string, defaultValue?: LocalTime[] | null): LocalTime[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfTimes(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_TIMES) ? this.getArrayOfTimes(fieldName) : defaultValue;
        }
    }

    readArrayOfTimestampWithTimezones(fieldName: string, defaultValue?: OffsetDateTime[] | null): OffsetDateTime[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfTimestampWithTimezones(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONES) ?
                this.getArrayOfTimestampWithTimezones(fieldName) : defaultValue;
        }
    }

    readArrayOfTimestamps(fieldName: string, defaultValue?: LocalDateTime[] | null): LocalDateTime[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfTimestamps(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_TIMESTAMPS)
                ? this.getArrayOfTimestamps(fieldName) : defaultValue;
        }
    }

    readBoolean(fieldName: string, defaultValue?: boolean): boolean {
        if (defaultValue === undefined) {
            return this.getBoolean(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.BOOLEAN) ? this.getBoolean(fieldName) : defaultValue;
        }
    }

    readByte(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getByte(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.BYTE) ? this.getByte(fieldName) : defaultValue;
        }
    }

    readCompact<T>(fieldName: string, defaultValue?: T | null): T | null {
        if (defaultValue === undefined) {
            return this.getObject(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.COMPACT) ? this.getObject(fieldName) : defaultValue;
        }
    }

    readDate(fieldName: string, defaultValue?: LocalDate | null): LocalDate | null {
        if (defaultValue === undefined) {
            return this.getDate(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.DATE) ? this.getDate(fieldName) : defaultValue;
        }
    }

    readDecimal(fieldName: string, defaultValue?: BigDecimal | null): BigDecimal | null {
        if (defaultValue === undefined) {
            return this.getDecimal(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.DECIMAL) ? this.getDecimal(fieldName) : defaultValue;
        }
    }

    readDouble(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getDouble(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.DOUBLE) ? this.getDouble(fieldName) : defaultValue;
        }
    }

    readFloat(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getFloat(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.FLOAT) ? this.getFloat(fieldName) : defaultValue;
        }
    }

    readInt(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getInt(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.INT) ? this.getInt(fieldName) : defaultValue;
        }
    }

    readLong(fieldName: string, defaultValue?: Long): Long {
        if (defaultValue === undefined) {
            return this.getLong(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.LONG) ? this.getLong(fieldName) : defaultValue;
        }
    }

    readShort(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getShort(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.SHORT) ? this.getShort(fieldName) : defaultValue;
        }
    }

    readString(fieldName: string, defaultValue?: string | null): string | null {
        if (defaultValue === undefined) {
            return this.getString(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.STRING) ? this.getString(fieldName) : defaultValue;
        }
    }

    readTime(fieldName: string, defaultValue?: LocalTime | null): LocalTime | null {
        if (defaultValue === undefined) {
            return this.getTime(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.TIME) ? this.getTime(fieldName) : defaultValue;
        }
    }

    readTimestamp(fieldName: string, defaultValue?: LocalDateTime | null): LocalDateTime | null {
        if (defaultValue === undefined) {
            return this.getTimestamp(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.TIMESTAMP) ? this.getTimestamp(fieldName) : defaultValue;
        }
    }

    readTimestampWithTimezone(fieldName: string, defaultValue?: OffsetDateTime | null): OffsetDateTime | null {
        if (defaultValue === undefined) {
            return this.getTimestampWithTimezone(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.TIMESTAMP_WITH_TIMEZONE)
                ? this.getTimestampWithTimezone(fieldName) : defaultValue;
        }
    }

    readNullableBoolean(fieldName: string, defaultValue?: boolean | null): boolean | null {
        if (defaultValue === undefined) {
            return this.getNullableBoolean(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_BOOLEAN) ? this.getNullableBoolean(fieldName) : defaultValue;
        }
    }

    readNullableByte(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableByte(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_BYTE) ? this.getNullableByte(fieldName) : defaultValue;
        }
    }

    readNullableDouble(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableDouble(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_DOUBLE) ? this.getNullableDouble(fieldName) : defaultValue;
        }
    }

    readNullableFloat(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableFloat(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_FLOAT) ? this.getNullableFloat(fieldName) : defaultValue;
        }
    }

    readNullableInt(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableInt(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_INT) ? this.getNullableInt(fieldName) : defaultValue;
        }
    }

    readNullableLong(fieldName: string, defaultValue?: Long | null): Long | null {
        if (defaultValue === undefined) {
            return this.getNullableLong(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_LONG) ? this.getNullableLong(fieldName) : defaultValue;
        }
    }

    readNullableShort(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableShort(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_SHORT) ? this.getNullableShort(fieldName) : defaultValue;
        }
    }
}
