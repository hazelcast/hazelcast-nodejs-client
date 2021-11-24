import {Schema} from './Schema';
import * as Long from 'long';
import {BitsUtil} from '../../util/BitsUtil';
import {Buffer} from 'buffer';

const INIT =  Long.fromString('0xc15d213aa4d7a795', false, 16);
const FP_TABLE = new Array<Long>(256);

for (let i = 0; i < 256; i++) {
    let fp: Long = Long.fromNumber(i);
    for (let j = 0; j < 8; j++) {
        fp = (fp.shiftRightUnsigned(1)).xor(INIT.and(fp.and(Long.ONE).negate()));
    }
    FP_TABLE[i] = fp;
}

/**
 * A very collision-resistant fingerprint method used to create automatic
 * schema ids for the Compact format.
 */
export const RabinFingerprint64 = (schema: Schema): Long => {
    let fp: Long = RabinFingerPrintLongString(INIT, schema.typeName);
    fp = RabinFingerPrintLongInt(fp, schema.fields.length);
    for (const descriptor of schema.fields) {
        fp = RabinFingerPrintLongString(fp, descriptor.fieldName);
        fp = RabinFingerPrintLongInt(fp, descriptor.kind);
    }
    return fp;
};

const RabinFingerPrintLongString = (fp: Long, value: string | null): Long => {
    if (value === null) {
        return RabinFingerPrintLongInt(fp, BitsUtil.NULL_ARRAY_LENGTH);
    }
    const utf8Bytes = Buffer.from(value, 'utf8');
    fp = RabinFingerPrintLongInt(fp, utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
        fp = RabinFingerPrintLongByte(fp, utf8Bytes[i]);
    }
    return fp;
};


const RabinFingerPrintLongInt = (fp: Long, int: number) : Long =>  {
    fp = RabinFingerPrintLongByte(fp, int & 0xff);
    fp = RabinFingerPrintLongByte(fp, (int >> 8) & 0xff);
    fp = RabinFingerPrintLongByte(fp, (int >> 16) & 0xff);
    fp = RabinFingerPrintLongByte(fp, (int >> 24) & 0xff);
    return fp;
}

const RabinFingerPrintLongByte = (fp: Long, byte: number) : Long => {
    return fp.shiftRightUnsigned(8).xor(FP_TABLE[fp.xor(byte).and(Long.fromString('0xff', true, 16)).toNumber()]);
}
