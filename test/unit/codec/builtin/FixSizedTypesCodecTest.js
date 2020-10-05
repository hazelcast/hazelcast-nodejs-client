/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

const expect = require('chai').expect;
const {FixSizedTypesCodec} = require('../../../../lib/codec/builtin/FixSizedTypesCodec');
const {BitsUtil} = require('../../../../lib/util/BitsUtil');
const TWO_PWR_63_DBL = 9223372036854776000

describe('FixSizedTypesCodecTest', function () {
    it('should throw error when using negative number', function () {
        expect(() => FixSizedTypesCodec.encodeNonNegativeNumberAsLong(null, 0, -5)).to.throw
    });

    it('should encode value as long and then decode it back', function () {
        var buffer = Buffer.alloc(12)
        FixSizedTypesCodec.encodeNonNegativeNumberAsLong(buffer, 0, 12)
        let decodeNumberFromLong = FixSizedTypesCodec.decodeNumberFromLong(buffer, 0);
        expect(decodeNumberFromLong).to.equal(12)
    });

    it('should encode max value when value greater or equals than TWO_PWR_63_DBL then decode it back', function () {
        var buffer = Buffer.allocUnsafe(9 * BitsUtil.LONG_SIZE_IN_BYTES)
        FixSizedTypesCodec.encodeNonNegativeNumberAsLong(buffer, 0, TWO_PWR_63_DBL)
        let decodeNumberFromLong = FixSizedTypesCodec.decodeNumberFromLong(buffer, 0);
        expect(decodeNumberFromLong).to.equal(TWO_PWR_63_DBL)
    });
});
