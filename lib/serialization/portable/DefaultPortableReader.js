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
exports.DefaultPortableReader = void 0;
const BitsUtil_1 = require("../../util/BitsUtil");
const IOUtil_1 = require("../../util/IOUtil");
const core_1 = require("../../core");
const Portable_1 = require("../Portable");
const PortableUtil_1 = require("../../util/PortableUtil");
/** @internal */
class DefaultPortableReader {
    constructor(serializer, input, classDefinition) {
        this.raw = false;
        this.serializer = serializer;
        this.input = input;
        this.classDefinition = classDefinition;
        this.initFinalPositionAndOffset();
    }
    getVersion() {
        return this.classDefinition.getVersion();
    }
    hasField(fieldName) {
        return this.classDefinition.hasField(fieldName);
    }
    getFieldNames() {
        return this.classDefinition.getFieldNames();
    }
    getFieldType(fieldName) {
        return this.classDefinition.getFieldType(fieldName);
    }
    readInt(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.INT);
        return this.input.readInt(pos);
    }
    readLong(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.LONG);
        return this.input.readLong(pos);
    }
    readUTF(fieldName) {
        return this.readString(fieldName);
    }
    readString(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.STRING);
        return this.input.readString(pos);
    }
    readBoolean(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.BOOLEAN);
        return this.input.readBoolean(pos);
    }
    readByte(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.BYTE);
        return this.input.readByte(pos);
    }
    readChar(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.CHAR);
        return this.input.readChar(pos);
    }
    readDouble(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.DOUBLE);
        return this.input.readDouble(pos);
    }
    readFloat(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.FLOAT);
        return this.input.readFloat(pos);
    }
    readShort(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.SHORT);
        return this.input.readShort(pos);
    }
    readPortable(fieldName) {
        const backupPos = this.input.position();
        try {
            const pos = this.positionByField(fieldName, Portable_1.FieldType.PORTABLE);
            this.input.position(pos);
            const isNull = this.input.readBoolean();
            const factoryId = this.input.readInt();
            const classId = this.input.readInt();
            if (isNull) {
                return null;
            }
            else {
                return this.serializer.readObject(this.input, factoryId, classId);
            }
        }
        finally {
            this.input.position(backupPos);
        }
    }
    readDecimal(fieldName) {
        return this.readNullableField(fieldName, Portable_1.FieldType.DECIMAL, IOUtil_1.IOUtil.readDecimal);
    }
    readTime(fieldName) {
        return this.readNullableField(fieldName, Portable_1.FieldType.TIME, IOUtil_1.IOUtil.readLocalTime);
    }
    readDate(fieldName) {
        return this.readNullableField(fieldName, Portable_1.FieldType.DATE, PortableUtil_1.PortableUtil.readLocalDate);
    }
    readTimestamp(fieldName) {
        return this.readNullableField(fieldName, Portable_1.FieldType.TIMESTAMP, PortableUtil_1.PortableUtil.readLocalDateTime);
    }
    readTimestampWithTimezone(fieldName) {
        return this.readNullableField(fieldName, Portable_1.FieldType.TIMESTAMP_WITH_TIMEZONE, PortableUtil_1.PortableUtil.readOffsetDateTime);
    }
    readByteArray(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.BYTE_ARRAY);
        return this.input.readByteArray(pos);
    }
    readBooleanArray(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.BOOLEAN_ARRAY);
        return this.input.readBooleanArray(pos);
    }
    readCharArray(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.CHAR_ARRAY);
        return this.input.readCharArray(pos);
    }
    readIntArray(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.INT_ARRAY);
        return this.input.readIntArray(pos);
    }
    readLongArray(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.LONG_ARRAY);
        return this.input.readLongArray(pos);
    }
    readDoubleArray(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.DOUBLE_ARRAY);
        return this.input.readDoubleArray(pos);
    }
    readFloatArray(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.FLOAT_ARRAY);
        return this.input.readFloatArray(pos);
    }
    readShortArray(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.SHORT_ARRAY);
        return this.input.readShortArray(pos);
    }
    readUTFArray(fieldName) {
        return this.readStringArray(fieldName);
    }
    readStringArray(fieldName) {
        const pos = this.positionByField(fieldName, Portable_1.FieldType.STRING_ARRAY);
        return this.input.readStringArray(pos);
    }
    readPortableArray(fieldName) {
        const backupPos = this.input.position();
        try {
            const pos = this.positionByField(fieldName, Portable_1.FieldType.PORTABLE_ARRAY);
            this.input.position(pos);
            const len = this.input.readInt();
            const factoryId = this.input.readInt();
            const classId = this.input.readInt();
            if (len === BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
                return null;
            }
            else {
                const portables = [];
                if (len > 0) {
                    const offset = this.input.position();
                    for (let i = 0; i < len; i++) {
                        const start = this.input.readInt(offset + i * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
                        this.input.position(start);
                        portables[i] = this.serializer.readObject(this.input, factoryId, classId);
                    }
                }
                return portables;
            }
        }
        finally {
            this.input.position(backupPos);
        }
    }
    readDecimalArray(fieldName) {
        return this.readObjectArrayField(fieldName, Portable_1.FieldType.DECIMAL_ARRAY, IOUtil_1.IOUtil.readDecimal);
    }
    readTimeArray(fieldName) {
        return this.readObjectArrayField(fieldName, Portable_1.FieldType.TIME_ARRAY, IOUtil_1.IOUtil.readLocalTime);
    }
    readDateArray(fieldName) {
        return this.readObjectArrayField(fieldName, Portable_1.FieldType.DATE_ARRAY, PortableUtil_1.PortableUtil.readLocalDate);
    }
    readTimestampArray(fieldName) {
        return this.readObjectArrayField(fieldName, Portable_1.FieldType.TIMESTAMP_ARRAY, PortableUtil_1.PortableUtil.readLocalDateTime);
    }
    readTimestampWithTimezoneArray(fieldName) {
        return this.readObjectArrayField(fieldName, Portable_1.FieldType.TIMESTAMP_WITH_TIMEZONE_ARRAY, PortableUtil_1.PortableUtil.readOffsetDateTime);
    }
    readNullableField(fieldName, fieldType, readFn) {
        const currentPos = this.input.position();
        try {
            const pos = this.positionByField(fieldName, fieldType);
            this.input.position(pos);
            const isNull = this.input.readBoolean();
            if (isNull) {
                return null;
            }
            return readFn(this.input);
        }
        finally {
            this.input.position(currentPos);
        }
    }
    readObjectArrayField(fieldName, fieldType, readFn) {
        const currentPos = this.input.position();
        try {
            const pos = this.positionByField(fieldName, fieldType);
            this.input.position(pos);
            const len = this.input.readInt();
            if (len === BitsUtil_1.BitsUtil.NULL_ARRAY_LENGTH) {
                return null;
            }
            const values = new Array(len);
            if (len > 0) {
                const offset = this.input.position();
                for (let i = 0; i < len; i++) {
                    const pos = this.input.readInt(offset + i * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
                    this.input.position(pos);
                    values[i] = readFn(this.input);
                }
            }
            return values;
        }
        finally {
            this.input.position(currentPos);
        }
    }
    getRawDataInput() {
        let pos;
        if (!this.raw) {
            pos = this.input.readInt(this.offset + this.classDefinition.getFieldCount() * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
            this.input.position(pos);
            this.raw = true;
        }
        return this.input;
    }
    end() {
        this.input.position(this.finalPos);
    }
    positionByFieldDefinition(field) {
        if (this.raw) {
            throw new core_1.HazelcastSerializationError('Cannot read portable fields after getRawDataInput called!');
        }
        const pos = this.input.readInt(this.offset + field.getIndex() * BitsUtil_1.BitsUtil.INT_SIZE_IN_BYTES);
        const len = this.input.readShort(pos);
        return pos + BitsUtil_1.BitsUtil.SHORT_SIZE_IN_BYTES + len + 1;
    }
    positionByField(fieldName, fieldType) {
        const definition = this.classDefinition.getField(fieldName);
        if (definition === null) {
            throw new core_1.HazelcastSerializationError(`Unknown field name: '${fieldName}' for ClassDefinition`
                + `{id: ${this.classDefinition.getClassId()}, version: ${this.classDefinition.getVersion()}}`);
        }
        if (definition.getType() !== fieldType) {
            throw new core_1.HazelcastSerializationError(`Not a '${fieldType}' field: ${fieldName}`);
        }
        return this.positionByFieldDefinition(definition);
    }
    initFinalPositionAndOffset() {
        this.finalPos = this.input.readInt();
        const fieldCount = this.input.readInt();
        const expectedFieldCount = this.classDefinition.getFieldCount();
        if (fieldCount !== expectedFieldCount) {
            // eslint-disable-next-line max-len
            throw new core_1.HazelcastSerializationError(`Field count[${fieldCount}] in stream does not match with class definition[${expectedFieldCount}]`);
        }
        this.offset = this.input.position();
    }
}
exports.DefaultPortableReader = DefaultPortableReader;
//# sourceMappingURL=DefaultPortableReader.js.map