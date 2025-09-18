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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUID = void 0;
/**
 * Represents UUIDs used by Hazelcast client. A UUID represents a 128-bit value.
 */
class UUID {
    constructor(mostSig, leastSig) {
        this.mostSignificant = mostSig;
        this.leastSignificant = leastSig;
    }
    equals(other) {
        if (other == null) {
            return false;
        }
        return other.mostSignificant.equals(this.mostSignificant)
            && other.leastSignificant.equals(this.leastSignificant);
    }
    static isUUID(obj) {
        return obj instanceof UUID;
    }
    toString() {
        if (this.cachedString) {
            return this.cachedString;
        }
        const mostHigh = this.mostSignificant.getHighBitsUnsigned(); // (32) 32 32 32
        const mostLow = this.mostSignificant.getLowBitsUnsigned(); // 32 (32) 32 32
        const leastHigh = this.leastSignificant.getHighBitsUnsigned(); // 32 32 (32) 32
        const leastLow = this.leastSignificant.getLowBitsUnsigned(); // 32 32 32 (32)
        const div1 = mostHigh.toString(16);
        const div2 = (mostLow >>> 16).toString(16);
        const div3 = (mostLow & ((1 << 16) - 1)).toString(16);
        const div4 = (leastHigh >>> 16).toString(16);
        const div5 = (leastHigh & ((1 << 16) - 1)).toString(16) + leastLow.toString(16).padStart(8, '0');
        this.cachedString = div1.padStart(8, '0') + '-'
            + div2.padStart(4, '0') + '-'
            + div3.padStart(4, '0') + '-'
            + div4.padStart(4, '0') + '-'
            + div5.padStart(12, '0');
        return this.cachedString;
    }
}
exports.UUID = UUID;
//# sourceMappingURL=UUID.js.map