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
import {BigDecimal, LocalDate, LocalDateTime, LocalTime, OffsetDateTime, UnsupportedOperationError} from '../../core';
import * as Long from 'long';
import {CompactStreamSerializer} from './CompactStreamSerializer';
import {Schema} from './Schema';
import {ObjectDataInput} from '../ObjectData';
import {FieldKind} from '../generic_record/FieldKind';
import {CompactInternalGenericRecord} from '../generic_record/CompactInternalGenericRecord';
import {CompactGenericRecordImpl} from '../generic_record';
import {Field} from '../generic_record/Field';

/**
 * @internal
 */
export class DefaultCompactReader extends CompactInternalGenericRecord implements CompactReader {
    constructor(
        serializer: CompactStreamSerializer,
        input: ObjectDataInput,
        schema: Schema,
        typeName: string | null,
        schemaIncludedInBinary: boolean
    ) {
        super(serializer, input, schema, typeName, schemaIncludedInBinary);
    }

    toSerialized(): CompactGenericRecordImpl {
        const fields: {[name: string]: Field<any>} = {};
        const values: {[name: string]: any} = {};

        for (const field of this.schema.fields) {
            fields[field.fieldName] = field;
            switch (field.kind) {
                case FieldKind.BOOLEAN:
                    values[field.fieldName] = this.readBoolean(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_BOOLEANS:
                    values[field.fieldName] = this.readArrayOfBoolean(field.fieldName);
                    break;
                case FieldKind.BYTE:
                    values[field.fieldName] = this.readInt8(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_BYTES:
                    values[field.fieldName] = this.readArrayOfInt8(field.fieldName);
                    break;
                case FieldKind.CHAR:
                    throw new UnsupportedOperationError('Char field is not supported in compact');
                case FieldKind.ARRAY_OF_CHARS:
                    throw new UnsupportedOperationError('Char field is not supported in compact');
                case FieldKind.SHORT:
                    values[field.fieldName] = this.readInt16(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_SHORTS:
                    values[field.fieldName] = this.readArrayOfInt16(field.fieldName);
                    break;
                case FieldKind.INT:
                    values[field.fieldName] = this.readInt32(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_INTS:
                    values[field.fieldName] = this.readArrayOfInt32(field.fieldName);
                    break;
                case FieldKind.LONG:
                    values[field.fieldName] = this.readInt64(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_LONGS:
                    values[field.fieldName] = this.readArrayOfInt64(field.fieldName);
                    break;
                case FieldKind.FLOAT:
                    values[field.fieldName] = this.readFloat32(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_FLOATS:
                    values[field.fieldName] = this.readArrayOfFloat32(field.fieldName);
                    break;
                case FieldKind.DOUBLE:
                    values[field.fieldName] = this.readFloat64(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_DOUBLES:
                    values[field.fieldName] = this.readArrayOfFloat64(field.fieldName);
                    break;
                case FieldKind.STRING:
                    values[field.fieldName] = this.readString(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_STRINGS:
                    values[field.fieldName] = this.readArrayOfString(field.fieldName);
                    break;
                case FieldKind.DECIMAL:
                    values[field.fieldName] = this.readDecimal(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_DECIMALS:
                    values[field.fieldName] = this.readArrayOfDecimal(field.fieldName);
                    break;
                case FieldKind.TIME:
                    values[field.fieldName] = this.readTime(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_TIMES:
                    values[field.fieldName] = this.readArrayOfTime(field.fieldName);
                    break;
                case FieldKind.DATE:
                    values[field.fieldName] = this.readDate(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_DATES:
                    values[field.fieldName] = this.readArrayOfDate(field.fieldName);
                    break;
                case FieldKind.TIMESTAMP:
                    values[field.fieldName] = this.readTimestamp(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMPS:
                    values[field.fieldName] = this.readArrayOfTimestamp(field.fieldName);
                    break;
                case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                    values[field.fieldName] = this.readTimestampWithTimezone(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONES:
                    values[field.fieldName] = this.readArrayOfTimestampWithTimezone(field.fieldName);
                    break;
                case FieldKind.COMPACT:
                    values[field.fieldName] = this.readCompact(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_COMPACTS:
                    values[field.fieldName] = this.readArrayOfCompact(field.fieldName);
                    break;
                case FieldKind.PORTABLE:
                    throw new UnsupportedOperationError('Portable field is not supported in compact');
                case FieldKind.ARRAY_OF_PORTABLES:
                    throw new UnsupportedOperationError('Portable field is not supported in compact');
                case FieldKind.NULLABLE_BOOLEAN:
                    values[field.fieldName] = this.readNullableBoolean(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_BOOLEANS:
                    values[field.fieldName] = this.readArrayOfNullableBoolean(field.fieldName);
                    break;
                case FieldKind.NULLABLE_BYTE:
                    values[field.fieldName] = this.readNullableInt8(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_BYTES:
                    values[field.fieldName] = this.readArrayOfNullableInt8(field.fieldName);
                    break;
                case FieldKind.NULLABLE_SHORT:
                    values[field.fieldName] = this.readNullableInt16(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_SHORTS:
                    values[field.fieldName] = this.readArrayOfNullableInt16(field.fieldName);
                    break;
                case FieldKind.NULLABLE_INT:
                    values[field.fieldName] = this.readNullableInt32(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INTS:
                    values[field.fieldName] = this.readArrayOfNullableInt32(field.fieldName);
                    break;
                case FieldKind.NULLABLE_LONG:
                    values[field.fieldName] = this.readNullableInt64(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_LONGS:
                    values[field.fieldName] = this.readArrayOfNullableInt64(field.fieldName);
                    break;
                case FieldKind.NULLABLE_FLOAT:
                    values[field.fieldName] = this.readNullableFloat32(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_FLOATS:
                    values[field.fieldName] = this.readArrayOfNullableFloat32(field.fieldName);
                    break;
                case FieldKind.NULLABLE_DOUBLE:
                    values[field.fieldName] = this.readNullableFloat64(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_DOUBLES:
                    values[field.fieldName] = this.readArrayOfNullableFloat64(field.fieldName);
                    break;
            }
        }
        return new CompactGenericRecordImpl(this.typeName, fields, values);
    }

    readArrayOfBoolean(fieldName: string, defaultValue?: boolean[] | null): boolean[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfBooleans(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_BOOLEANS) ? this.getArrayOfBooleans(fieldName) : defaultValue;
        }
    }

    readArrayOfInt8(fieldName: string, defaultValue?: Buffer | null): Buffer | null {
        if (defaultValue === undefined) {
            return this.getArrayOfBytes(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_BYTES) ? this.getArrayOfBytes(fieldName) : defaultValue;
        }
    }

    readArrayOfCompact<T>(fieldName: string, defaultValue?: T[] | null): T[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfObjects(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_COMPACTS)
                ? this.getArrayOfObjects(fieldName) : defaultValue;
        }
    }

    readArrayOfDate(fieldName: string, defaultValue?: LocalDate[] | null): LocalDate[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfDates(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_DATES) ? this.getArrayOfDates(fieldName) : defaultValue;
        }
    }

    readArrayOfDecimal(fieldName: string, defaultValue?: BigDecimal[] | null): BigDecimal[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfDecimals(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_DECIMALS) ? this.getArrayOfDecimals(fieldName) : defaultValue;
        }
    }

    readArrayOfFloat64(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfDoubles(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_DOUBLES) ? this.getArrayOfDoubles(fieldName) : defaultValue;
        }
    }

    readArrayOfFloat32(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfFloats(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_FLOATS) ? this.getArrayOfFloats(fieldName) : defaultValue;
        }
    }

    readArrayOfInt32(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfInts(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_INTS) ? this.getArrayOfInts(fieldName) : defaultValue;
        }
    }

    readArrayOfInt64(fieldName: string, defaultValue?: Long[] | null): Long[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfLongs(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_LONGS) ? this.getArrayOfLongs(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableBoolean(fieldName: string, defaultValue?: (boolean | null)[] | null): (boolean | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableBooleans(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEANS) ?
                this.getArrayOfNullableBooleans(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableInt8(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableBytes(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_BYTES) ?
                this.getArrayOfNullableBytes(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableFloat64(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableDoubles(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_DOUBLES) ?
                this.getArrayOfNullableDoubles(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableFloat32(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableFloats(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOATS) ?
                this.getArrayOfNullableFloats(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableInt32(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableInts(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_INTS) ?
                this.getArrayOfNullableInts(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableInt64(fieldName: string, defaultValue?: (Long | null)[] | null): (Long | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableLongs(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_LONGS)
                ? this.getArrayOfNullableLongs(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableInt16(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableShorts(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_SHORTS)
                ? this.getArrayOfNullableShorts(fieldName) : defaultValue;
        }
    }

    readArrayOfInt16(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfShorts(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_SHORTS) ? this.getArrayOfShorts(fieldName) : defaultValue;
        }
    }

    readArrayOfString(fieldName: string, defaultValue?: string[] | null): string[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfStrings(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_STRINGS) ? this.getArrayOfStrings(fieldName) : defaultValue;
        }
    }

    readArrayOfTime(fieldName: string, defaultValue?: LocalTime[] | null): LocalTime[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfTimes(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_TIMES) ? this.getArrayOfTimes(fieldName) : defaultValue;
        }
    }

    readArrayOfTimestampWithTimezone(fieldName: string, defaultValue?: OffsetDateTime[] | null): OffsetDateTime[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfTimestampWithTimezones(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONES) ?
                this.getArrayOfTimestampWithTimezones(fieldName) : defaultValue;
        }
    }

    readArrayOfTimestamp(fieldName: string, defaultValue?: LocalDateTime[] | null): LocalDateTime[] | null {
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

    readInt8(fieldName: string, defaultValue?: number): number {
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

    readFloat64(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getDouble(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.DOUBLE) ? this.getDouble(fieldName) : defaultValue;
        }
    }

    readFloat32(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getFloat(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.FLOAT) ? this.getFloat(fieldName) : defaultValue;
        }
    }

    readInt32(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getInt(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.INT) ? this.getInt(fieldName) : defaultValue;
        }
    }

    readInt64(fieldName: string, defaultValue?: Long): Long {
        if (defaultValue === undefined) {
            return this.getLong(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.LONG) ? this.getLong(fieldName) : defaultValue;
        }
    }

    readInt16(fieldName: string, defaultValue?: number): number {
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

    readNullableInt8(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableByte(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_BYTE) ? this.getNullableByte(fieldName) : defaultValue;
        }
    }

    readNullableFloat64(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableDouble(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_DOUBLE) ? this.getNullableDouble(fieldName) : defaultValue;
        }
    }

    readNullableFloat32(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableFloat(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_FLOAT) ? this.getNullableFloat(fieldName) : defaultValue;
        }
    }

    readNullableInt32(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableInt(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_INT) ? this.getNullableInt(fieldName) : defaultValue;
        }
    }

    readNullableInt64(fieldName: string, defaultValue?: Long | null): Long | null {
        if (defaultValue === undefined) {
            return this.getNullableLong(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_LONG) ? this.getNullableLong(fieldName) : defaultValue;
        }
    }

    readNullableInt16(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableShort(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_SHORT) ? this.getNullableShort(fieldName) : defaultValue;
        }
    }
}
