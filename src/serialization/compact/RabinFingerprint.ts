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

import {Schema} from './Schema';
import * as Long from 'long';
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
 * Used to compute rabin fingerprint of compact schema.
 * @internal
 */
export class RabinFingerprint64 {
    /**
     * Used in tests.
     */
    private static ofBuffer(buffer: Buffer): Long {
        let fp: Long = INIT;
        for (const byte of buffer) {
            fp = RabinFingerprint64.ofByte(fp, byte);
        }
        return fp;
    }

    /**
     * A very collision-resistant fingerprint method used to create automatic
     * schema ids for the Compact format.
     */
    static ofSchema(schema: Schema): Long {
        let fp: Long = RabinFingerprint64.ofString(INIT, schema.typeName);
        fp = RabinFingerprint64.ofInt(fp, schema.fieldDefinitionMap.size);
        for (const descriptor of schema.getFields()) {
            fp = RabinFingerprint64.ofString(fp, descriptor.fieldName);
            fp = RabinFingerprint64.ofInt(fp, descriptor.kind);
        }
        return fp;
    }

    private static ofString(fp: Long, value: string): Long {
        const utf8Bytes = Buffer.from(value, 'utf8');
        fp = RabinFingerprint64.ofInt(fp, utf8Bytes.length);
        for (let i = 0; i < utf8Bytes.length; i++) {
            fp = RabinFingerprint64.ofByte(fp, utf8Bytes[i]);
        }
        return fp;
    }

    private static ofInt(fp: Long, int: number) : Long {
        fp = RabinFingerprint64.ofByte(fp, int & 0xff);
        fp = RabinFingerprint64.ofByte(fp, (int >> 8) & 0xff);
        fp = RabinFingerprint64.ofByte(fp, (int >> 16) & 0xff);
        fp = RabinFingerprint64.ofByte(fp, (int >> 24) & 0xff);
        return fp;
    }

    private static ofByte(fp: Long, byte: number) : Long {
        return fp.shiftRightUnsigned(8).xor(FP_TABLE[fp.xor(byte).and(Long.fromString('0xff', true, 16)).toNumber()]);
    }
}
