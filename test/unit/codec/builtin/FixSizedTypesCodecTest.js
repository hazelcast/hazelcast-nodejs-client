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
'use strict';

const { expect } = require('chai');
const { FixSizedTypesCodec } = require('../../../../lib/codec/builtin/FixSizedTypesCodec');

describe('FixSizedTypesCodecTest', function () {
    const TWO_PWR_63_DBL = 9223372036854776000;

    it('should throw error when trying to encode negative number as long', function () {
        expect(() => FixSizedTypesCodec.encodeNonNegativeNumberAsLong(null, 0, -5)).to.throw;
    });

    it('should encode non-negative number as long and then decode it back', function () {
        const buffer = Buffer.allocUnsafe(8);
        FixSizedTypesCodec.encodeNonNegativeNumberAsLong(buffer, 0, 12);
        const decodeNumberFromLong = FixSizedTypesCodec.decodeNumberFromLong(buffer, 0);
        expect(decodeNumberFromLong).to.equal(12);
    });

    it('should encode Number.MAX_SAFE_INTEGER as long then decode it back', function () {
        const buffer = Buffer.allocUnsafe(8);
        FixSizedTypesCodec.encodeNonNegativeNumberAsLong(buffer, 0, Number.MAX_SAFE_INTEGER);
        const decodeNumberFromLong = FixSizedTypesCodec.decodeNumberFromLong(buffer, 0);
        expect(decodeNumberFromLong).to.equal(Number.MAX_SAFE_INTEGER);
    });

    it('should encode max value for numbers greater or equal to TWO_PWR_63_DBL then decode it back', function () {
        const buffer = Buffer.allocUnsafe(8);
        FixSizedTypesCodec.encodeNonNegativeNumberAsLong(buffer, 0, TWO_PWR_63_DBL);
        const decodeNumberFromLong = FixSizedTypesCodec.decodeNumberFromLong(buffer, 0);
        expect(decodeNumberFromLong).to.equal(TWO_PWR_63_DBL);
    });

    it('should encode long greater or equal to TWO_PWR_63_DBL then decode it back', function () {
        const buffer = Buffer.allocUnsafe(8);
        FixSizedTypesCodec.encodeLong(buffer, 0, TWO_PWR_63_DBL);
        const decodedLong = FixSizedTypesCodec.decodeLong(buffer, 0);
        expect(decodedLong.toNumber()).to.equal(TWO_PWR_63_DBL);
    });
});
