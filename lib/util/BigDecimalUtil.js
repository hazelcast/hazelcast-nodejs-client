"use strict";
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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigIntToBuffer = exports.bufferToBigInt = void 0;
const buffer_1 = require("buffer");
/**
 * Converts Buffer to BigInt
 * @param buffer
 */
function bufferToBigInt(buffer) {
    // We need to copy the buffer here since in compact serialization there can be several trials of serialization. We don't want
    // our buffer to be modified in the second try.
    const bufferCopy = buffer_1.Buffer.from(buffer);
    const isNegative = (bufferCopy[0] & 0x80) > 0;
    if (isNegative) { // negative, convert two's complement to positive
        for (let i = 0; i < bufferCopy.length; i++) {
            bufferCopy[i] = ~bufferCopy[i];
        }
    }
    const hexString = '0x' + bufferCopy.toString('hex');
    let bigint = BigInt(hexString);
    if (isNegative) {
        // When converting from 2 s complement, need to add 1 to the inverted bits.
        // Since adding 1 to a buffer is hard, it is done here.
        bigint += BigInt(1);
        bigint *= -BigInt(1);
    }
    return bigint;
}
exports.bufferToBigInt = bufferToBigInt;
/**
 * Converts BigInt to Buffer
 * @param big
 */
function bigIntToBuffer(big) {
    // Using toString(16) is problematic since it does not return two's complement
    const isNegative = big < BigInt(0);
    let hex;
    // for getting two's complement of it
    if (isNegative) {
        big = big.valueOf() + BigInt(1); // for two's complement representation, add 1. we'll negate later
        hex = big.toString(16).slice(1); // exclude minus sign
    }
    else {
        hex = big.toString(16);
    }
    // prepend 0 to get a even length string
    if (hex.length % 2) {
        hex = '0' + hex;
    }
    // we need to add the zero byte if the value is positive
    // js BigInt toString(16) omits it
    if (!isNegative) {
        hex = '00' + hex;
    }
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
    return buffer_1.Buffer.from(byteArray);
}
exports.bigIntToBuffer = bigIntToBuffer;
//# sourceMappingURL=BigDecimalUtil.js.map