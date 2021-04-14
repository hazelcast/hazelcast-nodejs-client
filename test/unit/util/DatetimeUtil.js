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
const {
    getTimezoneOffsetFromSeconds,
    leftZeroPadInteger
} = require('../../../lib/util/DatetimeUtil');

describe('DatetimeUtilTest', function () {
    describe('getTimezoneOffsetFromSecondsTest', function () {
        it('should extract 0 seconds correctly', function () {
            expect(
                getTimezoneOffsetFromSeconds(0)
            ).to.be.equal('Z');
        });

        it('should extract positive seconds correctly', function () {
            expect(
                getTimezoneOffsetFromSeconds(1500)
            ).to.be.equal('+00:25');
        });

        it('should extract big positive seconds correctly', function () {
            expect(
                getTimezoneOffsetFromSeconds(7502)
            ).to.be.equal('+02:05');
        });

        it('should extract negative seconds correctly', function () {
            expect(
                getTimezoneOffsetFromSeconds(-1199)
            ).to.be.equal('-00:19');
        });

        it('should extract big negative seconds correctly', function () {
            expect(
                getTimezoneOffsetFromSeconds(-36061)
            ).to.be.equal('-10:01');
        });
        it('should give -18:00 if too low offset is given', function () {
            expect(
                getTimezoneOffsetFromSeconds(-80000)
            ).to.be.equal('-18:00');
        });
        it('should give +18:00 if too high offset is given', function () {
            expect(
                getTimezoneOffsetFromSeconds(99999)
            ).to.be.equal('+18:00');
        });
    });
    describe('leftZeroPadIntegerTest', function () {
        it('should pad length of 5 digits correctly', function () {
            expect(
                leftZeroPadInteger(123, 5)
            ).to.be.equal('00123');
        });

        it('should not change number if its length is same with desired length', function () {
            expect(
                leftZeroPadInteger(12345, 5)
            ).to.be.equal('12345');
        });

        it('should not change number if its length is longer than desired length', function () {
            expect(
                leftZeroPadInteger(123456, 5)
            ).to.be.equal('123456');
        });

    });
});
