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

import {Buffer} from 'buffer';

/**
 * Converts buffer to bigint
 * @param buffer
 */
export function bufferToBigInt(buffer: Buffer): BigInt {
    const isNegative = (buffer[0] & 0x80) > 0;
    if (isNegative) { // negative, convert two's complement to positive
        for (let i = 0; i < buffer.length; i++) {
            buffer[i] = ~buffer[i];
        }
    }
    const hexString = '0x' + buffer.toString('hex');

    let bigint = BigInt(hexString);
    if (isNegative) {
        // When converting from 2 s complement, need to add 1 to the inverted bits.
        // Since adding 1 to a buffer is hard, it is done here.
        bigint += BigInt(1);
    }

    if (isNegative) {
        bigint *= -BigInt(1);
    }

    return bigint;
}

export function bigintToBuffer(bigintValue: BigInt): Buffer {
    // Using toString(16) is problematic since it does not return two's complement

    const isNegative = bigintValue < BigInt(0);
    let hex;

    // for getting two's complement of it
    if (isNegative) {
        bigintValue = bigintValue.valueOf() + BigInt(1); // for two's complement representation, add 1. we'll negate later
        hex = bigintValue.toString(16).slice(1); // exclude minus sign
    } else {
        hex = bigintValue.toString(16);
    }

    // prepend 0 to get a even length string
    if (hex.length % 2) {
        hex = '0' + hex;
    }

    // we need to add the zero byte if the value is positive
    // js BigInt toString(16) omits it
    hex = '00' + hex;

    const numberOfBytes = hex.length / 2;
    const byteArray = new Array(numberOfBytes);

    let i = 0;
    let j = 0;
    while (i < numberOfBytes) {
        const byte = parseInt(hex.slice(j, j + 2), 16);
        byteArray[i] = isNegative ? ~byte : byte; // for two's complement
        i += 1;
        j += 2;
    }
    return Buffer.from(byteArray);
}
