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

import {FieldKind} from './FieldKind';
import {FieldKindBasedOperations} from './FieldKindBasedOperations';
import {DefaultCompactWriter} from '../compact/DefaultCompactWriter';
import {GenericRecord} from './GenericRecord';
import {UnsupportedOperationError} from '../../core';
import {BitsUtil} from '../../util/BitsUtil';

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
                //Boolean is actually 1 bit. To make it look like smaller than Byte we use 0.
                return 0;
            },
        },
        [FieldKind.ARRAY_OF_BOOLEAN]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfBoolean(fieldName, record.getArrayOfBoolean(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.INT8]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeInt8(fieldName, record.getInt8(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.BYTE_SIZE_IN_BYTES;
            },
        },
        [FieldKind.ARRAY_OF_INT8]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfInt8(fieldName, record.getArrayOfInt8(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.CHAR]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                throw new UnsupportedOperationError('Compact format does not support writing a char field');
            },
            kindSizeInBytes(): number {
                return BitsUtil.CHAR_SIZE_IN_BYTES;
            },
        },
        [FieldKind.ARRAY_OF_CHAR]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                throw new UnsupportedOperationError('Compact format does not support writing an array of chars field')
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.INT16]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeInt16(fieldName, record.getInt16(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.SHORT_SIZE_IN_BYTES;
            },
        },
        [FieldKind.ARRAY_OF_INT16]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfInt16(fieldName, record.getArrayOfInt16(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.INT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeInt32(fieldName, record.getInt32(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.INT_SIZE_IN_BYTES;
            },
        },
        [FieldKind.ARRAY_OF_INT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfInt32(fieldName, record.getArrayOfInt32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.INT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeInt64(fieldName, record.getInt64(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.LONG_SIZE_IN_BYTES;
            },
        },
        [FieldKind.ARRAY_OF_INT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfInt64(fieldName, record.getArrayOfInt64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.FLOAT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeFloat32(fieldName, record.getFloat32(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.FLOAT_SIZE_IN_BYTES;
            },
        },
        [FieldKind.ARRAY_OF_FLOAT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfFloat32(fieldName, record.getArrayOfFloat32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.FLOAT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeFloat64(fieldName, record.getFloat64(fieldName));
            },
            kindSizeInBytes(): number {
                return BitsUtil.DOUBLE_SIZE_IN_BYTES;
            },
        },
        [FieldKind.ARRAY_OF_FLOAT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfFloat64(fieldName, record.getArrayOfFloat64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.STRING]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeString(fieldName, record.getString(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_STRING]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfString(fieldName, record.getArrayOfString(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.DECIMAL]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeDecimal(fieldName, record.getDecimal(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_DECIMAL]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfDecimal(fieldName, record.getArrayOfDecimal(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.TIME]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeTime(fieldName, record.getTime(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_TIME]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfTime(fieldName, record.getArrayOfTime(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.DATE]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeDate(fieldName, record.getDate(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_DATE]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfDate(fieldName, record.getArrayOfDate(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.TIMESTAMP]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeTimestamp(fieldName, record.getTimestamp(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_TIMESTAMP]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfTimestamp(fieldName, record.getArrayOfTimestamp(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.TIMESTAMP_WITH_TIMEZONE]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeTimestampWithTimezone(fieldName, record.getTimestampWithTimezone(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfTimestampWithTimezone(fieldName, record.getArrayOfTimestampWithTimezone(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.COMPACT]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeGenericRecord(fieldName, record.getGenericRecord(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_COMPACT]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfGenericRecords(fieldName, record.getArrayOfGenericRecord(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.NULLABLE_BOOLEAN]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableBoolean(fieldName, record.getNullableBoolean(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableBoolean(fieldName, record.getArrayOfNullableBoolean(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.NULLABLE_INT8]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableInt8(fieldName, record.getNullableInt8(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT8]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableInt8(fieldName, record.getArrayOfNullableInt8(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.NULLABLE_INT16]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableInt16(fieldName, record.getNullableInt16(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT16]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableInt16(fieldName, record.getArrayOfNullableInt16(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.NULLABLE_INT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableInt32(fieldName, record.getNullableInt32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableInt32(fieldName, record.getArrayOfNullableInt32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.NULLABLE_INT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableInt64(fieldName, record.getNullableInt64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableInt64(fieldName, record.getArrayOfNullableInt64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.NULLABLE_FLOAT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableFloat32(fieldName, record.getNullableFloat32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_NULLABLE_FLOAT32]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableFloat32(fieldName, record.getArrayOfNullableFloat32(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.NULLABLE_FLOAT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableFloat64(fieldName, record.getNullableFloat64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
        [FieldKind.ARRAY_OF_NULLABLE_FLOAT64]: {
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableFloat64(fieldName, record.getArrayOfNullableFloat64(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
        },
    };

    static fieldOperations(fieldKind: FieldKind): FieldKindBasedOperations {
        return FieldOperations.ALL[fieldKind];
    }
}
