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

import * as Long from 'long';

/**
 * Portable field type.
 */
export enum FieldType {
    PORTABLE = 0,
    BYTE = 1,
    BOOLEAN = 2,
    CHAR = 3,
    SHORT = 4,
    INT = 5,
    LONG = 6,
    FLOAT = 7,
    DOUBLE = 8,
    UTF = 9, // Defined for backwards compatibility.
    STRING = 9,
    PORTABLE_ARRAY = 10,
    BYTE_ARRAY = 11,
    BOOLEAN_ARRAY = 12,
    CHAR_ARRAY = 13,
    SHORT_ARRAY = 14,
    INT_ARRAY = 15,
    LONG_ARRAY = 16,
    FLOAT_ARRAY = 17,
    DOUBLE_ARRAY = 18,
    UTF_ARRAY = 19, // Defined for backwards compatibility.
    STRING_ARRAY = 19
}

/**
 * Writer helper for {@link Portable} objects.
 */
export interface PortableWriter {
    writeInt(fieldName: string, value: number): void;

    writeLong(fieldName: string, long: Long): void;

    /** @deprecated since version 4.1.
     * This method will be deprecated in next major version. Please use writeString instead.
     */
    writeUTF(fieldName: string, str: string): void;

    writeString(fieldName: string, str: string): void;

    writeBoolean(fieldName: string, value: boolean): void;

    writeByte(fieldName: string, value: number): void;

    writeChar(fieldName: string, char: string): void;

    writeDouble(fieldName: string, double: number): void;

    writeFloat(fieldName: string, float: number): void;

    writeShort(fieldName: string, value: number): void;

    writePortable(fieldName: string, portable: Portable): void;

    writeNullPortable(fieldName: string, factoryId: number, classId: number): void;

    writeByteArray(fieldName: string, bytes: Buffer): void;

    writeBooleanArray(fieldName: string, booleans: boolean[]): void;

    writeCharArray(fieldName: string, chars: string[]): void;

    writeIntArray(fieldName: string, ints: number[]): void;

    writeLongArray(fieldName: string, longs: Long[]): void;

    writeDoubleArray(fieldName: string, doubles: number[]): void;

    writeFloatArray(fieldName: string, floats: number[]): void;

    writeShortArray(fieldName: string, shorts: number[]): void;

    /** @deprecated since version 4.1.
     * This method will be deprecated in next major version. Please use writeStringArray instead.
     */
    writeUTFArray(fieldName: string, val: string[]): void;

    writeStringArray(fieldName: string, val: string[]): void;

    writePortableArray(fieldName: string, portables: Portable[]): void;
}

/**
 * Reader helper for {@link Portable} objects.
 */
export interface PortableReader {
    getVersion(): number;

    hasField(fieldName: string): boolean;

    getFieldNames(): string[];

    getFieldType(fieldName: string): FieldType;

    readInt(fieldName: string): number;

    readLong(fieldName: string): Long;

    /** @deprecated since version 4.1.
     * This method will be deprecated in next major version. Please use readString instead.
     */
    readUTF(fieldName: string): string;

    readString(fieldName: string): string;

    readBoolean(fieldName: string): boolean;

    readByte(fieldName: string): number;

    readChar(fieldName: string): string;

    readDouble(fieldName: string): number;

    readFloat(fieldName: string): number;

    readShort(fieldName: string): number;

    readPortable(fieldName: string): Portable;

    readByteArray(fieldName: string): Buffer;

    readBooleanArray(fieldName: string): boolean[];

    readCharArray(fieldName: string): string[];

    readIntArray(fieldName: string): number[];

    readLongArray(fieldName: string): Long[];

    readDoubleArray(fieldName: string): number[];

    readFloatArray(fieldName: string): number[];

    readShortArray(fieldName: string): number[];

    /** @deprecated since version 4.1.
     * This method will be deprecated in next major version. Please use readStringArray instead.
     */
    readUTFArray(fieldName: string): string[];

    readStringArray(fieldName: string): string[];

    readPortableArray(fieldName: string): Portable[];
}

/**
 * Interface for objects with Portable serialization support.
 */
export interface Portable {

    /**
     * Factory id of the portable object.
     */
    factoryId: number;

    /**
     * Class id of the portable object.
     */
    classId: number;

    /**
     * Reads fields of the portable object from the binary representation.
     *
     * @param reader read helper
     */
    readPortable(reader: PortableReader): void;

    /**
     * Writes fields of the portable object into the binary representation.
     *
     * @param writer write helper
     */
    writePortable(writer: PortableWriter): void;

}

/**
 * Interface for Portable serialization with multiversion support.
 */
export interface VersionedPortable extends Portable {

    /**
     * Version of the portable object.
     */
    version: number;

}

/**
 * Factory function for {@link Portable}. Should return
 * an instance of the right {@link Portable} object, given
 * the matching `classId`.
 *
 * @param classId class id
 * @returns object for further initialization
 */
export type PortableFactory = (classId: number) => Portable;
