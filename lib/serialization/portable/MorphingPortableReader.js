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
exports.MorphingPortableReader = void 0;
const DefaultPortableReader_1 = require("./DefaultPortableReader");
const Portable_1 = require("../Portable");
const Long = require("long");
/** @internal */
class MorphingPortableReader extends DefaultPortableReader_1.DefaultPortableReader {
    constructor(portableSerializer, input, classDefinition) {
        super(portableSerializer, input, classDefinition);
    }
    readInt(fieldName) {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case Portable_1.FieldType.INT:
                return super.readInt(fieldName);
            case Portable_1.FieldType.BYTE:
                return super.readByte(fieldName);
            case Portable_1.FieldType.CHAR:
                return super.readChar(fieldName).charCodeAt(0);
            case Portable_1.FieldType.SHORT:
                return super.readShort(fieldName);
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, Portable_1.FieldType.INT);
        }
    }
    readLong(fieldName) {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case Portable_1.FieldType.LONG:
                return super.readLong(fieldName);
            case Portable_1.FieldType.INT:
                return Long.fromNumber(super.readInt(fieldName));
            case Portable_1.FieldType.BYTE:
                return Long.fromNumber(super.readByte(fieldName));
            case Portable_1.FieldType.CHAR:
                return Long.fromNumber(super.readChar(fieldName).charCodeAt(0));
            case Portable_1.FieldType.SHORT:
                return Long.fromNumber(super.readShort(fieldName));
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, Portable_1.FieldType.LONG);
        }
    }
    readDouble(fieldName) {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case Portable_1.FieldType.DOUBLE:
                return super.readDouble(fieldName);
            case Portable_1.FieldType.LONG:
                return super.readLong(fieldName).toNumber();
            case Portable_1.FieldType.FLOAT:
                return super.readFloat(fieldName);
            case Portable_1.FieldType.INT:
                return super.readInt(fieldName);
            case Portable_1.FieldType.BYTE:
                return super.readByte(fieldName);
            case Portable_1.FieldType.CHAR:
                return super.readChar(fieldName).charCodeAt(0);
            case Portable_1.FieldType.SHORT:
                return super.readShort(fieldName);
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, Portable_1.FieldType.DOUBLE);
        }
    }
    readFloat(fieldName) {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case Portable_1.FieldType.FLOAT:
                return super.readFloat(fieldName);
            case Portable_1.FieldType.INT:
                return super.readInt(fieldName);
            case Portable_1.FieldType.BYTE:
                return super.readByte(fieldName);
            case Portable_1.FieldType.CHAR:
                return super.readChar(fieldName).charCodeAt(0);
            case Portable_1.FieldType.SHORT:
                return super.readShort(fieldName);
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, Portable_1.FieldType.FLOAT);
        }
    }
    readShort(fieldName) {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return undefined;
        }
        switch (fieldDef.getType()) {
            case Portable_1.FieldType.BYTE:
                return super.readByte(fieldName);
            case Portable_1.FieldType.SHORT:
                return super.readShort(fieldName);
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, Portable_1.FieldType.SHORT);
        }
    }
    readPortableArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.PORTABLE_ARRAY, super.readPortableArray);
    }
    readStringArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.STRING_ARRAY, super.readStringArray);
    }
    readUTFArray(fieldName) {
        return this.readStringArray(fieldName);
    }
    readShortArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.SHORT_ARRAY, super.readShortArray);
    }
    readFloatArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.FLOAT_ARRAY, super.readFloatArray);
    }
    readDoubleArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.DOUBLE_ARRAY, super.readDoubleArray);
    }
    readLongArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.LONG_ARRAY, super.readLongArray);
    }
    readIntArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.INT_ARRAY, super.readIntArray);
    }
    readCharArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.CHAR_ARRAY, super.readCharArray);
    }
    readBooleanArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.BOOLEAN_ARRAY, super.readBooleanArray);
    }
    readByteArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.BYTE_ARRAY, super.readByteArray);
    }
    readChar(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.CHAR, super.readChar);
    }
    readByte(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.BYTE, super.readByte);
    }
    readBoolean(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.BOOLEAN, super.readBoolean);
    }
    readString(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.STRING, super.readString);
    }
    readUTF(fieldName) {
        return this.readString(fieldName);
    }
    readDecimal(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.DECIMAL, super.readDecimal);
    }
    readTime(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.TIME, super.readTime);
    }
    readDate(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.DATE, super.readDate);
    }
    readTimestamp(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.TIMESTAMP, super.readTimestamp);
    }
    readTimestampWithTimezone(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.TIMESTAMP_WITH_TIMEZONE, super.readTimestampWithTimezone);
    }
    readDecimalArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.DECIMAL_ARRAY, super.readDecimalArray);
    }
    readTimeArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.TIME_ARRAY, super.readTimeArray);
    }
    readDateArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.DATE_ARRAY, super.readDateArray);
    }
    readTimestampArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.TIMESTAMP_ARRAY, super.readTimestampArray);
    }
    readTimestampWithTimezoneArray(fieldName) {
        return this.validateCompatibleAndRead(fieldName, Portable_1.FieldType.TIMESTAMP_WITH_TIMEZONE_ARRAY, super.readTimestampWithTimezoneArray);
    }
    validateCompatibleAndRead(fieldName, expectedType, readFn) {
        const fd = this.classDefinition.getField(fieldName);
        if (fd === null) {
            return undefined;
        }
        if (fd.getType() !== expectedType) {
            throw MorphingPortableReader.createIncompatibleClassChangeError(fd, expectedType);
        }
        return readFn.call(this, fieldName);
    }
    static createIncompatibleClassChangeError(fd, expectedType) {
        return new TypeError(`Incompatible to read ${expectedType} from ${fd.getType()} while reading field : ${fd.getName()}`);
    }
}
exports.MorphingPortableReader = MorphingPortableReader;
//# sourceMappingURL=MorphingPortableReader.js.map