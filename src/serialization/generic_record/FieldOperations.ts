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
                writer.writeBoolean(fieldName, record.getBoolean(fieldName));
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
        [FieldKind.ARRAY_OF_BOOLEANS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfBooleans(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfBooleans(fieldName, record.getArrayOfBooleans(fieldName));
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
        [FieldKind.BYTE]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getByte(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeByte(fieldName, record.getByte(fieldName));
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
        [FieldKind.ARRAY_OF_BYTES]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfBytes(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfBytes(fieldName, record.getArrayOfBytes(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getByteFromArray(fieldName, index);
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
                throw new UnsupportedOperationError('Compact format does not support writing a char field');
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
        [FieldKind.ARRAY_OF_CHARS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfChars(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                throw new UnsupportedOperationError('Compact format does not support writing an array of chars field');
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
        [FieldKind.SHORT]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getShort(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeShort(fieldName, record.getShort(fieldName));
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
        [FieldKind.ARRAY_OF_SHORTS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfShorts(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfShorts(fieldName, record.getArrayOfShorts(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getShortFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.INT]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getInt(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeInt(fieldName, record.getInt(fieldName));
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
        [FieldKind.ARRAY_OF_INTS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfInts(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfInts(fieldName, record.getArrayOfInts(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getIntFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.LONG]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getLong(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeLong(fieldName, record.getLong(fieldName));
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
        [FieldKind.ARRAY_OF_LONGS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfLongs(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfLongs(fieldName, record.getArrayOfLongs(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getLongFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.FLOAT]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getFloat(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeFloat(fieldName, record.getFloat(fieldName));
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
        [FieldKind.ARRAY_OF_FLOATS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfFloats(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfFloats(fieldName, record.getArrayOfFloats(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getFloatFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.DOUBLE]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getDouble(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeDouble(fieldName, record.getDouble(fieldName));
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
        [FieldKind.ARRAY_OF_DOUBLES]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfDoubles(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfDoubles(fieldName, record.getArrayOfDoubles(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getDoubleFromArray(fieldName, index);
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
                writer.writeString(fieldName, record.getString(fieldName));
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
        [FieldKind.ARRAY_OF_STRINGS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfStrings(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfStrings(fieldName, record.getArrayOfStrings(fieldName));
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
                writer.writeDecimal(fieldName, record.getDecimal(fieldName));
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
        [FieldKind.ARRAY_OF_DECIMALS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfDecimals(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfDecimals(fieldName, record.getArrayOfDecimals(fieldName));
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
                writer.writeTime(fieldName, record.getTime(fieldName));
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
        [FieldKind.ARRAY_OF_TIMES]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfTimes(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfTimes(fieldName, record.getArrayOfTimes(fieldName));
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
                writer.writeDate(fieldName, record.getDate(fieldName));
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
        [FieldKind.ARRAY_OF_DATES]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfDates(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfDates(fieldName, record.getArrayOfDates(fieldName));
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
                writer.writeTimestamp(fieldName, record.getTimestamp(fieldName));
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
        [FieldKind.ARRAY_OF_TIMESTAMPS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfTimestamps(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfTimestamps(fieldName, record.getArrayOfTimestamps(fieldName));
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
                writer.writeTimestampWithTimezone(fieldName, record.getTimestampWithTimezone(fieldName));
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
        [FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONES]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfTimestampWithTimezones(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfTimestampWithTimezones(fieldName, record.getArrayOfTimestampWithTimezones(fieldName));
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
                writer.writeGenericRecord(fieldName, record.getGenericRecord(fieldName));
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
        [FieldKind.ARRAY_OF_COMPACTS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return (record as InternalGenericRecord).getArrayOfObjects(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfGenericRecords(fieldName, record.getArrayOfGenericRecords(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getObjectFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return record.getArrayOfGenericRecords(fieldName);
            }
        },
        [FieldKind.NULLABLE_BOOLEAN]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableBoolean(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableBoolean(fieldName, record.getNullableBoolean(fieldName));
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
        [FieldKind.ARRAY_OF_NULLABLE_BOOLEANS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableBooleans(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableBooleans(fieldName, record.getArrayOfNullableBooleans(fieldName));
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
        [FieldKind.NULLABLE_BYTE]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableByte(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableByte(fieldName, record.getNullableByte(fieldName));
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
        [FieldKind.ARRAY_OF_NULLABLE_BYTES]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableBytes(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableBytes(fieldName, record.getArrayOfNullableBytes(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableByteFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_SHORT]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableShort(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableShort(fieldName, record.getNullableShort(fieldName));
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
        [FieldKind.ARRAY_OF_NULLABLE_SHORTS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableShorts(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableShorts(fieldName, record.getArrayOfNullableShorts(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableShortFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_INT]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableInt(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableInt(fieldName, record.getNullableInt(fieldName));
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
        [FieldKind.ARRAY_OF_NULLABLE_INTS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableInts(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableInts(fieldName, record.getArrayOfNullableInts(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableIntFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_LONG]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableLong(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableLong(fieldName, record.getNullableLong(fieldName));
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
        [FieldKind.ARRAY_OF_NULLABLE_LONGS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableLongs(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableLongs(fieldName, record.getArrayOfNullableLongs(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableLongFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_FLOAT]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableFloat(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableFloat(fieldName, record.getNullableFloat(fieldName));
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
        [FieldKind.ARRAY_OF_NULLABLE_FLOATS]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableFloats(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableFloats(fieldName, record.getArrayOfNullableFloats(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableFloatFromArray(fieldName, index);
            },
            readGenericRecordOrPrimitive(record: GenericRecord, fieldName: string): any {
                return this.readObject(record, fieldName);
            }
        },
        [FieldKind.NULLABLE_DOUBLE]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getNullableDouble(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeNullableDouble(fieldName, record.getNullableDouble(fieldName));
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
        [FieldKind.ARRAY_OF_NULLABLE_DOUBLES]: {
            readObject(record: GenericRecord, fieldName: string) {
                return record.getArrayOfNullableDoubles(fieldName);
            },
            writeFieldFromRecordToWriter(writer: DefaultCompactWriter, record: GenericRecord, fieldName: string) {
                writer.writeArrayOfNullableDoubles(fieldName, record.getArrayOfNullableDoubles(fieldName));
            },
            kindSizeInBytes(): number {
                return FieldOperations.VARIABLE_SIZE;
            },
            readIndexed(record: InternalGenericRecord, fieldName: string, index: number): any {
                return record.getNullableDoubleFromArray(fieldName, index);
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
