/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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

import {FieldKind} from './FieldKind';
import {FieldKindBasedOperations} from './FieldKindBasedOperations';
import {DefaultCompactWriter} from '../compact/DefaultCompactWriter';
import {GenericRecord} from './GenericRecord';
import {BitsUtil} from '../../util/BitsUtil';
import {CompactReader} from '../compact/CompactReader';
import {FieldValidator} from './FieldValidator';
import {BigDecimal} from '../../core/BigDecimal';
import {LocalDate, LocalDateTime, LocalTime, OffsetDateTime} from '../../core/DateTimeClasses';
import {CompactGenericRecordImpl} from './CompactGenericRecord';

import * as Long from 'long';

/**
 * Implementation of {@link FieldKindBasedOperations} for each field
 * @internal
 */
export class FieldOperations {
    static readonly VARIABLE_SIZE = -1;

    static readonly ALL: { [fieldKindId: number]: FieldKindBasedOperations } = {
        [FieldKind.BOOLEAN]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeBoolean(fieldName, record.getBoolean(fieldName));
            },
            kindSizeInBytes(): number {
                // Boolean is actually 1 bit. To make it look like smaller than Byte we use 0.
                return 0;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readBoolean(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateType(fieldName, 'boolean', value, getErrorStringFn);
            }
        },
        [FieldKind.ARRAY_OF_BOOLEAN]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfBoolean(fieldName, record.getArrayOfBoolean(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfBoolean(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.BOOLEAN);
            }
        },
        [FieldKind.INT8]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeInt8(fieldName, record.getInt8(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.BYTE_SIZE_IN_BYTES;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readInt8(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
                FieldValidator.validateInt8Range(fieldName, value);
            }
        },
        [FieldKind.ARRAY_OF_INT8]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfInt8(fieldName, record.getArrayOfInt8(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfInt8(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                if (!Buffer.isBuffer(value) && value !== null) {
                    throw new TypeError(FieldValidator.getErrorStringForField(fieldName, 'Buffer or null', value));
                }
            }
        },
        [FieldKind.INT16]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeInt16(fieldName, record.getInt16(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.SHORT_SIZE_IN_BYTES;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readInt16(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
                FieldValidator.validateInt16Range(fieldName, value);
            }
        },
        [FieldKind.ARRAY_OF_INT16]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfInt16(fieldName, record.getArrayOfInt16(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfInt16(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.INT16);
            }
        },
        [FieldKind.INT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeInt32(fieldName, record.getInt32(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.INT_SIZE_IN_BYTES;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readInt32(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
                FieldValidator.validateInt32Range(fieldName, value);
            }
        },
        [FieldKind.ARRAY_OF_INT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfInt32(fieldName, record.getArrayOfInt32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfInt32(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.INT32);
            }
        },
        [FieldKind.INT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeInt64(fieldName, record.getInt64(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.LONG_SIZE_IN_BYTES;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readInt64(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                if (!Long.isLong(value)) {
                    FieldValidator.throwTypeErrorWithMessage(fieldName, 'Long', value, getErrorStringFn);
                }
            }
        },
        [FieldKind.ARRAY_OF_INT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfInt64(fieldName, record.getArrayOfInt64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfInt64(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.INT64);
            }
        },
        [FieldKind.FLOAT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeFloat32(fieldName, record.getFloat32(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.FLOAT_SIZE_IN_BYTES;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readFloat32(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
            }
        },
        [FieldKind.ARRAY_OF_FLOAT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfFloat32(fieldName, record.getArrayOfFloat32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfFloat32(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.FLOAT32);
            }
        },
        [FieldKind.FLOAT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeFloat64(fieldName, record.getFloat64(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.DOUBLE_SIZE_IN_BYTES;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readFloat64(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateType(fieldName, 'number', value, getErrorStringFn);
            }
        },
        [FieldKind.ARRAY_OF_FLOAT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfFloat64(fieldName, record.getArrayOfFloat64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfFloat64(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.FLOAT64);
            }
        },
        [FieldKind.STRING]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeString(fieldName, record.getString(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readString(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                if (typeof value !== 'string' && value !== null) {
                    FieldValidator.throwTypeErrorWithMessage(fieldName, 'String or null', value, getErrorStringFn);
                }
            }
        },
        [FieldKind.ARRAY_OF_STRING]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfString(fieldName, record.getArrayOfString(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfString(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.STRING);
            }
        },
        [FieldKind.DECIMAL]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeDecimal(fieldName, record.getDecimal(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readDecimal(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                if (!(value instanceof BigDecimal) && value !== null) {
                    FieldValidator.throwTypeErrorWithMessage(fieldName, 'BigDecimal or null', value, getErrorStringFn);
                }
            }
        },
        [FieldKind.ARRAY_OF_DECIMAL]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfDecimal(fieldName, record.getArrayOfDecimal(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfDecimal(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.DECIMAL);
            }
        },
        [FieldKind.TIME]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeTime(fieldName, record.getTime(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readTime(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                if (!(value instanceof LocalTime) && value !== null) {
                    FieldValidator.throwTypeErrorWithMessage(fieldName, 'LocalTime or null', value, getErrorStringFn);
                }
            }
        },
        [FieldKind.ARRAY_OF_TIME]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfTime(fieldName, record.getArrayOfTime(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfTime(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.TIME);
            }
        },
        [FieldKind.DATE]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeDate(fieldName, record.getDate(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readDate(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                if (!(value instanceof LocalDate) && value !== null) {
                    FieldValidator.throwTypeErrorWithMessage(fieldName, 'LocalDate or null', value, getErrorStringFn);
                }
            }
        },
        [FieldKind.ARRAY_OF_DATE]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfDate(fieldName, record.getArrayOfDate(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfDate(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.DATE);
            }
        },
        [FieldKind.TIMESTAMP]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeTimestamp(fieldName, record.getTimestamp(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readTimestamp(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                if (!(value instanceof LocalDateTime) && value !== null) {
                    FieldValidator.throwTypeErrorWithMessage(fieldName, 'LocalDateTime or null', value, getErrorStringFn);
                }
            }
        },
        [FieldKind.ARRAY_OF_TIMESTAMP]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfTimestamp(fieldName, record.getArrayOfTimestamp(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfTimestamp(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.TIMESTAMP);
            }
        },
        [FieldKind.TIMESTAMP_WITH_TIMEZONE]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeTimestampWithTimezone(fieldName, record.getTimestampWithTimezone(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readTimestampWithTimezone(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                if (!(value instanceof OffsetDateTime) && value !== null) {
                    FieldValidator.throwTypeErrorWithMessage(fieldName, 'OffsetDateTime or null', value, getErrorStringFn);
                }
            }
        },
        [FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfTimestampWithTimezone(fieldName, record.getArrayOfTimestampWithTimezone(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfTimestampWithTimezone(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.TIMESTAMP_WITH_TIMEZONE);
            }
        },
        [FieldKind.COMPACT]: {
            writeFieldFromRecordToWriter(
                writer: DefaultCompactWriter, record: GenericRecord, fieldName: string
            ) {
                writer.writeGenericRecord(fieldName, record.getGenericRecord(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readCompact(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                if (value !== null && !(value instanceof CompactGenericRecordImpl)) {
                    FieldValidator.throwTypeErrorWithMessage(fieldName, 'Compact', value, getErrorStringFn);
                }
            }
        },
        [FieldKind.ARRAY_OF_COMPACT]: {
            writeFieldFromRecordToWriter(
                writer: DefaultCompactWriter, record: GenericRecord, fieldName: string
            ) {
                writer.writeArrayOfGenericRecord(fieldName, record.getArrayOfGenericRecord(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfCompact(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.COMPACT);
            }
        },
        [FieldKind.NULLABLE_BOOLEAN]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableBoolean(fieldName, record.getNullableBoolean(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readNullableBoolean(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateNullableType(fieldName, 'boolean', value, getErrorStringFn);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableBoolean(fieldName, record.getArrayOfNullableBoolean(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfNullableBoolean(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.NULLABLE_BOOLEAN);
            }
        },
        [FieldKind.NULLABLE_INT8]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableInt8(fieldName, record.getNullableInt8(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readNullableInt8(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
                FieldValidator.validateInt8Range(fieldName, value);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT8]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableInt8(fieldName, record.getArrayOfNullableInt8(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfNullableInt8(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.NULLABLE_INT8);
            }
        },
        [FieldKind.NULLABLE_INT16]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableInt16(fieldName, record.getNullableInt16(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readNullableInt16(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
                FieldValidator.validateInt16Range(fieldName, value);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT16]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableInt16(fieldName, record.getArrayOfNullableInt16(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfNullableInt16(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.NULLABLE_INT16);
            }
        },
        [FieldKind.NULLABLE_INT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableInt32(fieldName, record.getNullableInt32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readNullableInt32(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
                FieldValidator.validateInt32Range(fieldName, value);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableInt32(fieldName, record.getArrayOfNullableInt32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfNullableInt32(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.NULLABLE_INT32);
            }
        },
        [FieldKind.NULLABLE_INT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableInt64(fieldName, record.getNullableInt64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readNullableInt64(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                if (!Long.isLong(value) && value !== null) {
                    FieldValidator.throwTypeErrorWithMessage(fieldName, 'Long or null', value, getErrorStringFn);
                }
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableInt64(fieldName, record.getArrayOfNullableInt64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfNullableInt64(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.NULLABLE_INT64);
            }
        },
        [FieldKind.NULLABLE_FLOAT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableFloat32(fieldName, record.getNullableFloat32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readNullableFloat32(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_FLOAT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableFloat32(fieldName, record.getArrayOfNullableFloat32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfNullableFloat32(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.NULLABLE_FLOAT32);
            }
        },
        [FieldKind.NULLABLE_FLOAT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableFloat64(fieldName, record.getNullableFloat64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readNullableFloat64(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
                getErrorStringFn: (fieldName: string, typeName: string, value: any) => string,
            ): void {
                FieldValidator.validateNullableType(fieldName, 'number', value, getErrorStringFn);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_FLOAT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableFloat64(fieldName, record.getArrayOfNullableFloat64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfNullableFloat64(fieldName);
            },
            validateField(
                fieldName: string,
                value: any,
            ): void {
                FieldValidator.validateArray(fieldName, value, FieldKind.NULLABLE_FLOAT64);
            }
        },
    };

    static fieldOperations(fieldKind: FieldKind): FieldKindBasedOperations {
        return FieldOperations.ALL[fieldKind];
    }
}
