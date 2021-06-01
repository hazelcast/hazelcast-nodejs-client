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
const expect = chai.expect;
chai.should();
const {
    getTimezoneOffsetFromSeconds,
    leftZeroPadInteger,
    getOffsetSecondsFromTimezoneString,
    getLocalTimeString,
    getLocalDateString
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
        it('should throw RangeError if too low offset is given', function () {
            expect(
                () => getTimezoneOffsetFromSeconds(-80000)
            ).to.throw(RangeError);
        });
        it('should throw RangeError if too high offset is given', function () {
            expect(
                () => getTimezoneOffsetFromSeconds(99999)
            ).to.throw(RangeError);
        });
    });
    describe('getOffsetSecondsFromTimezoneString', function () {
        it('should parse Z correctly', function () {
            expect(
                getOffsetSecondsFromTimezoneString('Z')
            ).to.be.equal(0);
        });

        it('should parse positive offset correctly', function () {
            expect(
                getOffsetSecondsFromTimezoneString('+00:25')
            ).to.be.equal(1500);
        });

        it('should parse big positive offset correctly', function () {
            expect(
                getOffsetSecondsFromTimezoneString('+02:05')
            ).to.be.equal(7500);
        });

        it('should parse negative offset correctly', function () {
            expect(
                getOffsetSecondsFromTimezoneString('-00:19')
            ).to.be.equal(19*-1*60);
        });

        it('should parse big negative offset correctly', function () {
            expect(
                getOffsetSecondsFromTimezoneString('-10:01')
            ).to.be.equal(-(10*3600+60));
        });

        it('should throw if offset more than 18 hours is given', function () {
            expect(() => getOffsetSecondsFromTimezoneString('+19:00')).to.throw(RangeError);
        });

        it('should throw if offset less than -18 hours is given', function () {
            expect(() => getOffsetSecondsFromTimezoneString('-19:00')).to.throw(RangeError);
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
    describe('getLocalDateString', function () {
        it('should convert to string correctly', function () {
            getLocalDateString(2000, 2, 29).should.be.eq('2000-02-29');
            getLocalDateString(2001, 2, 1).should.be.eq('2001-02-01');
            getLocalDateString(35, 2, 28).should.be.eq('0035-02-28');
            getLocalDateString(-100, 3, 31).should.be.eq('-0100-03-31');
            getLocalDateString(-35, 3, 31).should.be.eq('-0035-03-31');
            getLocalDateString(-30205, 3, 31).should.be.eq('-30205-03-31');
            getLocalDateString(30205, 3, 31).should.be.eq('30205-03-31');
        });

        it('should throw RangeError if year is not an integer between -999_999_999-999_999_999(inclusive)',
            function () {
                (() => getLocalDateString(1e9, 1, 1)).should.throw(RangeError, 'Year');
                (() => getLocalDateString(-1e9, 1, 1)).should.throw(RangeError, 'Year');
                (() => getLocalDateString(1.1, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
                (() => getLocalDateString('1', 1, 1)).should.throw(RangeError, 'All arguments must be integers');
                (() => getLocalDateString({1: 1}, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
                (() => getLocalDateString([], 1, 1)).should.throw(RangeError, 'All arguments must be integers');
                (() => getLocalDateString(1e12, 1, 1)).should.throw(RangeError, 'Year');
            });

        it('should throw RangeError if month is not an integer between 0-59(inclusive)', function () {
            (() => getLocalDateString(1, -1, 1)).should.throw(RangeError, 'Month');
            (() => getLocalDateString(1, 1.1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalDateString(1, 233, 1)).should.throw(RangeError, 'Month');
            (() => getLocalDateString(1, '1', 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalDateString(1, {1: 1}, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalDateString(1, [], 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalDateString(1, 13, 1)).should.throw(RangeError, 'Month');
        });

        it('should throw RangeError if date is not an integer between 1-28/31 and it is not valid', function () {
            (() => getLocalDateString(1, 1, -1)).should.throw(RangeError, 'Invalid date');
            (() => getLocalDateString(1, 1, 1.1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalDateString(1, 1, 233)).should.throw(RangeError, 'Invalid date');
            (() => getLocalDateString(1, 1, '1')).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalDateString(1, 1, {1: 1})).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalDateString(1, 1, [])).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalDateString(2001, 2, 29)).should.throw(RangeError, /Invalid.*not a leap year/);
            (() => getLocalDateString(2000, 2, 29)).should.not.throw(RangeError, 'Invalid date');
            (() => getLocalDateString(2001, 4, 31)).should.throw(RangeError, /Invalid.*April/);
            (() => getLocalDateString(2001, 4, 30)).should.not.throw(RangeError, 'Invalid date');
        });
    });
    describe('getLocalTimeString', function () {
        it('should convert to string correctly', function () {
            getLocalTimeString(1, 1, 1, 1).should.be.eq('01:01:01.000000001');
            getLocalTimeString(12, 10, 10, 1).should.be.eq('12:10:10.000000001');
            getLocalTimeString(23, 1, 11, 99999).should.be.eq('23:01:11.000099999');
            getLocalTimeString(23, 1, 11, 0).should.be.eq('23:01:11');
        });
        it('should throw RangeError if hour is not an integer between 0-23(inclusive)', function () {
            (() => getLocalTimeString(-1, 1, 1, 1)).should.throw(RangeError, 'Hour');
            (() => getLocalTimeString(1.1, 1, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(25, 1, 1, 1)).should.throw(RangeError, 'Hour');
            (() => getLocalTimeString('500', 1, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString({}, 1, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString([], 1, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(24, 1, 1, 1)).should.throw(RangeError, 'Hour');
            (() => getLocalTimeString(299, 3, 4, 0)).should.throw(RangeError, 'Hour');
        });

        it('should throw RangeError if minute is not an integer between 0-59(inclusive)', function () {
            (() => getLocalTimeString(1, -1, 1, 1)).should.throw(RangeError, 'Minute');
            (() => getLocalTimeString(1, 1.1, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 233, 1, 1)).should.throw(RangeError, 'Minute');
            (() => getLocalTimeString(1, '1', 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, {1: 1}, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, [], 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 60, 1, 1)).should.throw(RangeError, 'Minute');
        });

        it('should throw RangeError if seconds is not an integer between 0-59(inclusive)', function () {
            (() => getLocalTimeString(1, 1, -1, 1)).should.throw(RangeError, 'Second');
            (() => getLocalTimeString(1, 1, 1.1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 1, 233, 1)).should.throw(RangeError, 'Second');
            (() => getLocalTimeString(1, 1, '1', 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 1, {1: 1}, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 1, [], 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 1, 60, 1)).should.throw(RangeError, 'Second');
        });

        it('should throw RangeError if nano is not an integer between 0-999_999_999(inclusive)', function () {
            (() => getLocalTimeString(1, 1, 1, -1)).should.throw(RangeError, 'Nano');
            (() => getLocalTimeString(1, 1, 1, 1.1)).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 1, 1, 1e23)).should.throw(RangeError, 'Nano');
            (() => getLocalTimeString(1, 1, 1, '1')).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 1, 1, {1: 1})).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 1, 1, [])).should.throw(RangeError, 'All arguments must be integers');
            (() => getLocalTimeString(1, 1, 1, 1e9)).should.throw(RangeError, 'Nano');
        });
    });
});
