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
import {InternalGenericRecord} from './InternalGenericRecord';

/**
 * @internal
 */
export class FieldOperations {
    static readonly VARIABLE_SIZE = -1;

    static getSingleKind(fieldKind: FieldKind): FieldKind {
        return fieldKind - 1;
    }

    static notArrayKindException(fieldName: string): UnsupportedOperationError {
        return new UnsupportedOperationError(`'${fieldName}' is not an array kind. It does not support indexed reads.`);
    }

    static readonly ALL: { [fieldKindId: number]: FieldKindBasedOperations } = {
        [FieldKind.BOOLEAN]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getBoolean(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeBoolean(fieldName, record.getBoolean(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return 0;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_BOOLEAN]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfBoolean(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfBoolean(fieldName, record.getArrayOfBoolean(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                record.getBooleanFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.INT8]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getInt8(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeInt8(fieldName, record.getInt8(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return BitsUtil.BYTE_SIZE_IN_BYTES;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_INT8]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfInt8(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfInt8(fieldName, record.getArrayOfInt8(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getInt8FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.CHAR]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getChar(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                return Promise.reject(new UnsupportedOperationError('Compact format does not support writing a char field'));
            },
            kindSizeInBytes(): number {
                return BitsUtil.CHAR_SIZE_IN_BYTES;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_CHAR]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfChar(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                return Promise.reject(
                    new UnsupportedOperationError('Compact format does not support writing an array of chars field')
                );
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getCharFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.INT16]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getInt16(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeInt16(fieldName, record.getInt16(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return BitsUtil.SHORT_SIZE_IN_BYTES;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_INT16]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfInt16(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfInt16(fieldName, record.getArrayOfInt16(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getInt16FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.INT32]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getInt32(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeInt32(fieldName, record.getInt32(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return BitsUtil.INT_SIZE_IN_BYTES;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_INT32]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfInt32(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfInt32(fieldName, record.getArrayOfInt32(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getInt32FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.INT64]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getInt64(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeInt64(fieldName, record.getInt64(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return BitsUtil.LONG_SIZE_IN_BYTES;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_INT64]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfInt64(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfInt64(fieldName, record.getArrayOfInt64(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getInt64FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.FLOAT32]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getFloat32(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeFloat32(fieldName, record.getFloat32(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return BitsUtil.FLOAT_SIZE_IN_BYTES;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_FLOAT32]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfFloat32(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfFloat32(fieldName, record.getArrayOfFloat32(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getFloat32FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.FLOAT64]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getFloat64(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeFloat64(fieldName, record.getFloat64(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return BitsUtil.DOUBLE_SIZE_IN_BYTES;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_FLOAT64]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfFloat64(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfFloat64(fieldName, record.getArrayOfFloat64(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getFloat64FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.STRING]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getString(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeString(fieldName, record.getString(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_STRING]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfString(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfString(fieldName, record.getArrayOfString(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getStringFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.DECIMAL]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getDecimal(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeDecimal(fieldName, record.getDecimal(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_DECIMAL]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfDecimal(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfDecimal(fieldName, record.getArrayOfDecimal(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getDecimalFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.TIME]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getTime(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeTime(fieldName, record.getTime(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_TIME]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfTime(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfTime(fieldName, record.getArrayOfTime(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getTimeFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.DATE]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getDate(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeDate(fieldName, record.getDate(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_DATE]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfDate(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfDate(fieldName, record.getArrayOfDate(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getDateFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.TIMESTAMP]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getTimestamp(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeTimestamp(fieldName, record.getTimestamp(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_TIMESTAMP]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfTimestamp(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfTimestamp(fieldName, record.getArrayOfTimestamp(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getTimestampFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.TIMESTAMP_WITH_TIMEZONE]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getTimestampWithTimezone(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeTimestampWithTimezone(fieldName, record.getTimestampWithTimezone(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfTimestampWithTimezone(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfTimestampWithTimezone(fieldName, record.getArrayOfTimestampWithTimezone(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getTimestampWithTimezoneFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.COMPACT]: {
            readObject(record: GenericRecord, fieldName: string) {
                return (record as InternalGenericRecord).getObject(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                return writer.writeGenericRecord(fieldName, record.getGenericRecord(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return record.getGenericRecord(fieldName);
            }
        },
        [FieldKind.ARRAY_OF_COMPACT]: {
            readObject(record: GenericRecord, fieldName: string) {
                return (record as InternalGenericRecord).getArrayOfObject(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                return writer.writeArrayOfGenericRecords(fieldName, record.getArrayOfGenericRecord(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getObjectFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return record.getArrayOfGenericRecord(fieldName);
            }
        },
        [FieldKind.NULLABLE_BOOLEAN]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableBoolean(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeNullableBoolean(fieldName, record.getNullableBoolean(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableBoolean(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfNullableBoolean(fieldName, record.getArrayOfNullableBoolean(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableBooleanFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_INT8]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableInt8(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeNullableInt8(fieldName, record.getNullableInt8(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT8]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableInt8(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfNullableInt8(fieldName, record.getArrayOfNullableInt8(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableInt8FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_INT16]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableInt16(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeNullableInt16(fieldName, record.getNullableInt16(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT16]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableInt16(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfNullableInt16(fieldName, record.getArrayOfNullableInt16(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableInt16FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_INT32]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableInt32(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeNullableInt32(fieldName, record.getNullableInt32(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT32]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableInt32(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfNullableInt32(fieldName, record.getArrayOfNullableInt32(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableInt32FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_INT64]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableInt64(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeNullableInt64(fieldName, record.getNullableInt64(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_INT64]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableInt64(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfNullableInt64(fieldName, record.getArrayOfNullableInt64(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableInt64FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_FLOAT32]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableFloat32(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeNullableFloat32(fieldName, record.getNullableFloat32(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_FLOAT32]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableFloat32(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfNullableFloat32(fieldName, record.getArrayOfNullableFloat32(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableFloat32FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_FLOAT64]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableFloat64(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeNullableFloat64(fieldName, record.getNullableFloat64(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                throw FieldOperations.notArrayKindException(fieldName);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.ARRAY_OF_NULLABLE_FLOAT64]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableFloat64(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                try {
                    writer.writeArrayOfNullableFloat64(fieldName, record.getArrayOfNullableFloat64(fieldName));
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableFloat64FromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
    };

    static fieldOperations(fieldKind: FieldKind): FieldKindBasedOperations {
        return FieldOperations.ALL[fieldKind];
    }
}
