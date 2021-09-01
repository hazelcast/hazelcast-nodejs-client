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

const chai = require('chai');
chai.should();
const { BigDecimal } = require('../../../lib/core/BigDecimal');

describe('BigDecimalTest', function () {
    const constructorTestParams = [
        [`1e${Number.MIN_SAFE_INTEGER}`, BigInt(1), -1 * Number.MIN_SAFE_INTEGER],
        [`1e${Number.MAX_SAFE_INTEGER}`, BigInt(1), -1 * Number.MAX_SAFE_INTEGER],
        ['1.123123', BigInt(1123123), 6],
        ['.123123', BigInt(123123), 6],
        ['123000', BigInt(123000), 0],
        ['0', BigInt(0), 0],
        ['-0', BigInt(0), 0],
        ['0E+7', BigInt(0), -7],
        ['0.00', BigInt(0), 2],
        ['123', BigInt(123), 0],
        ['-123', BigInt(-123), 0],
        ['1.23E3', BigInt(123), -1],
        ['1.23E+3', BigInt(123), -1],
        ['12.3E+7', BigInt(123), -6],
        ['12.0', BigInt(120), 1],
        ['12.3', BigInt(123), 1],
        ['-1.23E-12', BigInt(-123), 14],
        ['1234.5E-4', BigInt(12345), 5],
    ];

    const toStringTestParams = [
        ['1.123123', '1.123123'],
        ['.123123', '0.123123'],
        ['12312312.12222223123', '12312312.12222223123'],
        [
            '1.1222222222222222222222222222222222222222312312312312312333333333333331',
            '1.1222222222222222222222222222222222222222312312312312312333333333333331'
        ],
        ['23311.123123', '23311.123123'],
        ['12345123123e-6', '12345.123123'],
        ['12345e3', '12345000'],
    ];

    it('should have working toString method', function () {
        for (const bigDecimalString of toStringTestParams) {
            BigDecimal.fromString(bigDecimalString[0]).toString().should.be.eq(bigDecimalString[1]);
        }
    });

    it('string constructor should construct correctly', function () {
        for (const validBigArray of constructorTestParams) {
            const big = BigDecimal.fromString(validBigArray[0]);
            big.should.be.instanceof(BigDecimal);
            big.unscaledValue.should.be.eq(validBigArray[1]);
            big.scale.should.be.eq(validBigArray[2]);
        }
    });

    it('string constructor should throw on invalid input', function () {
        (() => BigDecimal.fromString(`1e${Number.MAX_SAFE_INTEGER + 1}`)).should.throw(RangeError);
        (() => BigDecimal.fromString(`1e${Number.MIN_SAFE_INTEGER - 1}`)).should.throw(RangeError);
        (() => BigDecimal.fromString('1f123')).should.throw(RangeError);
        (() => BigDecimal.fromString('1ee123')).should.throw(RangeError);
        (() => BigDecimal.fromString('1EE123')).should.throw(RangeError);
        (() => BigDecimal.fromString('1eE123')).should.throw(RangeError);
        (() => BigDecimal.fromString('1Ee123')).should.throw(RangeError);
        (() => BigDecimal.fromString('1..1')).should.throw(RangeError);
        (() => BigDecimal.fromString('1.1.1')).should.throw(RangeError);
        (() => BigDecimal.fromString('e1.123123')).should.throw(RangeError);
        (() => BigDecimal.fromString('')).should.throw(RangeError);
        (() => BigDecimal.fromString('random')).should.throw(RangeError);
        (() => BigDecimal.fromString('1e12e')).should.throw(RangeError);

        (() => BigDecimal.fromString({})).should.throw(TypeError);
        (() => BigDecimal.fromString(null)).should.throw(TypeError);
        (() => BigDecimal.fromString(undefined)).should.throw(TypeError);
        (() => BigDecimal.fromString(BigInt(1))).should.throw(TypeError);
        (() => BigDecimal.fromString(123)).should.throw(TypeError);
    });
});
