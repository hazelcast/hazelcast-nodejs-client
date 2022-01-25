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
                case FieldKind.ARRAY_OF_BOOLEAN:
                    values[field.fieldName] = this.readArrayOfBoolean(field.fieldName);
                    break;
                case FieldKind.INT8:
                    values[field.fieldName] = this.readInt8(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_INT8:
                    values[field.fieldName] = this.readArrayOfInt8(field.fieldName);
                    break;
                case FieldKind.CHAR:
                    throw new UnsupportedOperationError('Char field is not supported in compact');
                case FieldKind.ARRAY_OF_CHAR:
                    throw new UnsupportedOperationError('Char field is not supported in compact');
                case FieldKind.INT16:
                    values[field.fieldName] = this.readInt16(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_INT16:
                    values[field.fieldName] = this.readArrayOfInt16(field.fieldName);
                    break;
                case FieldKind.INT32:
                    values[field.fieldName] = this.readInt32(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_INT32:
                    values[field.fieldName] = this.readArrayOfInt32(field.fieldName);
                    break;
                case FieldKind.INT64:
                    values[field.fieldName] = this.readInt64(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_INT64:
                    values[field.fieldName] = this.readArrayOfInt64(field.fieldName);
                    break;
                case FieldKind.FLOAT32:
                    values[field.fieldName] = this.readFloat32(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_FLOAT32:
                    values[field.fieldName] = this.readArrayOfFloat32(field.fieldName);
                    break;
                case FieldKind.FLOAT64:
                    values[field.fieldName] = this.readFloat64(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_FLOAT64:
                    values[field.fieldName] = this.readArrayOfFloat64(field.fieldName);
                    break;
                case FieldKind.STRING:
                    values[field.fieldName] = this.readString(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_STRING:
                    values[field.fieldName] = this.readArrayOfString(field.fieldName);
                    break;
                case FieldKind.DECIMAL:
                    values[field.fieldName] = this.readDecimal(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_DECIMAL:
                    values[field.fieldName] = this.readArrayOfDecimal(field.fieldName);
                    break;
                case FieldKind.TIME:
                    values[field.fieldName] = this.readTime(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_TIME:
                    values[field.fieldName] = this.readArrayOfTime(field.fieldName);
                    break;
                case FieldKind.DATE:
                    values[field.fieldName] = this.readDate(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_DATE:
                    values[field.fieldName] = this.readArrayOfDate(field.fieldName);
                    break;
                case FieldKind.TIMESTAMP:
                    values[field.fieldName] = this.readTimestamp(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMP:
                    values[field.fieldName] = this.readArrayOfTimestamp(field.fieldName);
                    break;
                case FieldKind.TIMESTAMP_WITH_TIMEZONE:
                    values[field.fieldName] = this.readTimestampWithTimezone(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE:
                    values[field.fieldName] = this.readArrayOfTimestampWithTimezone(field.fieldName);
                    break;
                case FieldKind.COMPACT:
                    values[field.fieldName] = this.readCompact(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_COMPACT:
                    values[field.fieldName] = this.readArrayOfCompact(field.fieldName);
                    break;
                case FieldKind.PORTABLE:
                    throw new UnsupportedOperationError('Portable field is not supported in compact');
                case FieldKind.ARRAY_OF_PORTABLE:
                    throw new UnsupportedOperationError('Portable field is not supported in compact');
                case FieldKind.NULLABLE_BOOLEAN:
                    values[field.fieldName] = this.readNullableBoolean(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                    values[field.fieldName] = this.readArrayOfNullableBoolean(field.fieldName);
                    break;
                case FieldKind.NULLABLE_INT8:
                    values[field.fieldName] = this.readNullableInt8(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT8:
                    values[field.fieldName] = this.readArrayOfNullableInt8(field.fieldName);
                    break;
                case FieldKind.NULLABLE_INT16:
                    values[field.fieldName] = this.readNullableInt16(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT16:
                    values[field.fieldName] = this.readArrayOfNullableInt16(field.fieldName);
                    break;
                case FieldKind.NULLABLE_INT32:
                    values[field.fieldName] = this.readNullableInt32(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT32:
                    values[field.fieldName] = this.readArrayOfNullableInt32(field.fieldName);
                    break;
                case FieldKind.NULLABLE_INT64:
                    values[field.fieldName] = this.readNullableInt64(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_INT64:
                    values[field.fieldName] = this.readArrayOfNullableInt64(field.fieldName);
                    break;
                case FieldKind.NULLABLE_FLOAT32:
                    values[field.fieldName] = this.readNullableFloat32(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_FLOAT32:
                    values[field.fieldName] = this.readArrayOfNullableFloat32(field.fieldName);
                    break;
                case FieldKind.NULLABLE_FLOAT64:
                    values[field.fieldName] = this.readNullableFloat64(field.fieldName);
                    break;
                case FieldKind.ARRAY_OF_NULLABLE_FLOAT64:
                    values[field.fieldName] = this.readArrayOfNullableFloat64(field.fieldName);
                    break;
            }
        }
        return new CompactGenericRecordImpl(this.typeName, fields, values);
    }

    readArrayOfBoolean(fieldName: string, defaultValue?: boolean[] | null): boolean[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfBoolean(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_BOOLEAN) ? this.getArrayOfBoolean(fieldName) : defaultValue;
        }
    }

    readArrayOfInt8(fieldName: string, defaultValue?: Buffer | null): Buffer | null {
        if (defaultValue === undefined) {
            return this.getArrayOfInt8(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_INT8) ? this.getArrayOfInt8(fieldName) : defaultValue;
        }
    }

    readArrayOfCompact<T>(fieldName: string, defaultValue?: T[] | null): T[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfObject(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_COMPACT)
                ? this.getArrayOfObject(fieldName) : defaultValue;
        }
    }

    readArrayOfDate(fieldName: string, defaultValue?: LocalDate[] | null): LocalDate[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfDate(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_DATE) ? this.getArrayOfDate(fieldName) : defaultValue;
        }
    }

    readArrayOfDecimal(fieldName: string, defaultValue?: BigDecimal[] | null): BigDecimal[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfDecimal(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_DECIMAL) ? this.getArrayOfDecimal(fieldName) : defaultValue;
        }
    }

    readArrayOfFloat64(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfFloat64(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_FLOAT64) ? this.getArrayOfFloat64(fieldName) : defaultValue;
        }
    }

    readArrayOfFloat32(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfFloat32(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_FLOAT32) ? this.getArrayOfFloat32(fieldName) : defaultValue;
        }
    }

    readArrayOfInt32(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfInt32(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_INT32) ? this.getArrayOfInt32(fieldName) : defaultValue;
        }
    }

    readArrayOfInt64(fieldName: string, defaultValue?: Long[] | null): Long[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfInt64(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_INT64) ? this.getArrayOfInt64(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableBoolean(fieldName: string, defaultValue?: (boolean | null)[] | null): (boolean | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableBoolean(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN) ?
                this.getArrayOfNullableBoolean(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableInt8(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableInt8(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT8) ?
                this.getArrayOfNullableInt8(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableFloat64(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableFloat64(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT64) ?
                this.getArrayOfNullableFloat64(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableFloat32(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableFloat32(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT32) ?
                this.getArrayOfNullableFloat32(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableInt32(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableInt32(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT32) ?
                this.getArrayOfNullableInt32(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableInt64(fieldName: string, defaultValue?: (Long | null)[] | null): (Long | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableInt64(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT64)
                ? this.getArrayOfNullableInt64(fieldName) : defaultValue;
        }
    }

    readArrayOfNullableInt16(fieldName: string, defaultValue?: (number | null)[] | null): (number | null)[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfNullableInt16(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_NULLABLE_INT16)
                ? this.getArrayOfNullableInt16(fieldName) : defaultValue;
        }
    }

    readArrayOfInt16(fieldName: string, defaultValue?: number[] | null): number[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfInt16(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_INT16) ? this.getArrayOfInt16(fieldName) : defaultValue;
        }
    }

    readArrayOfString(fieldName: string, defaultValue?: string[] | null): string[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfString(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_STRING) ? this.getArrayOfString(fieldName) : defaultValue;
        }
    }

    readArrayOfTime(fieldName: string, defaultValue?: LocalTime[] | null): LocalTime[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfTime(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_TIME) ? this.getArrayOfTime(fieldName) : defaultValue;
        }
    }

    readArrayOfTimestampWithTimezone(fieldName: string, defaultValue?: OffsetDateTime[] | null): OffsetDateTime[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfTimestampWithTimezone(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE) ?
                this.getArrayOfTimestampWithTimezone(fieldName) : defaultValue;
        }
    }

    readArrayOfTimestamp(fieldName: string, defaultValue?: LocalDateTime[] | null): LocalDateTime[] | null {
        if (defaultValue === undefined) {
            return this.getArrayOfTimestamp(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_TIMESTAMP)
                ? this.getArrayOfTimestamp(fieldName) : defaultValue;
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
            return this.getInt8(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.INT8) ? this.getInt8(fieldName) : defaultValue;
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
            return this.getFloat64(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.FLOAT64) ? this.getFloat64(fieldName) : defaultValue;
        }
    }

    readFloat32(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getFloat32(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.FLOAT32) ? this.getFloat32(fieldName) : defaultValue;
        }
    }

    readInt32(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getInt32(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.INT32) ? this.getInt32(fieldName) : defaultValue;
        }
    }

    readInt64(fieldName: string, defaultValue?: Long): Long {
        if (defaultValue === undefined) {
            return this.getInt64(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.INT64) ? this.getInt64(fieldName) : defaultValue;
        }
    }

    readInt16(fieldName: string, defaultValue?: number): number {
        if (defaultValue === undefined) {
            return this.getInt16(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.INT16) ? this.getInt16(fieldName) : defaultValue;
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
            return this.getNullableInt8(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_INT8) ? this.getNullableInt8(fieldName) : defaultValue;
        }
    }

    readNullableFloat64(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableFloat64(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_FLOAT64) ? this.getNullableFloat64(fieldName) : defaultValue;
        }
    }

    readNullableFloat32(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableFloat32(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_FLOAT32) ? this.getNullableFloat32(fieldName) : defaultValue;
        }
    }

    readNullableInt32(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableInt32(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_INT32) ? this.getNullableInt32(fieldName) : defaultValue;
        }
    }

    readNullableInt64(fieldName: string, defaultValue?: Long | null): Long | null {
        if (defaultValue === undefined) {
            return this.getNullableInt64(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_INT64) ? this.getNullableInt64(fieldName) : defaultValue;
        }
    }

    readNullableInt16(fieldName: string, defaultValue?: number | null): number | null {
        if (defaultValue === undefined) {
            return this.getNullableInt16(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.NULLABLE_INT16) ? this.getNullableInt16(fieldName) : defaultValue;
        }
    }
}
