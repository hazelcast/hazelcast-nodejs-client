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
exports.DefaultPortableWriter = void 0;
const BitsUtil_1 = require("../../util/BitsUtil");
const Portable_1 = require("../Portable");
const core_1 = require("../../core");
const IOUtil_1 = require("../../util/IOUtil");
const PortableUtil_1 = require("../../util/PortableUtil");
/** @internal */
class DefaultPortableWriter {
    constructor(serializer, output, classDefinition) {
        this.serializer = serializer;
        this.output = output;
        this.classDefinition = classDefinition;
        this.writtenFields = new Set();
        this.begin = this.output.position();
        this.output.writeZeroBytes(4);
        this.output.writeInt(this.classDefinition.getFieldCount());
        this.offset = this.output.position();
        const fieldIndexesLength = (this.classDefinition.getFieldCount() + 1) * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES;
        this.output.writeZeroBytes(fieldIndexesLength);
    }
    writeInt(fieldName, value) {
        this.setPosition(fieldName, Portable_1.FieldType.INT);
        this.output.writeInt(value);
    }
    writeLong(fieldName, long) {
        this.setPosition(fieldName, Portable_1.FieldType.LONG);
        this.output.writeLong(long);
    }
    writeUTF(fieldName, str) {
        this.writeString(fieldName, str);
    }
    writeString(fieldName, str) {
        this.setPosition(fieldName, Portable_1.FieldType.STRING);
        this.output.writeString(str);
    }
    writeBoolean(fieldName, value) {
        this.setPosition(fieldName, Portable_1.FieldType.BOOLEAN);
        this.output.writeBoolean(value);
    }
    writeByte(fieldName, value) {
        this.setPosition(fieldName, Portable_1.FieldType.BYTE);
        this.output.writeByte(value);
    }
    writeChar(fieldName, char) {
        this.setPosition(fieldName, Portable_1.FieldType.CHAR);
        this.output.writeChar(char);
    }
    writeDouble(fieldName, double) {
        this.setPosition(fieldName, Portable_1.FieldType.DOUBLE);
        this.output.writeDouble(double);
    }
    writeFloat(fieldName, float) {
        this.setPosition(fieldName, Portable_1.FieldType.FLOAT);
        this.output.writeFloat(float);
    }
    writeShort(fieldName, value) {
        this.setPosition(fieldName, Portable_1.FieldType.SHORT);
        this.output.writeShort(value);
    }
    writePortable(fieldName, portable) {
        const fieldDefinition = this.setPosition(fieldName, Portable_1.FieldType.PORTABLE);
        const isNullPortable = (portable == null);
        this.output.writeBoolean(isNullPortable);
        this.output.writeInt(fieldDefinition.getFactoryId());
        this.output.writeInt(fieldDefinition.getClassId());
        if (!isNullPortable) {
            this.serializer.writeObject(this.output, portable);
        }
    }
    writeNullPortable(fieldName, factoryId, classId) {
        this.setPosition(fieldName, Portable_1.FieldType.PORTABLE);
        this.output.writeBoolean(true);
        this.output.writeInt(factoryId);
        this.output.writeInt(classId);
    }
    writeDecimal(fieldName, value) {
        this.writeNullable(fieldName, Portable_1.FieldType.DECIMAL, value, IOUtil_1.IOUtil.writeDecimal);
    }
    writeTime(fieldName, value) {
        this.writeNullable(fieldName, Portable_1.FieldType.TIME, value, IOUtil_1.IOUtil.writeLocalTime);
    }
    writeDate(fieldName, value) {
        this.writeNullable(fieldName, Portable_1.FieldType.DATE, value, PortableUtil_1.PortableUtil.writeLocalDate);
    }
    writeTimestamp(fieldName, value) {
        this.writeNullable(fieldName, Portable_1.FieldType.TIMESTAMP, value, PortableUtil_1.PortableUtil.writeLocalDateTime);
    }
    writeTimestampWithTimezone(fieldName, value) {
        this.writeNullable(fieldName, Portable_1.FieldType.TIMESTAMP_WITH_TIMEZONE, value, PortableUtil_1.PortableUtil.writeOffsetDateTime);
    }
    writeNullable(fieldName, fieldType, value, writeFn) {
        this.setPosition(fieldName, fieldType);
        const isNull = value === null;
        this.output.writeBoolean(isNull);
        if (!isNull) {
            writeFn(this.output, value);
        }
    }
    writeByteArray(fieldName, bytes) {
        this.setPosition(fieldName, Portable_1.FieldType.BYTE_ARRAY);
        this.output.writeByteArray(bytes);
    }
    writeBooleanArray(fieldName, booleans) {
        this.setPosition(fieldName, Portable_1.FieldType.BOOLEAN_ARRAY);
        this.output.writeBooleanArray(booleans);
    }
    writeCharArray(fieldName, chars) {
        this.setPosition(fieldName, Portable_1.FieldType.CHAR_ARRAY);
        this.output.writeCharArray(chars);
    }
    writeIntArray(fieldName, ints) {
        this.setPosition(fieldName, Portable_1.FieldType.INT_ARRAY);
        this.output.writeIntArray(ints);
    }
    writeLongArray(fieldName, longs) {
        this.setPosition(fieldName, Portable_1.FieldType.LONG_ARRAY);
        this.output.writeLongArray(longs);
    }
    writeDoubleArray(fieldName, doubles) {
        this.setPosition(fieldName, Portable_1.FieldType.DOUBLE_ARRAY);
        this.output.writeDoubleArray(doubles);
    }
    writeFloatArray(fieldName, floats) {
        this.setPosition(fieldName, Portable_1.FieldType.FLOAT_ARRAY);
        this.output.writeFloatArray(floats);
    }
    writeShortArray(fieldName, shorts) {
        this.setPosition(fieldName, Portable_1.FieldType.SHORT_ARRAY);
        this.output.writeShortArray(shorts);
    }
    writeUTFArray(fieldName, val) {
        this.writeStringArray(fieldName, val);
    }
    writeStringArray(fieldName, val) {
        this.setPosition(fieldName, Portable_1.FieldType.STRING_ARRAY);
        this.output.writeStringArray(val);
    }
    writePortableArray(fieldName, portables) {
        let innerOffset;
        let sample;
        let i;
        const fieldDefinition = this.setPosition(fieldName, Portable_1.FieldType.PORTABLE_ARRAY);
        const len = (portables == null) ? BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH : portables.length;
        this.output.writeInt(len);
        this.output.writeInt(fieldDefinition.getFactoryId());
        this.output.writeInt(fieldDefinition.getClassId());
        if (len > 0) {
            innerOffset = this.output.position();
            this.output.writeZeroBytes(len * 4);
            for (i = 0; i < len; i++) {
                sample = portables[i];
                const posVal = this.output.position();
                this.output.pwriteInt(innerOffset + i * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, posVal);
                this.serializer.writeObject(this.output, sample);
            }
        }
    }
    writeDecimalArray(fieldName, values) {
        this.writeObjectArrayField(fieldName, Portable_1.FieldType.DECIMAL_ARRAY, values, IOUtil_1.IOUtil.writeDecimal);
    }
    writeTimeArray(fieldName, values) {
        this.writeObjectArrayField(fieldName, Portable_1.FieldType.TIME_ARRAY, values, IOUtil_1.IOUtil.writeLocalTime);
    }
    writeDateArray(fieldName, values) {
        this.writeObjectArrayField(fieldName, Portable_1.FieldType.DATE_ARRAY, values, PortableUtil_1.PortableUtil.writeLocalDate);
    }
    writeTimestampArray(fieldName, values) {
        this.writeObjectArrayField(fieldName, Portable_1.FieldType.TIMESTAMP_ARRAY, values, PortableUtil_1.PortableUtil.writeLocalDateTime);
    }
    writeTimestampWithTimezoneArray(fieldName, values) {
        this.writeObjectArrayField(fieldName, Portable_1.FieldType.TIMESTAMP_WITH_TIMEZONE_ARRAY, values, PortableUtil_1.PortableUtil.writeOffsetDateTime);
    }
    writeObjectArrayField(fieldName, fieldType, values, writeFn) {
        this.setPosition(fieldName, fieldType);
        const len = values === null ? BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH : values.length;
        this.output.writeInt(len);
        if (len > 0) {
            const offset = this.output.position();
            this.output.writeZeroBytes(len * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
            for (let i = 0; i < len; i++) {
                const position = this.output.position();
                if (values[i] === null) {
                    throw new core_1.HazelcastSerializationError('Array items cannot be null');
                }
                this.output.pwriteInt(offset + i * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, position);
                writeFn(this.output, values[i]);
            }
        }
    }
    end() {
        const position = this.output.position();
        this.output.pwriteInt(this.begin, position);
    }
    setPosition(fieldName, fieldType) {
        const field = this.classDefinition.getField(fieldName);
        if (field === null) {
            throw new core_1.HazelcastSerializationError(`Invalid field name: '${fieldName}' for ClassDefinition`
                + `{id: ${this.classDefinition.getClassId()}, version: ${this.classDefinition.getVersion()}}`);
        }
        if (this.writtenFields.has(fieldName)) {
            throw new core_1.HazelcastSerializationError(`Field ${fieldName} has already been written!`);
        }
        this.writtenFields.add(fieldName);
        const pos = this.output.position();
        const index = field.getIndex();
        this.output.pwriteInt(this.offset + index * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES, pos);
        this.output.writeShort(fieldName.length);
        this.output.write(Buffer.from(fieldName));
        this.output.writeByte(fieldType);
        return field;
    }
}
exports.DefaultPortableWriter = DefaultPortableWriter;
//# sourceMappingURL=DefaultPortableWriter.js.map