/// <reference types="node" />
import * as Long from 'long';
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
    writeBooleanArray(val: boolean[] | null): void;
    writeByte(byte: number): void;
    writeByteArray(bytes: Buffer | null): void;
    writeChar(char: string): void;
    writeCharArray(chars: string[] | null): void;
    writeChars(chars: string): void;
    writeDouble(double: number): void;
    writeDoubleArray(doubles: number[] | null): void;
    writeFloat(float: number): void;
    writeFloatArray(floats: number[] | null): void;
    writeInt(int: number): void;
    writeIntBE(int: number): void;
    writeIntArray(ints: number[] | null): void;
    writeLong(long: Long): void;
    writeLongArray(longs: Long[] | null): void;
    writeObject(object: any): void;
    writeShort(short: number): void;
    writeShortArray(shorts: number[] | null): void;
    /** @deprecated since version 4.2.
     *  This method will be removed in next major version. Please use {@link writeString} instead.
     */
    writeUTF(val: string | null): void;
    /** @deprecated since version 4.2.
     *  This method will be removed in next major version. Please use {@link writeStringArray} instead.
     */
    writeUTFArray(val: string[] | null): void;
    writeString(val: string | null): void;
    writeStringArray(val: string[] | null): void;
    writeZeroBytes(count: number): void;
}
/**
 * Input read helper for {@link IdentifiedDataSerializable} objects.
 */
export interface DataInput {
    isBigEndian(): boolean;
    position(newPosition?: number): number;
    read(pos?: number): number;
    readBoolean(pos?: number): boolean;
    readBooleanArray(pos?: number): boolean[] | null;
    readByte(pos?: number): number;
    readByteArray(pos?: number): Buffer | null;
    readChar(pos?: number): string;
    readCharArray(pos?: number): string[] | null;
    readDouble(pos?: number): number;
    readDoubleArray(pos?: number): number[] | null;
    readFloat(pos?: number): number;
    readFloatArray(pos?: number): number[] | null;
    readInt(pos?: number): number;
    readIntArray(pos?: number): number[] | null;
    readLong(pos?: number): Long;
    readLongArray(pos?: number): Long[] | null;
    readObject(): any;
    readShort(pos?: number): number;
    readShortArray(pos?: number): number[] | null;
    readUnsignedByte(pos?: number): number;
    readUnsignedShort(pos?: number): number;
    /** @deprecated since version 4.2.
     *  This method will be removed in next major version. Please use {@link readString} instead.
     */
    readUTF(pos?: number): string | null;
    /** @deprecated since version 4.2.
     *  This method will be removed in next major version. Please use {@link readStringArray} instead.
     */
    readUTFArray(pos?: number): string[] | null;
    readString(pos?: number): string | null;
    readStringArray(pos?: number): string[] | null;
    reset(): void;
    skipBytes(count: number): void;
    available(): number;
}
