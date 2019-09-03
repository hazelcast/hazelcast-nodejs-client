/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

export class UUID {
    readonly leastSignificant: Long;
    readonly mostSignificant: Long;

    constructor(mostSig: Long, leastSig: Long) {
        this.mostSignificant = mostSig;
        this.leastSignificant = leastSig;
    }

    equals(other: UUID): boolean {
        if (other == null) {
            return false;
        }
        return other.mostSignificant.equals(this.mostSignificant) && other.leastSignificant.equals(this.leastSignificant);
    }

    /* tslint:disable:no-bitwise */
    toString(): string {
        const mostHigh = this.mostSignificant.getHighBitsUnsigned(); // (32) 32 32 32
        const mostLow = this.mostSignificant.getLowBitsUnsigned(); // 32 (32) 32 32
        const leastHigh = this.leastSignificant.getHighBitsUnsigned(); // 32 32 (32) 32
        const leastLow = this.leastSignificant.getLowBitsUnsigned(); // 32 32 32 (32)

        const div1 = mostHigh.toString(16);
        const div2 = (mostLow >>> 16).toString(16);
        const div3 = (mostLow & ((1 << 16) - 1)).toString(16);
        const div4 = (leastHigh >>> 16).toString(16);
        const div5 = (leastHigh & ((1 << 16) - 1)).toString(16) + leastLow.toString(16);
        return div1 + '-' + div2 + '-' + div3 + '-' + div4 + '-' + div5;
    }

    // tslint:disable-next-line:comment-format
    fromString(name: string): UUID {    //yanlis sonuc
    const len: number = name.length;
    if (len > 36) {
        // tslint:disable-next-line:comment-format
    //throw new IllegalArgumentException("UUID string too large");
}
    const component = name.split('-');

    let mostSigBits: number = Long.fromString(component[0], true, 16).toNumber() & 0xffffffff;
    mostSigBits <<= 16;
    mostSigBits |= Long.fromString(component[1], true, 16).toNumber() & 0xffff;
    mostSigBits <<= 16;
    mostSigBits |= Long.fromString(component[2], true, 16).toNumber() & 0xffff;
    let leastSigBits: number = Long.fromString(component[3], true, 16).toNumber() & 0xffff;
    leastSigBits <<= 48;
    leastSigBits |= Long.fromString(component[4], true, 16).toNumber() & 0xffffffffffff;

    return new UUID(Long.fromNumber(mostSigBits), Long.fromNumber(leastSigBits));
    }

}
