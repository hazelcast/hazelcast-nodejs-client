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

import {CompactReader} from './CompactReader';
import {
    BigDecimal,
    HazelcastSerializationError,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime,
} from '../../core';
import * as Long from 'long';
import {CompactStreamSerializer} from './CompactStreamSerializer';
import {Schema} from './Schema';
import {ObjectDataInput} from '../ObjectData';
import {FieldKind} from '../generic_record/FieldKind';
import {CompactGenericRecordImpl} from '../generic_record';
import {Field} from '../generic_record/Fields';
import {
    BYTE_OFFSET_READER,
    BYTE_OFFSET_READER_RANGE,
    INT_OFFSET_READER, NULL_OFFSET,
    SHORT_OFFSET_READER,
    SHORT_OFFSET_READER_RANGE
} from './OffsetConstants';
import {BitsUtil} from '../../util/BitsUtil';
import {OffsetReader} from './OffsetReader';
import {FieldDescriptor} from '../generic_record/FieldDescriptor';
import {CompactExceptions} from './CompactUtil';
import {IOUtil} from '../../util/IOUtil';
import {FieldOperations} from '../generic_record/FieldOperations';

/**
 * Represents unserialized form of a compact object. Users do not receive this object.
 * Instead, they receive {@link CompactGenericRecordImpl}
 *
 * @internal
 */
export class DefaultCompactReader implements CompactReader {
    private readonly offsetReader: OffsetReader;
    private readonly variableOffsetsPosition: number;
    private readonly dataStartPosition: number;

    constructor(
        private readonly serializer: CompactStreamSerializer,
        private readonly input: ObjectDataInput,
        private readonly schema: Schema,
    ) {
        const numberOfVariableLengthFields = schema.numberVarSizeFields;
        let finalPosition: number;
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
    }

    getFieldKind(fieldName: string): FieldKind {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === undefined) {
            return FieldKind.NOT_AVAILABLE;
        }
        return fd.kind;
    }

    readBoolean(fieldName: string): boolean {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.BOOLEAN:
                return this.getBooleanWithFieldDescriptor(fd);
            case FieldKind.NULLABLE_BOOLEAN:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readBoolean(), 'Boolean');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.BOOLEAN, FieldKind.NULLABLE_BOOLEAN]
                );
        }
    }

    readInt8(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT8:
                return this.input.readInt8(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_INT8:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readInt8(), 'Int8');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.INT8, FieldKind.NULLABLE_INT8]
                );
        }
    }

    readInt16(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT16:
                return this.input.readShort(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_INT16:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readShort(), 'Int16');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.INT16, FieldKind.NULLABLE_INT16]
                );
        }
    }

    readInt32(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT32:
                return this.input.readInt(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_INT32:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readInt(), 'Int32');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.INT32, FieldKind.NULLABLE_INT32]
                );
        }
    }

    readInt64(fieldName: string): Long {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT64:
                return this.input.readLong(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_INT64:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readLong(), 'Int64');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.INT64, FieldKind.NULLABLE_INT64]
                );
        }
    }

    readFloat32(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.FLOAT32:
                return this.input.readFloat(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_FLOAT32:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readFloat(), 'Float32');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.FLOAT32, FieldKind.NULLABLE_FLOAT32]
                );
        }
    }

    readFloat64(fieldName: string): number {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.FLOAT64:
                return this.input.readDouble(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_FLOAT64:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readDouble(), 'Float64');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.FLOAT64, FieldKind.NULLABLE_FLOAT64]
                );
        }
    }

    readString(fieldName: string): string | null {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.STRING, reader => reader.readString());
    }

    readDecimal(fieldName: string): BigDecimal | null {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.DECIMAL, IOUtil.readDecimal);
    }

    readTime(fieldName: string): LocalTime | null {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.TIME, IOUtil.readLocalTime);
    }

    readDate(fieldName: string): LocalDate | null {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.DATE, IOUtil.readLocalDate);
    }

    readTimestamp(fieldName: string): LocalDateTime | null {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.TIMESTAMP, IOUtil.readLocalDateTime);
    }

    readTimestampWithTimezone(fieldName: string): OffsetDateTime | null {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.TIMESTAMP_WITH_TIMEZONE, IOUtil.readOffsetDateTime);
    }

    readCompact<T>(fieldName: string): T | null {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind.COMPACT, reader => this.serializer.read(reader));
    }

    readArrayOfBoolean(fieldName: string): boolean[] | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.ARRAY_OF_BOOLEAN:
                return this.getVariableSize(fd, DefaultCompactReader.readBooleanBits);
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                return this.getNullableArrayAsPrimitiveArray(fd, (input) => input.readBooleanArray(), 'ArrayOfBoolean');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.ARRAY_OF_BOOLEAN, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]
                );
        }
    }

    readArrayOfInt8(fieldName: string): Buffer | null {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readByteArray(),
            FieldKind.ARRAY_OF_INT8,
            FieldKind.ARRAY_OF_NULLABLE_INT8,
            'ArrayOfInt8'
        );
    }

    readArrayOfInt16(fieldName: string): number[] | null {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readShortArray(),
            FieldKind.ARRAY_OF_INT16,
            FieldKind.ARRAY_OF_NULLABLE_INT16,
            'ArrayOfInt16'
        );
    }

    readArrayOfInt32(fieldName: string): number[] | null {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readIntArray(),
            FieldKind.ARRAY_OF_INT32,
            FieldKind.ARRAY_OF_NULLABLE_INT32,
            'ArrayOfInt32'
        );
    }

    readArrayOfInt64(fieldName: string): Long[] | null {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readLongArray(),
            FieldKind.ARRAY_OF_INT64,
            FieldKind.ARRAY_OF_NULLABLE_INT64,
            'ArrayOfInt64'
        );
    }

    readArrayOfFloat32(fieldName: string): number[] | null {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readFloatArray(),
            FieldKind.ARRAY_OF_FLOAT32,
            FieldKind.ARRAY_OF_NULLABLE_FLOAT32,
            'ArrayOfFloat32'
        );
    }

    readArrayOfFloat64(fieldName: string): number[] | null {
        return this.getArrayOfPrimitives(
            fieldName,
            reader => reader.readDoubleArray(),
            FieldKind.ARRAY_OF_FLOAT64,
            FieldKind.ARRAY_OF_NULLABLE_FLOAT64,
            'ArrayOfFloat64'
        );
    }

    readArrayOfString(fieldName: string): (string | null)[] | null {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_STRING, reader => reader.readString());
    }

    readArrayOfDecimal(fieldName: string): (BigDecimal | null)[] | null {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_DECIMAL, IOUtil.readDecimal);
    }

    readArrayOfTime(fieldName: string): (LocalTime | null)[] | null {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_TIME, IOUtil.readLocalTime);
    }

    readArrayOfDate(fieldName: string): (LocalDate | null)[] | null {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_DATE, IOUtil.readLocalDate);
    }

    readArrayOfTimestamp(fieldName: string): (LocalDateTime | null)[] | null {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_TIMESTAMP, IOUtil.readLocalDateTime);
    }

    readArrayOfTimestampWithTimezone(fieldName: string): (OffsetDateTime | null)[] | null {
        return this.getArrayOfVariableSizes(fieldName, FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE, IOUtil.readOffsetDateTime);
    }

    readArrayOfCompact<T>(fieldName: string): (T | null)[] | null {
        return this.getArrayOfVariableSizes(
            fieldName,
            FieldKind.ARRAY_OF_COMPACT,
            reader => this.serializer.read(reader)
        );
    }

    readNullableBoolean(fieldName: string): boolean | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.BOOLEAN:
                return this.readBoolean(fieldName);
            case FieldKind.NULLABLE_BOOLEAN:
                return this.getVariableSize(fd, reader => reader.readBoolean());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.BOOLEAN, FieldKind.NULLABLE_BOOLEAN]
                );
        }
    }

    readNullableInt8(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT8:
                return this.input.readInt8(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_INT8:
                return this.getVariableSize(fd, reader => reader.readInt8());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.INT8, FieldKind.NULLABLE_INT8]
                );
        }
    }

    readNullableInt16(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT16:
                return this.input.readShort(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_INT16:
                return this.getVariableSize(fd, reader => reader.readShort());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.INT16, FieldKind.NULLABLE_INT16]
                );
        }
    }

    readNullableInt32(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT32:
                return this.input.readInt(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_INT32:
                return this.getVariableSize(fd, reader => reader.readInt());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.INT32, FieldKind.NULLABLE_INT32]
                );
        }
    }

    readNullableInt64(fieldName: string): Long | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.INT64:
                return this.input.readLong(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_INT64:
                return this.getVariableSize(fd, reader => reader.readLong());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.INT64, FieldKind.NULLABLE_INT64]
                );
        }
    }

    readNullableFloat32(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.FLOAT32:
                return this.input.readFloat(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_FLOAT32:
                return this.getVariableSize(fd, reader => reader.readFloat());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.FLOAT32, FieldKind.NULLABLE_FLOAT32]
                );
        }
    }

    readNullableFloat64(fieldName: string): number | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.FLOAT64:
                return this.input.readDouble(this.readFixedSizePosition(fd));
            case FieldKind.NULLABLE_FLOAT64:
                return this.getVariableSize(fd, reader => reader.readDouble());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.FLOAT64, FieldKind.NULLABLE_FLOAT64]
                );
        }
    }

    readArrayOfNullableBoolean(fieldName: string): (boolean | null)[] | null {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind.ARRAY_OF_BOOLEAN:
                return this.getVariableSize(fd, DefaultCompactReader.readBooleanBits);
            case FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                return this.getArrayOfVariableSizes(
                    fieldName, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN, reader => reader.readBoolean()
                );
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [FieldKind.ARRAY_OF_BOOLEAN, FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]
                );
        }
    }

    readArrayOfNullableInt8(fieldName: string): (number | null)[] | null {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readInt8(), FieldKind.ARRAY_OF_INT8, FieldKind.ARRAY_OF_NULLABLE_INT8
        );
    }

    readArrayOfNullableInt16(fieldName: string): (number | null)[] | null {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readShort(), FieldKind.ARRAY_OF_INT16, FieldKind.ARRAY_OF_NULLABLE_INT16
        );
    }

    readArrayOfNullableInt32(fieldName: string): (number | null)[] | null {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readInt(), FieldKind.ARRAY_OF_INT32, FieldKind.ARRAY_OF_NULLABLE_INT32
        );
    }

    readArrayOfNullableInt64(fieldName: string): (Long | null)[] | null {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readLong(), FieldKind.ARRAY_OF_INT64, FieldKind.ARRAY_OF_NULLABLE_INT64
        );
    }

    readArrayOfNullableFloat32(fieldName: string): (number | null)[] | null {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readFloat(), FieldKind.ARRAY_OF_FLOAT32, FieldKind.ARRAY_OF_NULLABLE_FLOAT32
        );
    }

    readArrayOfNullableFloat64(fieldName: string): (number | null)[] | null {
        return this.getArrayOfNullables(
            fieldName, reader => reader.readDouble(), FieldKind.ARRAY_OF_FLOAT64, FieldKind.ARRAY_OF_NULLABLE_FLOAT64
        );
    }

    readFixedSizePosition(fd: FieldDescriptor) {
        const primitiveOffset = fd.offset;
        return primitiveOffset + this.dataStartPosition;
    }

    toDeserialized(): CompactGenericRecordImpl {
        const fields: {[name: string]: Field<any>} = {};
        const values: {[name: string]: any} = {};

        for (const field of this.schema.fields) {
            fields[field.fieldName] = field;
            values[field.fieldName] = FieldOperations.fieldOperations(field.kind).readFromReader(this, field.fieldName);
        }
        return new CompactGenericRecordImpl(this.schema.typeName, fields, values, this.schema);
    }

    private getVariableSizeAsNonNull<T>(
        fieldDescriptor: FieldDescriptor, readFn: (reader: ObjectDataInput) => T, methodSuffix: string): T {
        const value = this.getVariableSize(fieldDescriptor, readFn);
        if (value === null) {
            throw CompactExceptions.toExceptionForUnexpectedNullValue(fieldDescriptor.fieldName, methodSuffix);
        }
        return value;
    }

    private getBooleanWithFieldDescriptor(fieldDescriptor: FieldDescriptor): boolean {
        const booleanOffset = fieldDescriptor.offset;
        const bitOffset = fieldDescriptor.bitOffset;
        const getOffset = booleanOffset + this.dataStartPosition;
        const lastByte = this.input.readByte(getOffset);
        return ((lastByte >>> bitOffset) & 1) !== 0;
    }

    private readVariableSizeFieldPosition(fieldDescriptor: FieldDescriptor): number {
        const index = fieldDescriptor.index;
        const offset = this.offsetReader(this.input, this.variableOffsetsPosition, index);
        return offset === NULL_OFFSET ? NULL_OFFSET : offset + this.dataStartPosition;
    }

    private getVariableSizeByNameAndKind<R>(fieldName: string, fieldKind: FieldKind, readFn: (reader: ObjectDataInput) => R): R {
        const fd = this.getFieldDefinitionChecked(fieldName, fieldKind);
        return this.getVariableSize(fd, readFn);
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
        } finally {
            this.input.position(currentPos);
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
                    throw CompactExceptions.toExceptionForUnexpectedNullValueInArray(fd.fieldName, methodSuffix);
                }
            }
            this.input.position(dataStartPosition - BitsUtil.INT_SIZE_IN_BYTES);
            return readFn(this.input);
        } finally {
            this.input.position(currentPos);
        }
    }

    private getFieldDefinition(fieldName: string): FieldDescriptor {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === undefined) {
            throw DefaultCompactReader.toUnknownFieldError(fieldName, this.schema);
        }
        return fd;
    }

    private getFieldDefinitionChecked(fieldName: string, fieldKind: FieldKind): FieldDescriptor {
        const fd = this.getFieldDefinition(fieldName);
        if (fd.kind !== fieldKind) {
            throw DefaultCompactReader.toUnexpectedFieldKindError(fieldKind, fd.kind, fieldName);
        }
        return fd;
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

    private isFieldExists(fieldName: string, kind: FieldKind): boolean {
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
            throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [primitiveKind, nullableKind]);
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
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(
                    fieldKind, fieldName, [primitiveKind, nullableField]
                );
        }
    }

    private static toUnknownFieldError(fieldName: string, schema: Schema): Error {
        return new HazelcastSerializationError(
            `No field with the name '${fieldName}' in compact schema ${JSON.stringify(schema.fieldDefinitionMap)}`
        );
    }

    private static toUnexpectedFieldKindError(usedFieldKind: FieldKind, actualFieldKind: FieldKind, fieldName: string): Error {
        const usedFieldKindName = FieldKind[usedFieldKind];
        const actualFieldKindName = FieldKind[actualFieldKind];
        return new HazelcastSerializationError('Mismatched field kinds while reading a compact field: '
        + `Requested field kind for ${fieldName} is ${usedFieldKindName} but the field's actual type is ${actualFieldKindName}`);
    }

    private static toFieldKindIsNotOneOfError(
        actualFieldKind: FieldKind, fieldName: string, expectedFieldKinds: FieldKind[]
    ): Error {
        const expectedFieldKindNames = expectedFieldKinds.map((fieldKind: FieldKind) => FieldKind[fieldKind]).join(', ');
        const actualFieldKindName = FieldKind[actualFieldKind];
        return new HazelcastSerializationError(
            `The kind of field ${fieldName} must be one of ${expectedFieldKindNames} but it is ${actualFieldKindName}`
        );
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

    private static readBooleanBits(input: ObjectDataInput): boolean[] | null {
        const len = input.readInt();
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
}
