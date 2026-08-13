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

import {DefaultPortableReader} from './DefaultPortableReader';
import {PortableSerializer} from './PortableSerializer';
import {DataInput} from '../Data';
import {ClassDefinition, FieldDefinition} from './ClassDefinition';
import {Portable, FieldType} from '../Portable';
import Long from 'long';
import {
    BigDecimal,
    LocalDate,
    LocalDateTime,
    LocalTime,
    OffsetDateTime
} from '../../core';

/** @internal */
export class MorphingPortableReader extends DefaultPortableReader {

    constructor(portableSerializer: PortableSerializer,
                input: DataInput,
                classDefinition: ClassDefinition) {
        super(portableSerializer, input, classDefinition);
    }

    readInt(fieldName: string): number | null {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return null;
        }
        switch (fieldDef.getType()) {
            case FieldType.INT:
                return super.readInt(fieldName);
            case FieldType.BYTE:
                return super.readByte(fieldName);
            case FieldType.CHAR:
                return ((): number | null => {
                    const value = super.readChar(fieldName);
                    return (value === null)? null : value.charCodeAt(0);
                })();
            case FieldType.SHORT:
                return super.readShort(fieldName);
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, FieldType.INT);
        }
    }

    readLong(fieldName: string): Long | null {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return null;
        }
        switch (fieldDef.getType()) {
            case FieldType.LONG:
                return super.readLong(fieldName);
            case FieldType.INT:
                return ((): Long | null => {
                    const value = super.readInt(fieldName);
                    return (value === null)? null : Long.fromNumber(value);
                })();
            case FieldType.BYTE:
                return ((): Long | null => {
                    const value = super.readByte(fieldName);
                    return (value === null)? null : Long.fromNumber(value);
                })();
            case FieldType.CHAR:
                return ((): Long | null => {
                    const value = super.readChar(fieldName);
                    return (value === null)? null : Long.fromNumber(value.charCodeAt(0));
                })();
            case FieldType.SHORT:
                return ((): Long | null => {
                    const value = super.readShort(fieldName);
                    return (value === null)? null : Long.fromNumber(value);
                })();
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, FieldType.LONG);
        }
    }

    readDouble(fieldName: string): number | null {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return null;
        }
        switch (fieldDef.getType()) {
            case FieldType.DOUBLE:
                return super.readDouble(fieldName);
            case FieldType.LONG:
                return ((): number | null => {
                    const value = super.readLong(fieldName);
                    return (value === null)? null : value.toNumber();
                })();
            case FieldType.FLOAT:
                return super.readFloat(fieldName);
            case FieldType.INT:
                return super.readInt(fieldName);
            case FieldType.BYTE:
                return super.readByte(fieldName);
            case FieldType.CHAR:
                return ((): number | null => {
                    const value = super.readChar(fieldName);
                    return (value === null)? null : value.charCodeAt(0);
                })();
            case FieldType.SHORT:
                return super.readShort(fieldName);
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, FieldType.DOUBLE);
        }
    }

    readFloat(fieldName: string): number | null {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return null;
        }
        switch (fieldDef.getType()) {
            case FieldType.FLOAT:
                return super.readFloat(fieldName);
            case FieldType.INT:
                return super.readInt(fieldName);
            case FieldType.BYTE:
                return super.readByte(fieldName);
            case FieldType.CHAR:
                return ((): number | null => {
                    const value = super.readChar(fieldName);
                    return (value === null)? null : value.charCodeAt(0);
                })();
            case FieldType.SHORT:
                return super.readShort(fieldName);
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, FieldType.FLOAT);
        }
    }

    readShort(fieldName: string): number | null {
        const fieldDef = this.classDefinition.getField(fieldName);
        if (fieldDef == null) {
            return null;
        }
        switch (fieldDef.getType()) {
            case FieldType.BYTE:
                return super.readByte(fieldName);
            case FieldType.SHORT:
                return super.readShort(fieldName);
            default:
                throw MorphingPortableReader.createIncompatibleClassChangeError(fieldDef, FieldType.SHORT);
        }
    }

    readPortableArray(fieldName: string): Portable[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.PORTABLE_ARRAY, super.readPortableArray);
    }

    readStringArray(fieldName: string): string[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.STRING_ARRAY, super.readStringArray);
    }

    readUTFArray(fieldName: string): string[] | null {
        return this.readStringArray(fieldName);
    }

    readShortArray(fieldName: string): number[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.SHORT_ARRAY, super.readShortArray);
    }

    readFloatArray(fieldName: string): number[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.FLOAT_ARRAY, super.readFloatArray);
    }

    readDoubleArray(fieldName: string): number[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.DOUBLE_ARRAY, super.readDoubleArray);
    }

    readLongArray(fieldName: string): Long[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.LONG_ARRAY, super.readLongArray);
    }

    readIntArray(fieldName: string): number[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.INT_ARRAY, super.readIntArray);
    }

    readCharArray(fieldName: string): string[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.CHAR_ARRAY, super.readCharArray);
    }

    readBooleanArray(fieldName: string): boolean[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.BOOLEAN_ARRAY, super.readBooleanArray);
    }

    readByteArray(fieldName: string): Buffer | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.BYTE_ARRAY, super.readByteArray);
    }

    readChar(fieldName: string): string | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.CHAR, super.readChar);
    }

    readByte(fieldName: string): number | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.BYTE, super.readByte);
    }

    readBoolean(fieldName: string): boolean | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.BOOLEAN, super.readBoolean);
    }

    readString(fieldName: string): string | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.STRING, super.readString);
    }

    readUTF(fieldName: string): string | null {
        return this.readString(fieldName);
    }

    readDecimal(fieldName: string): BigDecimal | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.DECIMAL, super.readDecimal);
    }

    readTime(fieldName: string): LocalTime | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.TIME, super.readTime);
    }

    readDate(fieldName: string): LocalDate | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.DATE, super.readDate);
    }

    readTimestamp(fieldName: string): LocalDateTime | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.TIMESTAMP, super.readTimestamp);
    }

    readTimestampWithTimezone(fieldName: string): OffsetDateTime | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.TIMESTAMP_WITH_TIMEZONE, super.readTimestampWithTimezone);
    }

    readDecimalArray(fieldName: string): BigDecimal[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.DECIMAL_ARRAY, super.readDecimalArray);
    }

    readTimeArray(fieldName: string): LocalTime[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.TIME_ARRAY, super.readTimeArray);
    }

    readDateArray(fieldName: string): LocalDate[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.DATE_ARRAY, super.readDateArray);
    }

    readTimestampArray(fieldName: string): LocalDateTime[] | null {
        return this.validateCompatibleAndRead(fieldName, FieldType.TIMESTAMP_ARRAY, super.readTimestampArray);
    }

    readTimestampWithTimezoneArray(fieldName: string): OffsetDateTime[] | null {
        return this.validateCompatibleAndRead(
            fieldName, FieldType.TIMESTAMP_WITH_TIMEZONE_ARRAY, super.readTimestampWithTimezoneArray
        );
    }

    private validateCompatibleAndRead(fieldName: string,
                                      expectedType: FieldType,
                                      readFn: (fieldName: string) => any): any {
        const fd = this.classDefinition.getField(fieldName);
        if (fd === null) {
            return undefined;
        }
        if (fd.getType() !== expectedType) {
            throw MorphingPortableReader.createIncompatibleClassChangeError(fd, expectedType);
        }
        return readFn.call(this, fieldName);
    }

    private static createIncompatibleClassChangeError(fd: FieldDefinition, expectedType: FieldType): Error {
        return new TypeError(`Incompatible to read ${expectedType} from ${fd.getType()} while reading field : ${fd.getName()}`);
    }
}
