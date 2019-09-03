import * as Long from 'long';
import {Buffer} from 'safe-buffer';
import {UUID} from '../core/UUID';
import {BitsUtil} from '../BitsUtil';

export class FixedSizeTypes {

    public static BYTE_SIZE_IN_BYTES = BitsUtil.BYTE_SIZE_IN_BYTES;
    public static LONG_SIZE_IN_BYTES = BitsUtil.LONG_SIZE_IN_BYTES;
    public static INT_SIZE_IN_BYTES = BitsUtil.INT_SIZE_IN_BYTES;
    public static BOOLEAN_SIZE_IN_BYTES = BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    public static UUID_SIZE_IN_BYTES = BitsUtil.LONG_SIZE_IN_BYTES * 2;

    public static encodeInt(buffer: Buffer, pos: number, value: number, isEndian: boolean = false): void {
        BitsUtil.writeInt32(buffer, pos, value, false);
    }

    public static decodeInt(buffer: Buffer, pos: number): number {
        return BitsUtil.readInt32(buffer, pos, false);
    }

    public static encodeLong(buffer: Buffer, pos: number, value: Long): void {
        BitsUtil.writeLong(buffer, pos, value);
    }

    public static decodeLong(buffer: Buffer, pos: number): Long {
        return BitsUtil.readLong(buffer, pos);
    }

    public static encodeBoolean(buffer: Buffer, pos: number, value: boolean): void {
        BitsUtil.writeInt8(buffer, pos, value ? 1 : 0);
    }

    public static decodeBoolean(buffer: Buffer, pos: number): boolean {
        // tslint:disable-next-line:curly
        if (BitsUtil.readInt8(buffer, pos) === 1)
            return true;
        // tslint:disable-next-line:curly
        else
            return false;
    }

    public static encodeByte(buffer: Buffer, pos: number, value: number): void {
        (buffer as any)[pos]  = value;
    }

    public static decodeByte(buffer: Buffer, pos: number): number {
        return (buffer as any)[pos];
    }

    public static encodeUUID(buffer: Buffer, pos: number, value: UUID): void {
        const mostSigBits = value.mostSignificant;
        const leastSigBits = value.leastSignificant;
        FixedSizeTypes.encodeLong(buffer, pos, mostSigBits);
        FixedSizeTypes.encodeLong(buffer, pos + FixedSizeTypes.LONG_SIZE_IN_BYTES, leastSigBits);
    }

    public static decodeUUID(buffer: Buffer, pos: number): UUID {
        const mostSigBits = FixedSizeTypes.decodeLong(buffer, pos);
        const leastSigBits = FixedSizeTypes.decodeLong(buffer, pos + FixedSizeTypes.LONG_SIZE_IN_BYTES);
        return new UUID(mostSigBits, leastSigBits);
    }

}
