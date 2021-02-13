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

/** @internal */
export interface Data {

    /**
     * Returns serialized representation in a buffer
     */
    toBuffer(): Buffer;

    /**
     * Returns serialization type
     */
    getType(): number;

    /**
     * Returns the total size of data in bytes
     */
    totalSize(): number;

    /**
     * Returns size of internal binary data in bytes
     */
    dataSize(): number;

    /**
     * Returns approximate heap cost of this Data object in bytes
     */
    getHeapCost(): number;

    /**
     * Returns partition hash of serialized object
     */
    getPartitionHash(): number;

    /**
     * Returns true if data has partition hash
     */
    hasPartitionHash(): boolean;

    /**
     * Returns hash code for this data
     */
    hashCode(): number;

    equals(other: Data): boolean;

    /**
     * Returns true if the object is a portable object
     */
    isPortable(): boolean;

}

/**
 * Output write helper for {@link IdentifiedDataSerializable} objects.
 */
export interface DataOutput {

    clear(): void;

    isBigEndian(): boolean;

    position(newPosition?: number): number;

    toBuffer(): Buffer;

    write(byte: number | Buffer): void;

    writeBoolean(val: boolean): void;

    writeBooleanArray(val: boolean[]): void;

    writeByte(byte: number): void;

    writeByteArray(bytes: Buffer): void;

    writeChar(char: string): void;

    writeCharArray(chars: string[]): void;

    writeChars(chars: string): void;

    /** @internal */
    writeData(data: Data): void;

    writeDouble(double: number): void;

    writeDoubleArray(doubles: number[]): void;

    writeFloat(float: number): void;

    writeFloatArray(floats: number[]): void;

    writeInt(int: number): void;

    writeIntBE(int: number): void;

    writeIntArray(ints: number[]): void;

    writeLong(long: Long): void;

    writeLongArray(longs: Long[]): void;

    writeObject(object: any): void;

    writeShort(short: number): void;

    writeShortArray(shorts: number[]): void;

    /** @deprecated since version 4.1.
     * This method will be deprecated in next major version. Please use writeString instead.
     */
    writeUTF(val: string): void;

    /** @deprecated since version 4.1.
     * This method will be deprecated in next major version. Please use writeStringArray instead.
     */
    writeUTFArray(val: string[]): void;

    writeString(val: string): void;

    writeStringArray(val: string[]): void;

    writeZeroBytes(count: number): void;

}

/** @internal */
export interface PositionalDataOutput extends DataOutput {

    pwrite(position: number, byte: number | Buffer): void;

    pwriteBoolean(position: number, val: boolean): void;

    pwriteByte(position: number, byte: number): void;

    pwriteChar(position: number, char: string): void;

    pwriteDouble(position: number, double: number): void;

    pwriteFloat(position: number, float: number): void;

    pwriteInt(position: number, int: number): void;

    pwriteIntBE(position: number, int: number): void;

    pwriteLong(position: number, long: Long): void;

    pwriteShort(position: number, short: number): void;

}

/**
 * Input read helper for {@link IdentifiedDataSerializable} objects.
 */
export interface DataInput {

    isBigEndian(): boolean;

    position(newPosition?: number): number;

    read(pos?: number): number;

    readBoolean(pos?: number): boolean;

    readBooleanArray(pos?: number): boolean[];

    readByte(pos?: number): number;

    readByteArray(pos?: number): Buffer;

    readChar(pos?: number): string;

    readCharArray(pos?: number): string[];

    /** @internal */
    readData(pos?: number): Data;

    readDouble(pos?: number): number;

    readDoubleArray(pos?: number): number[];

    readFloat(pos?: number): number;

    readFloatArray(pos?: number): number[];

    readInt(pos?: number): number;

    readIntArray(pos?: number): number[];

    readLong(pos?: number): Long;

    readLongArray(pos?: number): Long[];

    readObject(): any;

    readShort(pos?: number): number;

    readShortArray(pos?: number): number[];

    readUnsignedByte(pos?: number): number;

    readUnsignedShort(pos?: number): number;

    /** @deprecated since version 4.1.
     * This method will be deprecated in next major version. Please use readString instead.
     */
    readUTF(pos?: number): string;

    /** @deprecated since version 4.1.
     * This method will be deprecated in next major version. Please use readStringArray instead.
     */
    readUTFArray(pos?: number): string[];

    readString(pos?: number): string;

    readStringArray(pos?: number): string[];

    reset(): void;

    skipBytes(count: number): void;

    available(): number;

}
