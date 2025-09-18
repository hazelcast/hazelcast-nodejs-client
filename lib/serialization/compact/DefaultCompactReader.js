"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultCompactReader = void 0;
const core_1 = require("../../core");
const FieldKind_1 = require("../generic_record/FieldKind");
const generic_record_1 = require("../generic_record");
const OffsetConstants_1 = require("./OffsetConstants");
const BitsUtil_1 = require("../../util/BitsUtil");
const CompactUtil_1 = require("./CompactUtil");
const IOUtil_1 = require("../../util/IOUtil");
const FieldOperations_1 = require("../generic_record/FieldOperations");
/**
 * Represents unserialized form of a compact object. Users do not receive this object.
 * Instead, they receive {@link CompactGenericRecordImpl}
 *
 * @internal
 */
class DefaultCompactReader {
    constructor(serializer, input, schema) {
        this.serializer = serializer;
        this.input = input;
        this.schema = schema;
        const numberOfVariableLengthFields = schema.numberVarSizeFields;
        let finalPosition;
        if (numberOfVariableLengthFields !== 0) {
            const dataLength = input.readInt();
            this.dataStartPosition = this.input.position();
            this.variableOffsetsPosition = this.dataStartPosition + dataLength;
            if (dataLength < OffsetConstants_1.BYTE_OFFSET_READER_RANGE) {
                this.offsetReader = OffsetConstants_1.BYTE_OFFSET_READER;
                finalPosition = this.variableOffsetsPosition + numberOfVariableLengthFields;
            }
            else if (dataLength < OffsetConstants_1.SHORT_OFFSET_READER_RANGE) {
                this.offsetReader = OffsetConstants_1.SHORT_OFFSET_READER;
                finalPosition = this.variableOffsetsPosition + numberOfVariableLengthFields * BitsUtil_1.BitsUtil.SHORT_SIZE_IN_BYTES;
            }
            else {
                this.offsetReader = OffsetConstants_1.INT_OFFSET_READER;
                finalPosition = this.variableOffsetsPosition + numberOfVariableLengthFields * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
            }
        }
        else {
            this.offsetReader = OffsetConstants_1.INT_OFFSET_READER;
            this.variableOffsetsPosition = 0;
            this.dataStartPosition = input.position();
            finalPosition = this.dataStartPosition + schema.fixedSizeFieldsLength;
        }
        //set the position to final so that the next one to read something from `input` can start from
        //correct position
        this.input.position(finalPosition);
    }
    getFieldKind(fieldName) {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === undefined) {
            return FieldKind_1.FieldKind.NOT_AVAILABLE;
        }
        return fd.kind;
    }
    readBoolean(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.BOOLEAN:
                return this.getBooleanWithFieldDescriptor(fd);
            case FieldKind_1.FieldKind.NULLABLE_BOOLEAN:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readBoolean(), 'Boolean');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.BOOLEAN, FieldKind_1.FieldKind.NULLABLE_BOOLEAN]);
        }
    }
    readInt8(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.INT8:
                return this.input.readInt8(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_INT8:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readInt8(), 'Int8');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.INT8, FieldKind_1.FieldKind.NULLABLE_INT8]);
        }
    }
    readInt16(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.INT16:
                return this.input.readShort(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_INT16:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readShort(), 'Int16');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.INT16, FieldKind_1.FieldKind.NULLABLE_INT16]);
        }
    }
    readInt32(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.INT32:
                return this.input.readInt(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_INT32:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readInt(), 'Int32');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.INT32, FieldKind_1.FieldKind.NULLABLE_INT32]);
        }
    }
    readInt64(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.INT64:
                return this.input.readLong(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_INT64:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readLong(), 'Int64');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.INT64, FieldKind_1.FieldKind.NULLABLE_INT64]);
        }
    }
    readFloat32(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.FLOAT32:
                return this.input.readFloat(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_FLOAT32:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readFloat(), 'Float32');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.FLOAT32, FieldKind_1.FieldKind.NULLABLE_FLOAT32]);
        }
    }
    readFloat64(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.FLOAT64:
                return this.input.readDouble(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_FLOAT64:
                return this.getVariableSizeAsNonNull(fd, reader => reader.readDouble(), 'Float64');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.FLOAT64, FieldKind_1.FieldKind.NULLABLE_FLOAT64]);
        }
    }
    readString(fieldName) {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind_1.FieldKind.STRING, reader => reader.readString());
    }
    readDecimal(fieldName) {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind_1.FieldKind.DECIMAL, IOUtil_1.IOUtil.readDecimal);
    }
    readTime(fieldName) {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind_1.FieldKind.TIME, IOUtil_1.IOUtil.readLocalTime);
    }
    readDate(fieldName) {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind_1.FieldKind.DATE, IOUtil_1.IOUtil.readLocalDate);
    }
    readTimestamp(fieldName) {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind_1.FieldKind.TIMESTAMP, IOUtil_1.IOUtil.readLocalDateTime);
    }
    readTimestampWithTimezone(fieldName) {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind_1.FieldKind.TIMESTAMP_WITH_TIMEZONE, IOUtil_1.IOUtil.readOffsetDateTime);
    }
    readCompact(fieldName) {
        return this.getVariableSizeByNameAndKind(fieldName, FieldKind_1.FieldKind.COMPACT, reader => this.serializer.read(reader));
    }
    readArrayOfBoolean(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN:
                return this.getVariableSize(fd, DefaultCompactReader.readBooleanBits);
            case FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                return this.getNullableArrayAsPrimitiveArray(fd, (input) => input.readBooleanArray(), 'ArrayOfBoolean');
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]);
        }
    }
    readArrayOfInt8(fieldName) {
        return this.getArrayOfPrimitives(fieldName, reader => reader.readByteArray(), FieldKind_1.FieldKind.ARRAY_OF_INT8, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT8, 'ArrayOfInt8');
    }
    readArrayOfInt16(fieldName) {
        return this.getArrayOfPrimitives(fieldName, reader => reader.readShortArray(), FieldKind_1.FieldKind.ARRAY_OF_INT16, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT16, 'ArrayOfInt16');
    }
    readArrayOfInt32(fieldName) {
        return this.getArrayOfPrimitives(fieldName, reader => reader.readIntArray(), FieldKind_1.FieldKind.ARRAY_OF_INT32, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT32, 'ArrayOfInt32');
    }
    readArrayOfInt64(fieldName) {
        return this.getArrayOfPrimitives(fieldName, reader => reader.readLongArray(), FieldKind_1.FieldKind.ARRAY_OF_INT64, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT64, 'ArrayOfInt64');
    }
    readArrayOfFloat32(fieldName) {
        return this.getArrayOfPrimitives(fieldName, reader => reader.readFloatArray(), FieldKind_1.FieldKind.ARRAY_OF_FLOAT32, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT32, 'ArrayOfFloat32');
    }
    readArrayOfFloat64(fieldName) {
        return this.getArrayOfPrimitives(fieldName, reader => reader.readDoubleArray(), FieldKind_1.FieldKind.ARRAY_OF_FLOAT64, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT64, 'ArrayOfFloat64');
    }
    readArrayOfString(fieldName) {
        return this.getArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_STRING, reader => reader.readString());
    }
    readArrayOfDecimal(fieldName) {
        return this.getArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_DECIMAL, IOUtil_1.IOUtil.readDecimal);
    }
    readArrayOfTime(fieldName) {
        return this.getArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIME, IOUtil_1.IOUtil.readLocalTime);
    }
    readArrayOfDate(fieldName) {
        return this.getArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_DATE, IOUtil_1.IOUtil.readLocalDate);
    }
    readArrayOfTimestamp(fieldName) {
        return this.getArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP, IOUtil_1.IOUtil.readLocalDateTime);
    }
    readArrayOfTimestampWithTimezone(fieldName) {
        return this.getArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE, IOUtil_1.IOUtil.readOffsetDateTime);
    }
    readArrayOfCompact(fieldName) {
        return this.getArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_COMPACT, reader => this.serializer.read(reader));
    }
    readNullableBoolean(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.BOOLEAN:
                return this.readBoolean(fieldName);
            case FieldKind_1.FieldKind.NULLABLE_BOOLEAN:
                return this.getVariableSize(fd, reader => reader.readBoolean());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.BOOLEAN, FieldKind_1.FieldKind.NULLABLE_BOOLEAN]);
        }
    }
    readNullableInt8(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.INT8:
                return this.input.readInt8(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_INT8:
                return this.getVariableSize(fd, reader => reader.readInt8());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.INT8, FieldKind_1.FieldKind.NULLABLE_INT8]);
        }
    }
    readNullableInt16(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.INT16:
                return this.input.readShort(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_INT16:
                return this.getVariableSize(fd, reader => reader.readShort());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.INT16, FieldKind_1.FieldKind.NULLABLE_INT16]);
        }
    }
    readNullableInt32(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.INT32:
                return this.input.readInt(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_INT32:
                return this.getVariableSize(fd, reader => reader.readInt());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.INT32, FieldKind_1.FieldKind.NULLABLE_INT32]);
        }
    }
    readNullableInt64(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.INT64:
                return this.input.readLong(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_INT64:
                return this.getVariableSize(fd, reader => reader.readLong());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.INT64, FieldKind_1.FieldKind.NULLABLE_INT64]);
        }
    }
    readNullableFloat32(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.FLOAT32:
                return this.input.readFloat(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_FLOAT32:
                return this.getVariableSize(fd, reader => reader.readFloat());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.FLOAT32, FieldKind_1.FieldKind.NULLABLE_FLOAT32]);
        }
    }
    readNullableFloat64(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.FLOAT64:
                return this.input.readDouble(this.readFixedSizePosition(fd));
            case FieldKind_1.FieldKind.NULLABLE_FLOAT64:
                return this.getVariableSize(fd, reader => reader.readDouble());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.FLOAT64, FieldKind_1.FieldKind.NULLABLE_FLOAT64]);
        }
    }
    readArrayOfNullableBoolean(fieldName) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN:
                return this.getVariableSize(fd, DefaultCompactReader.readBooleanBits);
            case FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN:
                return this.getArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN, reader => reader.readBoolean());
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN]);
        }
    }
    readArrayOfNullableInt8(fieldName) {
        return this.getArrayOfNullables(fieldName, reader => reader.readInt8(), FieldKind_1.FieldKind.ARRAY_OF_INT8, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT8);
    }
    readArrayOfNullableInt16(fieldName) {
        return this.getArrayOfNullables(fieldName, reader => reader.readShort(), FieldKind_1.FieldKind.ARRAY_OF_INT16, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT16);
    }
    readArrayOfNullableInt32(fieldName) {
        return this.getArrayOfNullables(fieldName, reader => reader.readInt(), FieldKind_1.FieldKind.ARRAY_OF_INT32, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT32);
    }
    readArrayOfNullableInt64(fieldName) {
        return this.getArrayOfNullables(fieldName, reader => reader.readLong(), FieldKind_1.FieldKind.ARRAY_OF_INT64, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT64);
    }
    readArrayOfNullableFloat32(fieldName) {
        return this.getArrayOfNullables(fieldName, reader => reader.readFloat(), FieldKind_1.FieldKind.ARRAY_OF_FLOAT32, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT32);
    }
    readArrayOfNullableFloat64(fieldName) {
        return this.getArrayOfNullables(fieldName, reader => reader.readDouble(), FieldKind_1.FieldKind.ARRAY_OF_FLOAT64, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT64);
    }
    readFixedSizePosition(fd) {
        const primitiveOffset = fd.offset;
        return primitiveOffset + this.dataStartPosition;
    }
    toDeserialized() {
        const fields = {};
        const values = {};
        for (const field of this.schema.fields) {
            fields[field.fieldName] = field;
            values[field.fieldName] = FieldOperations_1.FieldOperations.fieldOperations(field.kind).readFromReader(this, field.fieldName);
        }
        return new generic_record_1.CompactGenericRecordImpl(this.schema.typeName, fields, values, this.schema);
    }
    getVariableSizeAsNonNull(fieldDescriptor, readFn, methodSuffix) {
        const value = this.getVariableSize(fieldDescriptor, readFn);
        if (value === null) {
            throw CompactUtil_1.CompactExceptions.toExceptionForUnexpectedNullValue(fieldDescriptor.fieldName, methodSuffix);
        }
        return value;
    }
    getBooleanWithFieldDescriptor(fieldDescriptor) {
        const booleanOffset = fieldDescriptor.offset;
        const bitOffset = fieldDescriptor.bitOffset;
        const getOffset = booleanOffset + this.dataStartPosition;
        const lastByte = this.input.readByte(getOffset);
        return ((lastByte >>> bitOffset) & 1) !== 0;
    }
    readVariableSizeFieldPosition(fieldDescriptor) {
        const index = fieldDescriptor.index;
        const offset = this.offsetReader(this.input, this.variableOffsetsPosition, index);
        return offset === OffsetConstants_1.NULL_OFFSET ? OffsetConstants_1.NULL_OFFSET : offset + this.dataStartPosition;
    }
    getVariableSizeByNameAndKind(fieldName, fieldKind, readFn) {
        const fd = this.getFieldDefinitionChecked(fieldName, fieldKind);
        return this.getVariableSize(fd, readFn);
    }
    getVariableSize(fieldDescriptor, readFn) {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPosition(fieldDescriptor);
            if (pos === OffsetConstants_1.NULL_OFFSET) {
                return null;
            }
            this.input.position(pos);
            return readFn(this.input);
        }
        finally {
            this.input.position(currentPos);
        }
    }
    getNullableArrayAsPrimitiveArray(fd, readFn, methodSuffix) {
        const currentPos = this.input.position();
        try {
            const position = this.readVariableSizeFieldPosition(fd);
            if (position === BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
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
                if (offset === BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
                    throw CompactUtil_1.CompactExceptions.toExceptionForUnexpectedNullValueInArray(fd.fieldName, methodSuffix);
                }
            }
            this.input.position(dataStartPosition - BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
            return readFn(this.input);
        }
        finally {
            this.input.position(currentPos);
        }
    }
    getFieldDefinition(fieldName) {
        const fd = this.schema.fieldDefinitionMap.get(fieldName);
        if (fd === undefined) {
            throw DefaultCompactReader.toUnknownFieldError(fieldName, this.schema);
        }
        return fd;
    }
    getFieldDefinitionChecked(fieldName, fieldKind) {
        const fd = this.getFieldDefinition(fieldName);
        if (fd.kind !== fieldKind) {
            throw DefaultCompactReader.toUnexpectedFieldKindError(fieldKind, fd.kind, fieldName);
        }
        return fd;
    }
    getArrayOfVariableSizesWithFieldDescriptor(fieldDescriptor, readFn) {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPosition(fieldDescriptor);
            if (pos === BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
                return null;
            }
            this.input.position(pos);
            const dataLength = this.input.readInt();
            const itemCount = this.input.readInt();
            const dataStartPosition = this.input.position();
            const values = new Array(itemCount);
            const offsetReader = DefaultCompactReader.getOffsetReader(dataLength);
            const offsetsPosition = dataStartPosition + dataLength;
            for (let i = 0; i < itemCount; i++) {
                const offset = offsetReader(this.input, offsetsPosition, i);
                if (offset !== BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
                    this.input.position(offset + dataStartPosition);
                    values[i] = readFn(this.input);
                }
                else {
                    values[i] = null;
                }
            }
            return values;
        }
        finally {
            this.input.position(currentPos);
        }
    }
    getArrayOfVariableSizes(fieldName, fieldKind, readFn) {
        const fieldDefinition = this.getFieldDefinitionChecked(fieldName, fieldKind);
        return this.getArrayOfVariableSizesWithFieldDescriptor(fieldDefinition, readFn);
    }
    isFieldExists(fieldName, kind) {
        const field = this.schema.fieldDefinitionMap.get(fieldName);
        if (field === undefined) {
            return false;
        }
        return field.kind === kind;
    }
    getArrayOfPrimitives(fieldName, readFn, primitiveKind, nullableKind, methodSuffix) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        if (fieldKind === primitiveKind) {
            return this.getVariableSize(fd, readFn);
        }
        else if (fieldKind === nullableKind) {
            return this.getNullableArrayAsPrimitiveArray(fd, readFn, methodSuffix);
        }
        else {
            throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [primitiveKind, nullableKind]);
        }
    }
    getPrimitiveArrayAsNullableArray(fieldDescriptor, readFn) {
        const currentPos = this.input.position();
        try {
            const pos = this.readVariableSizeFieldPosition(fieldDescriptor);
            if (pos === OffsetConstants_1.NULL_OFFSET) {
                return null;
            }
            this.input.position(pos);
            const itemCount = this.input.readInt();
            const values = new Array(itemCount);
            for (let i = 0; i < itemCount; i++) {
                values[i] = readFn(this.input);
            }
            return values;
        }
        finally {
            this.input.position(currentPos);
        }
    }
    getArrayOfNullables(fieldName, readFn, primitiveKind, nullableField) {
        const fd = this.getFieldDefinition(fieldName);
        const fieldKind = fd.kind;
        switch (fieldKind) {
            case primitiveKind:
                return this.getPrimitiveArrayAsNullableArray(fd, readFn);
            case nullableField:
                return this.getArrayOfVariableSizesWithFieldDescriptor(fd, readFn);
            default:
                throw DefaultCompactReader.toFieldKindIsNotOneOfError(fieldKind, fieldName, [primitiveKind, nullableField]);
        }
    }
    static toUnknownFieldError(fieldName, schema) {
        return new core_1.HazelcastSerializationError(`No field with the name '${fieldName}' in compact schema ${JSON.stringify(schema.fieldDefinitionMap)}`);
    }
    static toUnexpectedFieldKindError(usedFieldKind, actualFieldKind, fieldName) {
        const usedFieldKindName = FieldKind_1.FieldKind[usedFieldKind];
        const actualFieldKindName = FieldKind_1.FieldKind[actualFieldKind];
        return new core_1.HazelcastSerializationError('Mismatched field kinds while reading a compact field: '
            + `Requested field kind for ${fieldName} is ${usedFieldKindName} but the field's actual type is ${actualFieldKindName}`);
    }
    static toFieldKindIsNotOneOfError(actualFieldKind, fieldName, expectedFieldKinds) {
        const expectedFieldKindNames = expectedFieldKinds.map((fieldKind) => FieldKind_1.FieldKind[fieldKind]).join(', ');
        const actualFieldKindName = FieldKind_1.FieldKind[actualFieldKind];
        return new core_1.HazelcastSerializationError(`The kind of field ${fieldName} must be one of ${expectedFieldKindNames} but it is ${actualFieldKindName}`);
    }
    static getOffsetReader(dataLength) {
        if (dataLength < OffsetConstants_1.BYTE_OFFSET_READER_RANGE) {
            return OffsetConstants_1.BYTE_OFFSET_READER;
        }
        else if (dataLength < OffsetConstants_1.SHORT_OFFSET_READER_RANGE) {
            return OffsetConstants_1.SHORT_OFFSET_READER;
        }
        else {
            return OffsetConstants_1.INT_OFFSET_READER;
        }
    }
    static readBooleanBits(input) {
        const len = input.readInt();
        if (len === 0) {
            return [];
        }
        const values = new Array(len);
        let index = 0;
        let currentByte = input.readByte();
        for (let i = 0; i < len; i++) {
            if (index === BitsUtil_1.BitsUtil.BITS_IN_A_BYTE) {
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
exports.DefaultCompactReader = DefaultCompactReader;
//# sourceMappingURL=DefaultCompactReader.js.map