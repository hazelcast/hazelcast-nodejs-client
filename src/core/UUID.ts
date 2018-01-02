/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

    equals(other: UUID) {
        if (other == null) {
            return false;
        }
        return other.mostSignificant.equals(this.mostSignificant) && other.leastSignificant.equals(this.leastSignificant);
    }

    /* tslint:disable:no-bitwise */
    toString(): string {
        let mostHigh = this.mostSignificant.getHighBitsUnsigned(); // (32) 32 32 32
        let mostLow = this.mostSignificant.getLowBitsUnsigned(); // 32 (32) 32 32
        let leastHigh = this.leastSignificant.getHighBitsUnsigned(); // 32 32 (32) 32
        let leastLow = this.leastSignificant.getLowBitsUnsigned(); // 32 32 32 (32)

        let div1 = mostHigh.toString(16);
        let div2 = (mostLow >>> 16).toString(16);
        let div3 = (mostLow & ((1 << 16) - 1)).toString(16);
        let div4 = (leastHigh >>> 16).toString(16);
        let div5 = (leastHigh & ((1 << 16) - 1)).toString(16) + leastLow.toString(16);
        return div1 + '-' + div2 + '-' + div3 + '-' + div4 + '-' + div5;
    }
}
