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
