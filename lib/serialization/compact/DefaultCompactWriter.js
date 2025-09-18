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
exports.SingleSchemaCompactArrayItemChecker = exports.SingleTypeCompactArrayItemChecker = exports.DefaultCompactWriter = void 0;
const core_1 = require("../../core");
const BitsUtil_1 = require("../../util/BitsUtil");
const FieldKind_1 = require("../generic_record/FieldKind");
const IOUtil_1 = require("../../util/IOUtil");
const OffsetConstants_1 = require("./OffsetConstants");
/**
 *
 * Default implementation of the {@link CompactWriter} that writes
 * the serialized fields into a {@link PositionalObjectDataOutput}.
 *
 * @internal
 */
class DefaultCompactWriter {
    constructor(serializer, out, schema) {
        this.serializer = serializer;
        this.out = out;
        this.schema = schema;
        if (schema.numberVarSizeFields !== 0) {
            this.fieldOffsets = new Array(schema.numberVarSizeFields);
            this.dataStartPosition = out.position() + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
            // Skip for length and primitives
            this.out.writeZeroBytes(schema.fixedSizeFieldsLength + BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        }
        else {
            this.fieldOffsets = null;
            this.dataStartPosition = out.position();
            // Skip for primitives. No need to write data length, when there is no variable-size fields.
            out.writeZeroBytes(schema.fixedSizeFieldsLength);
        }
    }
    writeBoolean(fieldName, value) {
        const fieldDefinition = this.checkFieldDefinition(fieldName, FieldKind_1.FieldKind.BOOLEAN);
        const offsetInBytes = fieldDefinition.offset;
        const offsetInBits = fieldDefinition.bitOffset;
        const writeOffset = offsetInBytes + this.dataStartPosition;
        this.out.pwriteBooleanBit(writeOffset, offsetInBits, value);
    }
    writeInt8(fieldName, value) {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind_1.FieldKind.INT8);
        this.out.pwriteInt8(position, value);
    }
    writeInt16(fieldName, value) {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind_1.FieldKind.INT16);
        this.out.pwriteShort(position, value);
    }
    writeInt32(fieldName, value) {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind_1.FieldKind.INT32);
        this.out.pwriteInt(position, value);
    }
    writeInt64(fieldName, value) {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind_1.FieldKind.INT64);
        this.out.pwriteLong(position, value);
    }
    writeFloat32(fieldName, value) {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind_1.FieldKind.FLOAT32);
        this.out.pwriteFloat(position, value);
    }
    writeFloat64(fieldName, value) {
        const position = this.getFixedSizeFieldPosition(fieldName, FieldKind_1.FieldKind.FLOAT64);
        this.out.pwriteDouble(position, value);
    }
    writeString(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.STRING, value, (out, value) => {
            out.writeString(value);
        });
    }
    writeDecimal(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.DECIMAL, value, IOUtil_1.IOUtil.writeDecimal);
    }
    writeTime(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.TIME, value, IOUtil_1.IOUtil.writeLocalTime);
    }
    writeDate(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.DATE, value, IOUtil_1.IOUtil.writeLocalDate);
    }
    writeTimestamp(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.TIMESTAMP, value, IOUtil_1.IOUtil.writeLocalDateTime);
    }
    writeTimestampWithTimezone(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.TIMESTAMP_WITH_TIMEZONE, value, IOUtil_1.IOUtil.writeOffsetDateTime);
    }
    writeCompact(fieldName, value) {
        return this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.COMPACT, value, (out, value) => {
            return this.serializer.writeObject(out, value);
        });
    }
    writeArrayOfBoolean(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.ARRAY_OF_BOOLEAN, value, DefaultCompactWriter.writeBooleanBits);
    }
    writeArrayOfInt8(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT8, value, (out, value) => {
            out.writeByteArray(value);
        });
    }
    writeArrayOfInt16(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT16, value, (out, values) => {
            out.writeShortArray(values);
        });
    }
    writeArrayOfInt32(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT32, value, (out, values) => {
            out.writeIntArray(values);
        });
    }
    writeArrayOfInt64(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.ARRAY_OF_INT64, value, (out, values) => {
            out.writeLongArray(values);
        });
    }
    writeArrayOfFloat32(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.ARRAY_OF_FLOAT32, value, (out, values) => {
            out.writeFloatArray(values);
        });
    }
    writeArrayOfFloat64(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.ARRAY_OF_FLOAT64, value, (out, values) => {
            out.writeDoubleArray(values);
        });
    }
    writeArrayOfString(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_STRING, value, (out, value) => {
            out.writeString(value);
        });
    }
    writeArrayOfDecimal(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_DECIMAL, value, IOUtil_1.IOUtil.writeDecimal);
    }
    writeArrayOfTime(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIME, value, IOUtil_1.IOUtil.writeLocalTime);
    }
    writeArrayOfDate(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_DATE, value, IOUtil_1.IOUtil.writeLocalDate);
    }
    writeArrayOfTimestamp(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP, value, IOUtil_1.IOUtil.writeLocalDateTime);
    }
    writeArrayOfTimestampWithTimezone(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_TIMESTAMP_WITH_TIMEZONE, value, IOUtil_1.IOUtil.writeOffsetDateTime);
    }
    writeArrayOfCompact(fieldName, value) {
        const singleTypeCompactArrayItemChecker = new SingleTypeCompactArrayItemChecker();
        return this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_COMPACT, value, (out, value) => {
            singleTypeCompactArrayItemChecker.check(value);
            return this.serializer.writeObject(out, value);
        });
    }
    writeNullableBoolean(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.NULLABLE_BOOLEAN, value, (out, value) => {
            out.writeBoolean(value);
        });
    }
    writeNullableInt8(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.NULLABLE_INT8, value, (out, value) => {
            out.writeInt8(value);
        });
    }
    writeNullableInt16(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.NULLABLE_INT16, value, (out, value) => {
            out.writeShort(value);
        });
    }
    writeNullableInt32(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.NULLABLE_INT32, value, (out, value) => {
            out.writeInt(value);
        });
    }
    writeNullableInt64(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.NULLABLE_INT64, value, (out, value) => {
            out.writeLong(value);
        });
    }
    writeNullableFloat32(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.NULLABLE_FLOAT32, value, (out, value) => {
            out.writeFloat(value);
        });
    }
    writeNullableFloat64(fieldName, value) {
        this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.NULLABLE_FLOAT64, value, (out, value) => {
            out.writeDouble(value);
        });
    }
    writeArrayOfNullableBoolean(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_BOOLEAN, value, (out, value) => {
            out.writeBoolean(value);
        });
    }
    writeArrayOfNullableInt8(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT8, value, (out, value) => {
            out.writeInt8(value);
        });
    }
    writeArrayOfNullableInt16(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT16, value, (out, value) => {
            out.writeShort(value);
        });
    }
    writeArrayOfNullableInt32(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT32, value, (out, value) => {
            out.writeInt(value);
        });
    }
    writeArrayOfNullableInt64(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_INT64, value, (out, value) => {
            out.writeLong(value);
        });
    }
    writeArrayOfNullableFloat32(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT32, value, (out, value) => {
            out.writeFloat(value);
        });
    }
    writeArrayOfNullableFloat64(fieldName, value) {
        this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_NULLABLE_FLOAT64, value, (out, value) => {
            out.writeDouble(value);
        });
    }
    writeGenericRecord(fieldName, value) {
        return this.writeVariableSizeField(fieldName, FieldKind_1.FieldKind.COMPACT, value, (out, value) => {
            return this.serializer.writeGenericRecord(out, value);
        });
    }
    writeArrayOfGenericRecord(fieldName, value) {
        const singleSchemaCompactArrayItemChecker = new SingleSchemaCompactArrayItemChecker();
        return this.writeArrayOfVariableSizes(fieldName, FieldKind_1.FieldKind.ARRAY_OF_COMPACT, value, (out, value) => {
            singleSchemaCompactArrayItemChecker.check(value);
            return this.serializer.writeGenericRecord(out, value);
        });
    }
    end() {
        if (this.schema.numberVarSizeFields === 0) {
            // There are no variable size fields
            return;
        }
        const position = this.out.position();
        const dataLength = position - this.dataStartPosition;
        this.writeOffsets(dataLength, this.fieldOffsets);
        // write dataLength
        this.out.pwriteInt(this.dataStartPosition - BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, dataLength);
    }
    writeOffsets(dataLength, offsets) {
        if (dataLength < OffsetConstants_1.BYTE_OFFSET_READER_RANGE) {
            for (const offset of offsets) {
                this.out.writeByte(offset);
            }
        }
        else if (dataLength < OffsetConstants_1.SHORT_OFFSET_READER_RANGE) {
            for (const offset of offsets) {
                this.out.writeShort(offset);
            }
        }
        else {
            for (const offset of offsets) {
                this.out.writeInt(offset);
            }
        }
    }
    writeVariableSizeField(fieldName, fieldKind, object, writeFn) {
        if (object === null) {
            this.setPositionAsNull(fieldName, fieldKind);
        }
        else {
            this.setPosition(fieldName, fieldKind);
            writeFn(this.out, object);
        }
    }
    writeArrayOfVariableSizes(fieldName, fieldKind, values, writeFn) {
        if (values === null) {
            this.setPositionAsNull(fieldName, fieldKind);
            return;
        }
        this.setPosition(fieldName, fieldKind);
        const dataLengthOffset = this.out.position();
        this.out.writeZeroBytes(BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        const itemCount = values.length;
        this.out.writeInt(itemCount);
        const offset = this.out.position();
        const offsets = new Array(itemCount);
        for (let i = 0; i < itemCount; i++) {
            if (values[i] !== null) {
                offsets[i] = this.out.position() - offset;
                writeFn(this.out, values[i]);
            }
            else {
                offsets[i] = OffsetConstants_1.NULL_OFFSET;
            }
        }
        const dataLength = this.out.position() - offset;
        this.out.pwriteInt(dataLengthOffset, dataLength);
        this.writeOffsets(dataLength, offsets);
    }
    setPositionAsNull(fieldName, fieldKind) {
        const field = this.checkFieldDefinition(fieldName, fieldKind);
        const index = field.index;
        this.fieldOffsets[index] = -1;
    }
    setPosition(fieldName, fieldKind) {
        const field = this.checkFieldDefinition(fieldName, fieldKind);
        const position = this.out.position();
        const fieldPosition = position - this.dataStartPosition;
        const index = field.index;
        this.fieldOffsets[index] = fieldPosition;
    }
    getFieldByName(fieldName) {
        return this.schema.fieldDefinitionMap.get(fieldName);
    }
    checkFieldDefinition(fieldName, fieldKind) {
        const field = this.getFieldByName(fieldName);
        if (field === undefined) {
            throw new core_1.HazelcastSerializationError(`Invalid field name: ${fieldName} for ${this.schema}`);
        }
        if (field.kind !== fieldKind) {
            throw new core_1.HazelcastSerializationError(`Invalid field type: ${fieldName} for ${this.schema}`);
        }
        return field;
    }
    getFixedSizeFieldPosition(fieldName, fieldKind) {
        const fieldDefinition = this.checkFieldDefinition(fieldName, fieldKind);
        return fieldDefinition.offset + this.dataStartPosition;
    }
    static writeBooleanBits(out, booleans) {
        const length = booleans.length;
        out.writeInt(length);
        let position = out.position();
        if (length > 0) {
            let index = 0;
            out.writeZeroBytes(1);
            for (const boolean of booleans) {
                if (index === BitsUtil_1.BitsUtil.BITS_IN_A_BYTE) {
                    index = 0;
                    out.writeZeroBytes(1);
                    position++;
                }
                out.pwriteBooleanBit(position, index, boolean);
                index++;
            }
        }
    }
}
exports.DefaultCompactWriter = DefaultCompactWriter;
/**
 * Checks that the Compact serializable array items that are written are of
 * a single type.
 */
class SingleTypeCompactArrayItemChecker {
    check(value) {
        if (value === undefined) {
            throw new core_1.HazelcastSerializationError('The value undefined can not be used in an Array of Compact value.');
        }
        if (value.constructor === undefined) {
            throw new core_1.HazelcastSerializationError('While checking if all elements in a compact array are of same type, '
                + 'encountered with a value with undefined contructor. Can not continue with single type checking.');
        }
        const clazzType = value.constructor;
        if (this.clazz == null) {
            this.clazz = clazzType;
        }
        if (this.clazz !== clazzType) {
            throw new core_1.HazelcastSerializationError('It is not allowed to '
                + 'serialize an array of Compact serializable objects '
                + 'containing different item types. Expected array item '
                + 'type: ' + this.clazz.name + ', current item type: ' + clazzType.name);
        }
    }
}
exports.SingleTypeCompactArrayItemChecker = SingleTypeCompactArrayItemChecker;
/**
 * Checks that the Compact serializable GenericRecord array items that are
 * written are of a single schema.
 */
class SingleSchemaCompactArrayItemChecker {
    check(value) {
        const record = value;
        const schema = record.getSchema();
        if (this.schema == null) {
            this.schema = schema;
        }
        if (!this.schema.schemaId.equals(schema.schemaId)) {
            throw new core_1.HazelcastSerializationError('It is not allowed to '
                + 'serialize an array of Compact serializable '
                + 'GenericRecord objects containing different schemas. '
                + 'Expected array item schema: ' + this.schema
                + ', current schema: ' + schema);
        }
    }
}
exports.SingleSchemaCompactArrayItemChecker = SingleSchemaCompactArrayItemChecker;
//# sourceMappingURL=DefaultCompactWriter.js.map