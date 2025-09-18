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
exports.murmur = void 0;
/**
 * murmur3 (MurmurHash3_x86_32) hash function to determine partition
 * @internal
 */
function murmur(key) {
    let h1 = 0x01000193; // seed
    let h1b;
    let k1;
    const remainder = key.length & 3; // key.length % 4
    const bytes = key.length - remainder;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let i = 0;
    while (i < bytes) {
        // little-endian load order
        k1 =
            ((key.readUInt8(i) & 0xff)) |
                ((key.readUInt8(++i) & 0xff) << 8) |
                ((key.readUInt8(++i) & 0xff) << 16) |
                ((key.readUInt8(++i) & 0xff) << 24);
        ++i;
        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        // ROTL32(k1,15);
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;
        h1 ^= k1;
        // ROTL32(h1,13);
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }
    // tail
    k1 = 0;
    switch (remainder) {
        case 3:
            k1 ^= (key.readUInt8(i + 2) & 0xff) << 16;
        // fallthrough
        case 2: // eslint-disable-line no-fallthrough
            k1 ^= (key.readUInt8(i + 1) & 0xff) << 8;
        // fallthrough
        case 1: // eslint-disable-line no-fallthrough
            k1 ^= (key.readUInt8(i) & 0xff);
            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            // ROTL32(k1,15);
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }
    // finalization
    h1 ^= key.length;
    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;
    const result = h1 >>> 0;
    // This simulates the 32 bit integer overflow to match Java implementation
    return result | 0;
}
exports.murmur = murmur;
//# sourceMappingURL=Murmur.js.map