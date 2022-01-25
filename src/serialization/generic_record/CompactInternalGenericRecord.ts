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

import {
    BigDecimal,
    HazelcastSerializationError,
    IllegalArgumentError,
    IllegalStateError,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime,
    UnsupportedOperationError
} from '../../core';
import {GenericRecord, IS_GENERIC_RECORD_SYMBOL} from './GenericRecord';
import * as Long from 'long';
import {FieldKind} from './FieldKind';
import {Schema} from '../compact/Schema';
import {ObjectDataInput} from '../ObjectData';
import {OffsetReader} from '../compact/OffsetRead';
import {FieldDescriptor} from './FieldDescriptor';
import {BitsUtil} from '../../util/BitsUtil';
import {
    BYTE_OFFSET_READER,
    BYTE_OFFSET_READER_RANGE,
    INT_OFFSET_READER,
    NULL_OFFSET,
    SHORT_OFFSET_READER,
    SHORT_OFFSET_READER_RANGE
} from '../compact/OffsetConstants';
import {CompactUtil} from '../compact/CompactUtil';
import {FieldOperations} from './FieldOperations';
import {IOUtil} from '../../util/IOUtil';
import {CompactStreamSerializer} from '../compact/CompactStreamSerializer';
import {CompactGenericRecord} from './CompactGenericRecord';
import {InternalGenericRecord} from './InternalGenericRecord';
import {DefaultCompactReader} from '../compact/DefaultCompactReader';

/**
 * @internal
 */
export class CompactInternalGenericRecord implements CompactGenericRecord, InternalGenericRecord {
    protected readonly offsetReader: OffsetReader;
    protected readonly variableOffsetsPosition: number;
    protected readonly dataStartPosition: number;
    private readonly [IS_GENERIC_RECORD_SYMBOL] = true;

    constructor(
        private readonly serializer: CompactStreamSerializer,
        protected readonly input: ObjectDataInput,
        protected readonly schema: Schema,
        public readonly typeName: string | null,
        private readonly schemaIncludedInBinary: boolean
    ) {
        try {
            const numberOfVariableLengthFields = schema.numberVarSizeFields;
            let finalPosition;
            if (numberOfVariableLengthFields !== 0) {
                const dataLength = input.readInt();
                this.dataStartPosition = this.input.position();
                this.variableOffsetsPosition = this.dataStartPosition + dataLength;
                if (dataLength < BYTE_OFFSET_READER_RANGE) {
                    this.offsetReader = BYTE_OFFSET_READER;
                    finalPosition = this.variableOffsetsPosition + numberOfVariableLengthFields;
                } else if (dataLength < SHORT_OFFSET_READER_RANGE) {
                    this.offsetReader = SHORT_OFFSET_READER;
                    finalPosition = this.variableOffsetsPosition + numberOfVariableLengthFields * BitsUtil.SHORT_SIZE_IN_BYTES;
                } else {
                    this.offsetReader = INT_OFFSET_READER;
                    finalPosition = this.variableOffsetsPosition + numberOfVariableLengthFields * BitsUtil.INT_SIZE_IN_BYTES;
                }
            } else {
                this.offsetReader = INT_OFFSET_READER;
                this.variableOffsetsPosition = 0;
                this.dataStartPosition = input.position();
                finalPosition = this.dataStartPosition + schema.fixedSizeFieldsLength;
            }
            //set the position to final so that the next one to read something from `input` can start from
            //correct position
            this.input.position(finalPosition);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        }
    }

    private static toUnknownFieldException(fieldName: string, schema: Schema): Error {
        return new HazelcastSerializationError(`Unknown field name: '${fieldName}' for schema ${JSON.stringify(schema)}`);
    }

    private static toIllegalStateException(e: Error) {
        return new IllegalStateError('IOException is not expected since we get from a well known format and position', e);
    }

    private static toUnexpectedFieldKind(fieldKind: FieldKind, fieldName: string): Error {
        return new HazelcastSerializationError(`Unknown fieldKind: '${fieldKind}' for field: ${fieldName}`);
    }

    private readVariableSizeFieldPosition(fieldDescriptor: FieldDescriptor): number {
        try {
            const index = fieldDescriptor.index;
            const offset = this.offsetReader(this.input, this.variableOffsetsPosition, index);
            return offset === NULL_OFFSET ? NULL_OFFSET : offset + this.dataStartPosition;
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        }
    }

    private readVariableSizeFieldPositionByNameAndKind(fieldName: string, fieldKind: FieldKind): number {
        try {
            const fd = this.getFieldDefinition(fieldName);
            const index = fd.index;
            const offset = this.offsetReader(this.input, this.variableOffsetsPosition, index);
            return offset === NULL_OFFSET ? NULL_OFFSET : offset + this.dataStartPosition;
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        }
    }

    private getVariableSizeByNameAndKind<R>(fieldName: string, fieldKind: FieldKind, readFn: (reader: ObjectDataInput) => R): R {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPositionByNameAndKind(fieldName, fieldKind);
            if (pos === NULL_OFFSET) {
                return null;
            }
            this.input.position(pos);
            return readFn(this.input);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getVariableSize<R>(fieldDescriptor: FieldDescriptor, readFn: (reader: ObjectDataInput) => R): R | null {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPosition(fieldDescriptor);
            if (pos === NULL_OFFSET) {
                return null;
            }
            this.input.position(pos);
            return readFn(this.input);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private static getOffsetReader(dataLength: number): OffsetReader {
        if (dataLength < BYTE_OFFSET_READER_RANGE) {
            return BYTE_OFFSET_READER;
        } else if (dataLength < SHORT_OFFSET_READER_RANGE) {
            return SHORT_OFFSET_READER;
        } else {
            return INT_OFFSET_READER;
        }
    }

    private getNullableArrayAsPrimitiveArray<T>(
        fd: FieldDescriptor, readFn: (reader: ObjectDataInput) => T, methodSuffix: string
    ): T | null {
        const currentPos = this.input.position();
        try {
            const position = this.readVariableSizeFieldPosition(fd);
            if (position === BitsUtil.NULL_ARRAY_LENGTH) {
                return null;
            }
            this.input.position(position);

            const dataLen = this.input.readInt();
            const itemCount = this.input.readInt();
            const dataStartPosition = this.input.position();

            const offsetReader = CompactInternalGenericRecord.getOffsetReader(dataLen);
            const offsetsPosition = dataStartPosition + dataLen;
            for (let i = 0; i < itemCount; i++) {
                const offset = offsetReader(this.input, offsetsPosition, i);
                if (offset === BitsUtil.NULL_ARRAY_LENGTH) {
                    throw CompactUtil.toExceptionForUnexpectedNullValueInArray(fd.fieldName, methodSuffix);
                }
            }
            this.input.position(dataStartPosition - BitsUtil.INT_SIZE_IN_BYTES);
            return readFn(this.input);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getFieldDefinition(fieldName: string): FieldDescriptor {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === null) {
            throw CompactInternalGenericRecord.toUnknownFieldException(fieldName, this.schema);
        }
        return fd;
    }

    private getFieldDefinitionChecked(fieldName: string, fieldKind: FieldKind): FieldDescriptor {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd.kind !== fieldKind) {
            throw CompactInternalGenericRecord.toUnexpectedFieldKind(fd.kind, fieldName);
        }
        return fd;
    }

    private static readBooleanBits(input: ObjectDataInput): boolean[] | null {
        const len = input.readInt();
        if (len === BitsUtil.NULL_ARRAY_LENGTH) {
            return null;
        }
        if (len === 0) {
            return [];
        }
        const values = new Array<boolean>(len);
        let index = 0;
        let currentByte = input.readByte();
        for (let i = 0; i < len; i++) {
            if (index === BitsUtil.BITS_IN_A_BYTE) {
                index = 0;
                currentByte = input.readByte();
            }
            const result = ((currentByte >>> index) & 1) !== 0;
            index++;
            values[i] = result;
        }
        return values;
    }

    private readLength(beginPosition: number): number {
        try {
            return this.input.readInt(beginPosition);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        }
    }

    private static checkArrayIndexNotNegative(index: number): number {
        if (index < 0) {
            throw new IllegalArgumentError(`Array index must be non-negative: ${index}`);
        }
        return index;
    }

    private getFixedSizeFieldFromArray<T>(
        fieldName: string, fieldKind: FieldKind, readFn: (reader: ObjectDataInput) => T, index: number
    ): T | null {
        CompactInternalGenericRecord.checkArrayIndexNotNegative(index);

        const position = this.readVariableSizeFieldPositionByNameAndKind(fieldName, fieldKind);
        if (position === BitsUtil.NULL_ARRAY_LENGTH) {
            return null;
        }
        if (this.readLength(position) <= index) {
            return null;
        }

        const currentPos = this.input.position();
        try {
            const singleKind = FieldOperations.getSingleKind(fieldKind);
            const kindSize = FieldOperations.fieldOperations(singleKind).kindSizeInBytes();
            this.input.position(BitsUtil.INT_SIZE_IN_BYTES + position + index * kindSize);
            return readFn(this.input);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getVariableSizeFromArray<T>(
        fieldName: string, fieldKind: FieldKind, readFn: (reader: ObjectDataInput) => T, index: number
    ): T | null {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPositionByNameAndKind(fieldName, fieldKind);
            if (pos === NULL_OFFSET) {
                return null;
            }
            const dataLength = this.input.readInt(pos);
            const itemCount = this.input.readInt(pos + BitsUtil.INT_SIZE_IN_BYTES);

            CompactInternalGenericRecord.checkArrayIndexNotNegative(index);

            if (itemCount <= index) {
                return null;
            }

            const dataStartPosition = pos + 2 * BitsUtil.INT_SIZE_IN_BYTES;
            const offsetReader = CompactInternalGenericRecord.getOffsetReader(dataLength);
            const offsetsPosition = dataStartPosition + dataLength;
            const indexedItemOffset = offsetReader(this.input, offsetsPosition, index);
            if (indexedItemOffset === NULL_OFFSET) {
                return null;
            }
            this.input.position(indexedItemOffset + dataStartPosition);
            return readFn(this.input);
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getArrayOfVariableSizesWithFieldDescriptor<T>(
        fieldDescriptor: FieldDescriptor, readFn: (reader: ObjectDataInput) => T
    ): T[] | null {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPosition(fieldDescriptor);
            if (pos === BitsUtil.NULL_ARRAY_LENGTH) {
                return null;
            }
            this.input.position(pos);
            const dataLength = this.input.readInt();
            const itemCount = this.input.readInt();

            const dataStartPosition = this.input.position();
            const values = new Array<T>(itemCount);

            const offsetReader = CompactInternalGenericRecord.getOffsetReader(dataLength);
            const offsetsPosition = dataStartPosition + dataLength;
            for (let i = 0; i < itemCount; i++) {
                const offset = offsetReader(this.input, offsetsPosition, i);
                if (offset !== BitsUtil.NULL_ARRAY_LENGTH) {
                    this.input.position(offset + dataStartPosition);
                    values[i] = readFn(this.input);
                } else {
                    values[i] = null;
                }
            }
            return values;
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getArrayOfVariableSizes<T>(
        fieldName: string,
        fieldKind: FieldKind,
        readFn: (reader: ObjectDataInput) => T
    ): T[] {
        const fieldDefinition = this.getFieldDefinitionChecked(fieldName, fieldKind);
        return this.getArrayOfVariableSizesWithFieldDescriptor(fieldDefinition, readFn);
    }

    getBooleanFromArray(fieldName: string, index: number): boolean | null {
        const position = this.readVariableSizeFieldPositionByNameAndKind(fieldName, FieldKind.ARRAY_OF_BOOLEAN);
        if (position === NULL_OFFSET) {
            return null;
        }
        if (this.readLength(position) <= index) {
            return null;
        }

        const currentPos = this.input.position();
        try {
            const booleanOffsetInBytes = Math.trunc(index / BitsUtil.BITS_IN_A_BYTE);
            const booleanOffsetWithinLastByte = index % BitsUtil.BITS_IN_A_BYTE;
            const b = this.input.readByte(BitsUtil.INT_SIZE_IN_BYTES + position + booleanOffsetInBytes);
            return ((b >>> booleanOffsetWithinLastByte) & 1) !== 0;
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    getInt8FromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_INT8, reader => reader.readByte(), index);
    }

    getCharFromArray(fieldName: string, index: number): string {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_CHAR, reader => reader.readChar(), index);
    }

    getInt16FromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_INT16, reader => reader.readShort(), index);
    }

    getInt32FromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_INT32, reader => reader.readInt(), index);
    }

    getInt64FromArray(fieldName: string, index: number): Long {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_INT64, reader => reader.readLong(), index);
    }

    getFloat32FromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_FLOAT32, reader => reader.readFloat(), index);
    }

    getFloat64FromArray(fieldName: string, index: number): number {
        return this.getFixedSizeFieldFromArray(fieldName, FieldKind.ARRAY_OF_FLOAT64, reader => reader.readDouble(), index);
    }

    getStringFromArray(fieldName: string, index: number): string {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_STRING, reader => reader.readString(), index);
    }

    getGenericRecordFromArray(fieldName: string, index: number): GenericRecord {
        return this.getVariableSizeFromArray(
            fieldName,
            FieldKind.ARRAY_OF_COMPACT,
            reader =>
                new DefaultCompactReader(this.serializer, reader, this.schema, null, this.schemaIncludedInBinary).toSerialized(),
            index
        );
    }

    getObjectFromArray(fieldName: string, index: number): any {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_COMPACT, reader => this.serializer.read(reader, this.schemaIncludedInBinary), index
        );
    }

    getArrayOfObject(fieldName: string): any[] {
        return this.getArrayOfVariableSizes(
            fieldName,
            FieldKind.ARRAY_OF_COMPACT,
            reader => this.serializer.read(reader, this.schemaIncludedInBinary)
        );
    }

    getDecimalFromArray(fieldName: string, index: number): BigDecimal {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_DECIMAL, IOUtil.readDecimal, index);
    }

    getTimeFromArray(fieldName: string, index: number): LocalTime {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_TIME, IOUtil.readLocalTime, index);
    }

    getDateFromArray(fieldName: string, index: number): LocalDate {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_DATE, IOUtil.readLocalDate, index);
    }

    getTimestampFromArray(fieldName: string, index: number): LocalDateTime {
        return this.getVariableSizeFromArray(fieldName, FieldKind.ARRAY_OF_TIMESTAMP, IOUtil.readLocalDateTime, index);
    }

    getTimestampWithTimezoneFromArray(fieldName: string, index: number): OffsetDateTime {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE, IOUtil.readOffsetDateTime, index
        );
    }

    getNullableBooleanFromArray(fieldName: string, index: number): boolean {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN, reader => reader.readBoolean(), index
        );
    }

    getNullableInt8FromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_INT8, reader => reader.readByte(), index
        );
    }

    getNullableInt16FromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_INT16, reader => reader.readShort(), index
        );
    }

    getNullableInt32FromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_INT32, reader => reader.readInt(), index
        );
    }

    getNullableInt64FromArray(fieldName: string, index: number): Long {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_INT64, reader => reader.readLong(), index
        );
    }

    getNullableFloat32FromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT32, reader => reader.readFloat(), index
        );
    }

    getNullableFloat64FromArray(fieldName: string, index: number): number {
        return this.getVariableSizeFromArray(
            fieldName, FieldKind.ARRAY_OF_NULLABLE_FLOAT64, reader => reader.readDouble(), index
        );
    }

    protected isFieldExists(fieldName: string, kind: FieldKind): boolean {
        const field = this.schema.fieldDefinitionMap.get(fieldName);
        if (field === undefined) {
            return false;
        }
        return field.kind === kind;
    }

    private getArrayOfPrimitives<T>(
        fieldName: string,
        readFn: (reader: ObjectDataInput) => T,
        primitiveKind: FieldKind,
        nullableKind: FieldKind,
        methodSuffix: string
    ): T {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;

        if (fieldKind === primitiveKind) {
            return this.getVariableSize(fd, readFn);
        } else if (fieldKind === nullableKind) {
            return this.getNullableArrayAsPrimitiveArray(fd, readFn, methodSuffix);
        } else {
            throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }


    getArrayOfBoolean(fieldName: string): boolean[] {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.ARRAY_OF_BOOLEAN:
                return this.getVariableSize(fd, CompactInternalGenericRecord.readBooleanBits);
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                return this.getNullableArrayAsPrimitiveArray(fd, (input) => input.readBooleanArray(), 'Booleans');
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getArrayOfInt8(fieldName: string): Buffer {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readByteArray(),
            FieldKind.ARRAY_OF_INT8,
            FieldKind.ARRAY_OF_NULLABLE_INT8,
            'Bytes'
        );
    }

    getArrayOfChar(fieldName: string): string[] {
        throw new UnsupportedOperationError('Compact format does not support reading an array of chars field');
    }

    getArrayOfString(fieldName: string): string[] {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_STRING, reader => reader.readString());
    }

    getArrayOfTime(fieldName: string): LocalTime[] {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_STRING, IOUtil.readLocalTime);
    }

    getArrayOfTimestampWithTimezone(fieldName: string): OffsetDateTime[] {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE, IOUtil.readOffsetDateTime);
    }

    getArrayOfTimestamp(fieldName: string): LocalDateTime[] {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_TIMESTAMP, IOUtil.readLocalDateTime);
    }

    getArrayOfDate(fieldName: string): LocalDate[] {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_DATE, IOUtil.readLocalDate);
    }

    getArrayOfDecimal(fieldName: string): BigDecimal[] {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_DECIMAL, IOUtil.readDecimal);
    }

    getArrayOfFloat64(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readDoubleArray(),
            FieldKind.ARRAY_OF_FLOAT64,
            FieldKind.ARRAY_OF_NULLABLE_FLOAT64,
            'Doubles'
        );
    }

    getArrayOfFloat32(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readFloatArray(),
            FieldKind.ARRAY_OF_FLOAT32,
            FieldKind.ARRAY_OF_NULLABLE_FLOAT32,
            'Floats'
        );
    }

    getArrayOfInt16(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readShortArray(),
            FieldKind.ARRAY_OF_INT16,
            FieldKind.ARRAY_OF_NULLABLE_INT16,
            'Shorts'
        );
    }


    getArrayOfGenericRecord(fieldName: string): GenericRecord[] {
        return this.getArrayOfVariableSizes(
            fieldName,
            FieldKind.ARRAY_OF_COMPACT,
            reader =>
                new DefaultCompactReader(this.serializer, reader, this.schema, null, this.schemaIncludedInBinary).toSerialized()
        );
    }

    getArrayOfInt32(fieldName: string): number[] {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readIntArray(),
            FieldKind.ARRAY_OF_INT32,
            FieldKind.ARRAY_OF_NULLABLE_INT32,
            'Ints'
        );
    }

    getArrayOfInt64(fieldName: string): Long[] {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readLongArray(),
            FieldKind.ARRAY_OF_INT64,
            FieldKind.ARRAY_OF_NULLABLE_INT64,
            'Longs'
        );
    }

    readFixedSizePosition(fd: FieldDescriptor) {
        const primitiveOffset = fd.offset;
        return primitiveOffset + this.dataStartPosition;
    }

    getNullableBoolean(fieldName: string): boolean | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.BOOLEAN:
                return this.getBoolean(fieldName);
            case FieldKind.NULLABLE_BOOLEAN:
                return this.getVariableSize(fd, reader => reader.readBoolean());
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getNullableInt8(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT8:
                try {
                    return this.input.readByte(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT8:
                return this.getVariableSize(fd, reader => reader.readByte());
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getNullableFloat64(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.FLOAT64:
                try {
                    return this.input.readDouble(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_FLOAT64:
                return this.getVariableSize(fd, reader => reader.readDouble());
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getNullableFloat32(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.FLOAT32:
                try {
                    return this.input.readFloat(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_FLOAT32:
                return this.getVariableSize(fd, reader => reader.readFloat());
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getNullableInt32(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT32:
                try {
                    return this.input.readInt(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT32:
                return this.getVariableSize(fd, reader => reader.readInt());
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getNullableInt64(fieldName: string): Long | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT64:
                try {
                    return this.input.readLong(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT64:
                return this.getVariableSize(fd, reader => reader.readLong());
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getNullableInt16(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT16:
                try {
                    return this.input.readShort(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT16:
                return this.getVariableSize(fd, reader => reader.readShort());
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getArrayOfNullableBoolean(fieldName: string): (boolean | null)[] {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.ARRAY_OF_BOOLEAN:
                return this.getVariableSizeByNameAndKind(
                    fieldName, FieldKind.ARRAY_OF_BOOLEAN, CompactInternalGenericRecord.readBooleanBits
                );
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                return this.getArrayOfVariableSizes(
                    fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN, reader => reader.readBoolean()
                );
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    private getPrimitiveArrayAsNullableArray<T>(
        fieldDescriptor: FieldDescriptor, readFn: (reader: ObjectDataInput) => T
    ): T[] | null {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPosition(fieldDescriptor);
            if (pos === NULL_OFFSET) {
                return null;
            }
            this.input.position(pos);
            const itemCount = this.input.readInt();
            const values = new Array<T>(itemCount);

            for (let i = 0; i < itemCount; i++) {
                values[i] = readFn(this.input);
            }

            return values;
        } catch (e) {
            throw CompactInternalGenericRecord.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getArrayOfNullables<T>(
        fieldName: string, readFn: (reader: ObjectDataInput) => T, primitiveKind: FieldKind, nullableField: FieldKind
    ): T[] {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case primitiveKind:
                return this.getPrimitiveArrayAsNullableArray(fd, readFn);
            case nullableField:
                return this.getArrayOfVariableSizesWithFieldDescriptor(fd, readFn);
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getArrayOfNullableInt8(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readByte(), FieldKind.ARRAY_OF_INT8, FieldKind.ARRAY_OF_NULLABLE_INT8
        );
    }

    getArrayOfNullableFloat64(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readDouble(), FieldKind.ARRAY_OF_FLOAT64, FieldKind.ARRAY_OF_NULLABLE_FLOAT64
        );
    }

    getArrayOfNullableFloat32(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readFloat(), FieldKind.ARRAY_OF_FLOAT32, FieldKind.ARRAY_OF_NULLABLE_FLOAT32
        );
    }

    getArrayOfNullableInt32(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readInt(), FieldKind.ARRAY_OF_INT32, FieldKind.ARRAY_OF_NULLABLE_INT32
        );
    }

    getArrayOfNullableInt64(fieldName: string): (Long | null)[] {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readLong(), FieldKind.ARRAY_OF_INT64, FieldKind.ARRAY_OF_NULLABLE_INT64
        );
    }

    getArrayOfNullableInt16(fieldName: string): (number | null)[] {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readShort(), FieldKind.ARRAY_OF_INT16, FieldKind.ARRAY_OF_NULLABLE_INT16
        );
    }

    getBoolean(fieldName: string): boolean {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.BOOLEAN:
                return this.getBooleanWithFieldDescriptor(fd);
            case FieldKind.NULLABLE_BOOLEAN:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readBoolean(), 'Boolean');
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    private getVariableSizeAsNonNull<T>(
        fieldDescriptor: FieldDescriptor, readFn: (reader: ObjectDataInput) => T, methodSuffix: string): T {
        const value = this.getVariableSize(fieldDescriptor, readFn);
        if (value === null) {
            throw CompactUtil.toExceptionForUnexpectedNullValue(fieldDescriptor.fieldName, methodSuffix);
        }
        return value;
    }

    private getBooleanWithFieldDescriptor(fieldDescriptor: FieldDescriptor): boolean {
        try {
            const booleanOffset = fieldDescriptor.offset;
            const bitOffset = fieldDescriptor.bitOffset;
            const getOffset = booleanOffset + this.dataStartPosition;
            const lastByte = this.input.readByte(getOffset);
            return ((lastByte >>> bitOffset) & 1) !== 0;
        } catch (e) {
            CompactInternalGenericRecord.toIllegalStateException(e);
        }
    }

    getInt8(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT8:
                try {
                    return this.input.readByte(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT8:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readByte(), 'Byte');
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getChar(fieldName: string): string {
        throw new UnsupportedOperationError('Compact format does not support reading a char field.');
    }

    protected getClassIdentifier(): string {
        return this.schema.typeName;
    }

    getDate(fieldName: string): LocalDate {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.DATE, IOUtil.readLocalDate);
    }

    getDecimal(fieldName: string): BigDecimal {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.DECIMAL, IOUtil.readDecimal);
    }

    getFloat64(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.FLOAT64:
                try {
                    return this.input.readDouble(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_FLOAT64:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readDouble(), 'Double');
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getFieldKind(fieldName: string): FieldKind {
        if (!this.schema.fieldDefinitionMap.has(fieldName)) {
            throw new RangeError(`There is no field with name ${fieldName} in this record`);
        }
        return this.schema.fieldDefinitionMap.get(fieldName).kind;
    }

    getFieldNames(): Set<string> {
        return new Set(this.schema.fieldDefinitionMap.keys());
    }

    getFloat32(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.FLOAT32:
                try {
                    return this.input.readFloat(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_FLOAT32:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readFloat(), 'Float');
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getGenericRecord(fieldName: string): GenericRecord {
        return this.getVariableSizeByNameAndKind(
            fieldName, FieldKind.COMPACT, reader =>
                new DefaultCompactReader(this.serializer, reader, this.schema, null, this.schemaIncludedInBinary).toSerialized()
        );
    }

    getInt32(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT32:
                try {
                    return this.input.readInt(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT32:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readInt(), 'Int');
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getInt64(fieldName: string): Long {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT64:
                try {
                    return this.input.readLong(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT64:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readLong(), 'Long');
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getSchema(): Schema {
        return this.schema;
    }

    getInt16(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT16:
                try {
                    return this.input.readShort(this.readFixedSizePosition(fd));
                } catch (e) {
                    throw CompactInternalGenericRecord.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT16:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readShort(), 'Short');
            default:
                throw CompactInternalGenericRecord.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getString(fieldName: string): string {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.STRING, reader => reader.readString());
    }

    getTime(fieldName: string): LocalTime {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.TIME, IOUtil.readLocalTime);
    }

    getTimestamp(fieldName: string): LocalDateTime {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.TIMESTAMP, IOUtil.readLocalDateTime);
    }

    getTimestampWithTimezone(fieldName: string): OffsetDateTime {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.TIMESTAMP_WITH_TIMEZONE, IOUtil.readOffsetDateTime);
    }

    hasField(fieldName: string): boolean {
        return this.schema.fieldDefinitionMap.has(fieldName);
    }

    getObject(fieldName: string): any {
        return this.getVariableSizeByNameAndKind(
            fieldName, FieldKind.COMPACT, reader => this.serializer.read(reader, this.schemaIncludedInBinary)
        );
    }
}
