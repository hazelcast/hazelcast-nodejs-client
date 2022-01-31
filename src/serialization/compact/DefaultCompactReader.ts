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
import {
    BigDecimal,
    HazelcastSerializationError, IllegalStateError,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime,
    UnsupportedOperationError
} from '../../core';
import * as Long from 'long';
import {CompactStreamSerializer} from './CompactStreamSerializer';
import {Schema} from './Schema';
import {ObjectDataInput} from '../ObjectData';
import {FieldKind} from '../generic_record/FieldKind';
import {CompactGenericRecord, CompactGenericRecordImpl, GenericRecord} from '../generic_record';
import {Field} from '../generic_record/Field';
import {
    BYTE_OFFSET_READER,
    BYTE_OFFSET_READER_RANGE,
    INT_OFFSET_READER, NULL_OFFSET,
    SHORT_OFFSET_READER,
    SHORT_OFFSET_READER_RANGE
} from './OffsetConstants';
import {BitsUtil} from '../../util/BitsUtil';
import {OffsetReader} from './OffsetRead';
import {FieldDescriptor} from '../generic_record/FieldDescriptor';
import {CompactUtil} from './CompactUtil';
import {IOUtil} from '../../util/IOUtil';

/**
 * Unserialized form of a compact object. Users do not receive this object. Instead, they receive {@link CompactGenericRecordImpl}
 * @internal
 */
export class DefaultCompactReader implements CompactReader, CompactGenericRecord {
    private readonly offsetReader: OffsetReader;
    private readonly variableOffsetsPosition: number;
    private readonly dataStartPosition: number;

    constructor(
        private readonly serializer: CompactStreamSerializer,
        private readonly input: ObjectDataInput,
        private readonly schema: Schema,
        private readonly typeName: string | null
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
            throw DefaultCompactReader.toIllegalStateException(e);
        }
    }

    private static toUnknownFieldException(fieldName: string, schema: Schema): Error {
        return new HazelcastSerializationError(`Unknown field name: '${fieldName}' for schema ${schema}`);
    }

    private static toIllegalStateException(e: Error) {
        return new IllegalStateError('IOException is not expected since we get from a well known format and position', e);
    }

    private static toUnexpectedFieldKind(fieldKind: FieldKind, fieldName: string): Error {
        return new HazelcastSerializationError(`Unknown fieldKind: '${fieldKind}' for field: ${fieldName}`);
    }

    clone(fieldsToUpdate?: { [fieldName: string]: any; }): GenericRecord {
        return new DefaultCompactReader(this.serializer, this.input, this.schema, this.typeName);
    }

    private readVariableSizeFieldPosition(fieldDescriptor: FieldDescriptor): number {
        try {
            const index = fieldDescriptor.index;
            const offset = this.offsetReader(this.input, this.variableOffsetsPosition, index);
            return offset === NULL_OFFSET ? NULL_OFFSET : offset + this.dataStartPosition;
        } catch (e) {
            throw DefaultCompactReader.toIllegalStateException(e);
        }
    }

    private readVariableSizeFieldPositionByNameAndKind(fieldName: string, fieldKind: FieldKind): number {
        try {
            const fd = this.getFieldDefinitionChecked(fieldName, fieldKind);
            const index = fd.index;
            const offset = this.offsetReader(this.input, this.variableOffsetsPosition, index);
            return offset === NULL_OFFSET ? NULL_OFFSET : offset + this.dataStartPosition;
        } catch (e) {
            throw DefaultCompactReader.toIllegalStateException(e);
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
            throw DefaultCompactReader.toIllegalStateException(e);
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
            throw DefaultCompactReader.toIllegalStateException(e);
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

            const offsetReader = DefaultCompactReader.getOffsetReader(dataLen);
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
            throw DefaultCompactReader.toIllegalStateException(e);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getFieldDefinition(fieldName: string): FieldDescriptor {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === null) {
            throw DefaultCompactReader.toUnknownFieldException(fieldName, this.schema);
        }
        return fd;
    }

    private getFieldDefinitionChecked(fieldName: string, fieldKind: FieldKind): FieldDescriptor {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd.kind !== fieldKind) {
            throw DefaultCompactReader.toUnexpectedFieldKind(fd.kind, fieldName);
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

            const offsetReader = DefaultCompactReader.getOffsetReader(dataLength);
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
            throw DefaultCompactReader.toIllegalStateException(e);
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

    getArrayOfCompact(fieldName: string): any[] {
        return this.getArrayOfVariableSizes(
            fieldName,
            FieldKind.ARRAY_OF_COMPACT,
            reader => this.serializer.read(reader)
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
            throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }


    getArrayOfBoolean(fieldName: string): boolean[] {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.ARRAY_OF_BOOLEAN:
                return this.getVariableSize(fd, DefaultCompactReader.readBooleanBits);
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                return this.getNullableArrayAsPrimitiveArray(fd, (input) => input.readBooleanArray(), 'Booleans');
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_TIME, IOUtil.readLocalTime);
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
            reader => new DefaultCompactReader(this.serializer, reader, this.schema, null).toSerialized()
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
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT8:
                return this.getVariableSize(fd, reader => reader.readByte());
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_FLOAT64:
                return this.getVariableSize(fd, reader => reader.readDouble());
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_FLOAT32:
                return this.getVariableSize(fd, reader => reader.readFloat());
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT32:
                return this.getVariableSize(fd, reader => reader.readInt());
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT64:
                return this.getVariableSize(fd, reader => reader.readLong());
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT16:
                return this.getVariableSize(fd, reader => reader.readShort());
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getArrayOfNullableBoolean(fieldName: string): (boolean | null)[] {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.ARRAY_OF_BOOLEAN:
                return this.getVariableSizeByNameAndKind(
                    fieldName, FieldKind.ARRAY_OF_BOOLEAN, DefaultCompactReader.readBooleanBits
                );
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                return this.getArrayOfVariableSizes(
                    fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN, reader => reader.readBoolean()
                );
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
            throw DefaultCompactReader.toIllegalStateException(e);
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
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
            DefaultCompactReader.toIllegalStateException(e);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT8:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readByte(), 'Byte');
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getChar(fieldName: string): string {
        throw new UnsupportedOperationError('Compact format does not support reading a char field.');
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_FLOAT64:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readDouble(), 'Double');
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_FLOAT32:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readFloat(), 'Float');
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
        }
    }

    getGenericRecord(fieldName: string): GenericRecord {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.COMPACT,
                reader => new DefaultCompactReader(this.serializer, reader, this.schema, null).toSerialized()
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT32:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readInt(), 'Int');
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT64:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readLong(), 'Long');
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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
                    throw DefaultCompactReader.toIllegalStateException(e);
                }
            case FieldKind.NULLABLE_INT16:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readShort(), 'Short');
            default:
                throw DefaultCompactReader.toUnexpectedFieldKind(fieldKind, fieldName);
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

    getCompact(fieldName: string): any {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.COMPACT, reader => this.serializer.read(reader));
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
            return this.getArrayOfCompact(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.ARRAY_OF_COMPACT)
                ? this.getArrayOfCompact(fieldName) : defaultValue;
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
            return this.getCompact(fieldName);
        } else {
            return this.isFieldExists(fieldName, FieldKind.COMPACT) ? this.getCompact(fieldName) : defaultValue;
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
