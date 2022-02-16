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
/** @ignore *//** */

import {Schema} from './Schema';
import * as Long from 'long';
import {BitsUtil} from '../../util/BitsUtil';
import {Buffer} from 'buffer';

export const INIT =  Long.fromString('0xc15d213aa4d7a795', false, 16);
const FP_TABLE = new Array<Long>(256);

for (let i = 0; i < 256; i++) {
    let fp: Long = Long.fromNumber(i);
    for (let j = 0; j < 8; j++) {
        fp = (fp.shiftRightUnsigned(1)).xor(INIT.and(fp.and(Long.ONE).negate()));
    }
    FP_TABLE[i] = fp;
}

/**
 * Used in tests.
 * @internal
 */
export const RabinFingerprintBytes = (buffer: Buffer): Long => {
    let fp: Long = INIT;
    for (const byte of buffer) {
        fp = RabinFingerPrintLongByte(fp, byte);
    }
    return fp;
};

/**
 * A very collision-resistant fingerprint method used to create automatic
 * schema ids for the Compact format.
 * @internal
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

/**
 * Used by RabinFingerprint64
 * @internal
 */
export const RabinFingerPrintLongString = (fp: Long, value: string | null): Long => {
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

/**
 * Used by RabinFingerprint64
 * @internal
 */
export const RabinFingerPrintLongInt = (fp: Long, int: number) : Long =>  {
    fp = RabinFingerPrintLongByte(fp, int & 0xff);
    fp = RabinFingerPrintLongByte(fp, (int >> 8) & 0xff);
    fp = RabinFingerPrintLongByte(fp, (int >> 16) & 0xff);
    fp = RabinFingerPrintLongByte(fp, (int >> 24) & 0xff);
    return fp;
}

/**
 * Used by RabinFingerprint64
 * @internal
 */
export const RabinFingerPrintLongByte = (fp: Long, byte: number) : Long => {
    return fp.shiftRightUnsigned(8).xor(FP_TABLE[fp.xor(byte).and(Long.fromString('0xff', true, 16)).toNumber()]);
}
