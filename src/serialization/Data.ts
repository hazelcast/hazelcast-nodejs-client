import Promise = Q.Promise;
export interface Data {
    /**
     * Returns serialized representation in a buffer
     */
    toBuffer() : Buffer;

    /**
     * Returns serialization type
     */
    getType() : number;

    /**
     * Returns the total size of data in bytes
     */
    totalSize() : number;

    /**
     * Returns size of internal binary data in bytes
     */
    dataSize() : number;

    /**
     * Returns approximate heap cost of this Data object in bytes
     */
    getHeapCost() : number;

    /**
     * Returns partition hash of serialized object
     */
    getPartitionHash() : number;

    /**
     * Returns true if data has partition hash
     */
    hasPartitionHash() : boolean;

    /**
     * Returns true if the object is a portable object
     */
    isPortable() : boolean;

}

export interface DataOutput {
    clear(): void;
    isBigEndian(): boolean;
    position(newPosition?: number): number;
    toBuffer(): Buffer;
    write(byte: number | Buffer): void;
    writeBoolean(val: boolean): void;
    writeBooleanArray(val: boolean[]): void;
    writeByte(byte: number): void;
    writeByteArray(bytes: number[]): void;
    writeBytes(bytes: string): void;
    writeChar(char: string): void;
    writeCharArray(chars: string[]): void;
    writeChars(chars: string): void;
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
    writeUTF(val: string): void;
    writeUTFArray(val: string[]): void;
    writeZeroBytes(count: number): void;
}

export interface DataInput {
    isBigEndian(): boolean;
    position(newPosition?: number): number;
    read(pos?: number): number;
    readBoolean(pos?: number): boolean;
    readBooleanArray(): boolean[];
    readByte(pos?: number): number;
    readByteArray(): number[];
    readChar(pos?: number): string;
    readCharArray(): string[];
    readData(pos?: number): Data;
    readDouble(pos?: number): number;
    readDoubleArray(): number[];
    readFloat(pos?: number): number;
    readFloatArray(): number[];
    readInt(pos?: number): number;
    readIntArray(): number[];
    readLong(pos?: number): Long;
    readLongArray(): Long[];
    readObject(): any;
    readShort(pos?: number): number;
    readShortArray(): number[];
    readUnsignedByte(pos?: number): number;
    readUnsignedShort(pos?: number): number;
    readUTF(pos?: number): string;
    readUTFArray(): string[];
    reset(): void;
    skipBytes(count: number): void;
}
