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
import {BitsUtil} from '../../util/BitsUtil';
import {CompactReader} from '../compact/CompactReader';

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
            }
        },
        [FieldKind.ARRAY_OF_COMPACT]: {
            writeFieldFromRecordToWriter(
                writer: DefaultCompactWriter, record: GenericRecord, fieldName: string
            ) {
                writer.writeArrayOfGenericRecords(fieldName, record.getArrayOfGenericRecord(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readFromReader(reader: CompactReader, fieldName: string): any {
                return reader.readArrayOfCompact(fieldName);
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
            }
        },
    };

    static fieldOperations(fieldKind: FieldKind): FieldKindBasedOperations {
        return FieldOperations.ALL[fieldKind];
    }
}
