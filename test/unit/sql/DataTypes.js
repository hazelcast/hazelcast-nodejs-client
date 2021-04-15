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
const { HzLocalTime, HzLocalDate, HzLocalDateTime, HzOffsetDateTime } = require('../../../lib/sql/DataTypes');
const { IllegalArgumentError } = require('../../../lib/core/HazelcastError');

describe('DataTypesTest', function () {
    describe('HzLocalTimeTest', function () {
        it('should return hour, minute and seconds correctly', function () {
            const newHzTime = new HzLocalTime(2, 3, 4, 60000);
            expect(newHzTime.getHour()).to.be.equal(2);
            expect(newHzTime.getMinute()).to.be.equal(3);
            expect(newHzTime.getSecond()).to.be.equal(4);
            expect(newHzTime.getNano()).to.be.equal(60000);
        });

        it('should throw IllegalArgumentError if hour is not an integer between 0-23(inclusive)', function () {
            expect(() => new HzLocalTime(-1, 1, 1, 1)).to.throw(IllegalArgumentError, 'Hour');
            expect(() => new HzLocalTime(1.1, 1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(25, 1, 1, 1)).to.throw(IllegalArgumentError, 'Hour');
            expect(() => new HzLocalTime('500', 1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime({}, 1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime([], 1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(24, 1, 1, 1)).to.throw(IllegalArgumentError, 'Hour');
        });

        it('should throw IllegalArgumentError if minute is not an integer between 0-59(inclusive)', function () {
            expect(() => new HzLocalTime(1, -1, 1, 1)).to.throw(IllegalArgumentError, 'Minute');
            expect(() => new HzLocalTime(1, 1.1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 233, 1, 1)).to.throw(IllegalArgumentError, 'Minute');
            expect(() => new HzLocalTime(1, '1', 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, {1: 1}, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, [], 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 60, 1, 1)).to.throw(IllegalArgumentError, 'Minute');
        });

        it('should throw IllegalArgumentError if seconds is not an integer between 0-59(inclusive)', function () {
            expect(() => new HzLocalTime(1, 1, -1, 1)).to.throw(IllegalArgumentError, 'Second');
            expect(() => new HzLocalTime(1, 1, 1.1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 1, 233, 1)).to.throw(IllegalArgumentError, 'Second');
            expect(() => new HzLocalTime(1, 1, '1', 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 1, {1: 1}, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 1, [], 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 1, 60, 1)).to.throw(IllegalArgumentError, 'Second');
        });

        it('should throw IllegalArgumentError if nano is not an integer between 0-999_999_999(inclusive)', function () {
            expect(() => new HzLocalTime(1, 1, 1, -1)).to.throw(IllegalArgumentError, 'Nano');
            expect(() => new HzLocalTime(1, 1, 1, 1.1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 1, 1, 1e23)).to.throw(IllegalArgumentError, 'Nano');
            expect(() => new HzLocalTime(1, 1, 1, '1')).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 1, 1, {1: 1})).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 1, 1, [])).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalTime(1, 1, 1, 1e9)).to.throw(IllegalArgumentError, 'Nano');
        });

        it('should convert to string correctly', function () {
            expect(new HzLocalTime(1, 1, 1, 1).toString()).to.be.eq('01:01:01.000000001');
            expect(new HzLocalTime(12, 10, 10, 1).toString()).to.be.eq('12:10:10.000000001');
            expect(new HzLocalTime(23, 1, 11, 99999).toString()).to.be.eq('23:01:11.000099999');
            expect(new HzLocalTime(23, 1, 11, 0).toString()).to.be.eq('23:01:11');
        });

        it('should construct from string correctly', function () {
            const localtime1 = HzLocalTime.fromString('23:41:01.000000001');
            expect(localtime1.getNano()).to.be.eq(1);
            expect(localtime1.getSecond()).to.be.eq(1);
            expect(localtime1.getMinute()).to.be.eq(41);
            expect(localtime1.getHour()).to.be.eq(23);

            const localtime2 = HzLocalTime.fromString('00:00:02');
            expect(localtime2.getNano()).to.be.eq(0);
            expect(localtime2.getSecond()).to.be.eq(2);
            expect(localtime2.getMinute()).to.be.eq(0);
            expect(localtime2.getHour()).to.be.eq(0);

            // Nano has 10 digits, first 9 digits is considered.
            expect(HzLocalTime.fromString('23:41:01.0000011111').getNano()).to.be.eq(1111);
            expect(HzLocalTime.fromString('23:01:01.0000000001').getNano()).to.be.eq(0);

            // invalid hour
            expect(() => HzLocalTime.fromString('24:01:01.000000001')).to.throw(IllegalArgumentError);
            // invalid minute
            expect(() => HzLocalTime.fromString('23:71:01.000000001')).to.throw(IllegalArgumentError);
            // invalid second
            expect(() => HzLocalTime.fromString('23:01:71.000000001')).to.throw(IllegalArgumentError);
            // invalid format
            expect(() => HzLocalTime.fromString('23:0171')).to.throw(IllegalArgumentError);
            expect(() => HzLocalTime.fromString('-')).to.throw(IllegalArgumentError);
            expect(() => HzLocalTime.fromString(1)).to.throw(IllegalArgumentError, 'String expected');
        });

        const hzTime = new HzLocalTime(1, 2, 3, 4);

        it('should return hour correctly', function () {
            expect(hzTime.getHour()).to.be.eq(1);
        });

        it('should return minute correctly', function () {
            expect(hzTime.getMinute()).to.be.eq(2);
        });

        it('should return second correctly', function () {
            expect(hzTime.getSecond()).to.be.eq(3);
        });

        it('should return nano correctly', function () {
            expect(hzTime.getNano()).to.be.eq(4);
        });
    });
    describe('HzLocalDateTest', function () {
        it('should return hour, minute and seconds correctly', function () {
            const newHzDate = new HzLocalDate(12, 3, 4);
            expect(newHzDate.getYear()).to.be.equal(12);
            expect(newHzDate.getMonth()).to.be.equal(3);
            expect(newHzDate.getDate()).to.be.equal(4);
        });

        it('should throw IllegalArgumentError if year is not an integer between -999_999_999-999_999_999(inclusive)',
            function () {
            expect(() => new HzLocalDate(1e9, 1, 1)).to.throw(IllegalArgumentError, 'Year');
            expect(() => new HzLocalDate(-1e9, 1, 1)).to.throw(IllegalArgumentError, 'Year');
            expect(() => new HzLocalDate(1.1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate('1', 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate({1: 1}, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate([], 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate(1e12, 1, 1)).to.throw(IllegalArgumentError, 'Year');

        });

        it('should throw IllegalArgumentError if month is not an integer between 0-59(inclusive)', function () {
            expect(() => new HzLocalDate(1, -1, 1)).to.throw(IllegalArgumentError, 'Month');
            expect(() => new HzLocalDate(1, 1.1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate(1, 233, 1)).to.throw(IllegalArgumentError, 'Month');
            expect(() => new HzLocalDate(1, '1', 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate(1, {1: 1}, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate(1, [], 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate(1, 13, 1)).to.throw(IllegalArgumentError, 'Month');
        });

        it('should throw IllegalArgumentError if date is not an integer between 1-28/31 and it is not valid', function () {
            expect(() => new HzLocalDate(1, 1, -1)).to.throw(IllegalArgumentError, 'Invalid date');
            expect(() => new HzLocalDate(1, 1, 1.1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate(1, 1, 233)).to.throw(IllegalArgumentError, 'Invalid date');
            expect(() => new HzLocalDate(1, 1, '1')).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate(1, 1, {1: 1})).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate(1, 1, [])).to.throw(IllegalArgumentError, 'All arguments must be integers');
            expect(() => new HzLocalDate(2001, 2, 29)).to.throw(IllegalArgumentError, /Invalid.*not a leap year/);
            expect(() => new HzLocalDate(2000, 2, 29)).not.to.throw(IllegalArgumentError, 'Invalid date');
            expect(() => new HzLocalDate(2001, 4, 31)).to.throw(IllegalArgumentError, /Invalid.*April/);
            expect(() => new HzLocalDate(2001, 4, 30)).not.to.throw(IllegalArgumentError, 'Invalid date');
        });

        it('should convert to string correctly', function () {
            expect(new HzLocalDate(2000, 2, 29).toString()).to.be.eq('2000-02-29');
            expect(new HzLocalDate(2001, 2, 1).toString()).to.be.eq('2001-02-01');
            expect(new HzLocalDate(35, 2, 28).toString()).to.be.eq('0035-02-28');
            expect(new HzLocalDate(-100, 3, 31).toString()).to.be.eq('-100-03-31');
        });

        it.skip('should return year correctly', function () {
            // getYear
        });
        it.skip('should return month correctly', function () {
            // getMonth
        });
        it.skip('should return date correctly', function () {
            // getDate
        });

        it.skip('should construct from string correctly', function () {
            // fromString
        });
    });
    describe('HzLocalDateTimeTest', function () {
        const dateTime1 = new HzLocalDateTime(new HzLocalDate(2000, 2, 29), new HzLocalTime(2, 3, 4, 6000000));
        const dateTime2 = new HzLocalDateTime(new HzLocalDate(2000, 2, 29), new HzLocalTime(2, 3, 4, 0));

        it('should return parse values correctly', function () {
            expect(dateTime1.getHzLocalDate().getYear()).to.be.equal(2000);
            expect(dateTime1.getHzLocalDate().getMonth()).to.be.equal(2);
            expect(dateTime1.getHzLocalDate().getDate()).to.be.equal(29);
            expect(dateTime1.getHzLocalTime().getHour()).to.be.equal(2);
            expect(dateTime1.getHzLocalTime().getMinute()).to.be.equal(3);
            expect(dateTime1.getHzLocalTime().getSecond()).to.be.equal(4);
            expect(dateTime1.getHzLocalTime().getNano()).to.be.equal(6000000);
        });

        it.skip('should throw IllegalArgumentError if local time is not valid', function () {

        });

        it.skip('should throw IllegalArgumentError if local date is not valid', function () {

        });

        it.skip('should construct from iso string correctly', function () {
            // fromISOString
        });

        it.skip('should return local time correctly', function () {
            // getHzLocalTime
        });

        it.skip('should return local date correctly', function () {
            // getHzLocalDate
        });

        it('should convert to string correctly', function () {
            expect(dateTime1.toString()).to.be.eq('2000-02-29T02:03:04.006000000');
            expect(dateTime2.toString()).to.be.eq('2000-02-29T02:03:04');
        });

    });
    describe('HzOffsetDateTimeTest', function () {
        const dateTime1 = new HzOffsetDateTime(new Date(Date.UTC(2000, 2, 29, 2, 3, 4, 6)), 1000);
        const dateTime2 = HzOffsetDateTime.fromISOString('2000-02-29T02:03:04+01:30');
        const dateTime3 = HzOffsetDateTime.fromHzLocalDateTime(
            new HzLocalDateTime(new HzLocalDate(2000, 2, 29), new HzLocalTime(2, 3, 4, 12)),
            1800
        );

        it('should return parse values correctly', function () {
            expect(dateTime1.getHzLocalDateTime().getHzLocalDate().getYear()).to.be.equal(2000);
            expect(dateTime1.getHzLocalDateTime().getHzLocalDate().getMonth()).to.be.equal(2);
            expect(dateTime1.getHzLocalDateTime().getHzLocalDate().getDate()).to.be.equal(29);
            expect(dateTime1.getHzLocalDateTime().getHzLocalTime().getHour()).to.be.equal(2);
            expect(dateTime1.getHzLocalDateTime().getHzLocalTime().getMinute()).to.be.equal(3);
            expect(dateTime1.getHzLocalDateTime().getHzLocalTime().getSecond()).to.be.equal(4);
            expect(dateTime1.getHzLocalDateTime().getHzLocalTime().getNano()).to.be.equal(6000000);
        });

        it('should throw IllegalArgumentError if date is invalid', function () {
            expect(() => new HzOffsetDateTime(new Date(-1), 1)).to.throw(IllegalArgumentError, 'Invalid date');
            expect(() => new HzOffsetDateTime(new Date('s', 1))).to.throw(IllegalArgumentError, 'Invalid date');
            expect(() => new HzOffsetDateTime(1, 1)).to.throw(IllegalArgumentError, 'Invalid date');
            expect(() => new HzOffsetDateTime('s', 1)).to.throw(IllegalArgumentError, 'Invalid date');
            expect(() => new HzOffsetDateTime([], 1)).to.throw(IllegalArgumentError, 'Invalid date');
        });

        it('should throw IllegalArgumentError if offset is not an integer between -64800-64800', function () {
            expect(() => new HzOffsetDateTime(new Date(), '1')).to.throw(IllegalArgumentError, 'Offset');
            expect(() => new HzOffsetDateTime(new Date(), 90000)).to.throw(IllegalArgumentError, 'Offset');
            expect(() => new HzOffsetDateTime(new Date(), [])).to.throw(IllegalArgumentError, 'Offset');
            expect(() => new HzOffsetDateTime(new Date(), -90000)).to.throw(IllegalArgumentError, 'Offset');
            expect(() => new HzOffsetDateTime(new Date(), {})).to.throw(IllegalArgumentError, 'Offset');
        });

        it('should convert to date correctly', function () {
            expect(dateTime1.asDate().getTime()).to.be.eq(
                new Date(Date.UTC(2000, 2, 29, 2, 3, 4, 6)-1000*1000).getTime()
            );
            expect(dateTime3.asDate().getTime()).to.be.eq(
                new Date(Date.UTC(2000, 2, 29, 2, 3, 4, 0)- 1800*1000).getTime()
            );
            expect(dateTime2.asDate().getTime()).to.be.eq(
                new Date(Date.UTC(2000, 2, 29, 2, 3, 4, 0)-5400*1000).getTime()
            );
        });

        it('should convert to string correctly', function () {
            expect(dateTime1.toString()).to.be.eq('2000-02-29T02:03:04.006000000+00:16');
            expect(dateTime2.toString()).to.be.eq('2000-02-29T02:03:04+01:30');
            expect(dateTime3.toString()).to.be.eq('2000-02-29T02:03:04.000000012+00:30');
        });

        it.skip('should construct from iso string correctly', function () {
            // fromISOString
        });
        it.skip('should construct from fromHzLocalDateTime correctly', function () {
            // fromHzLocalDateTime
        });

        it.skip('should return offset correctly', function () {
            // getOffsetSeconds
        });
        it.skip('should return hzlocaldatetime correctly', function () {
            // getHzLocalDateTime
        });

    });
});
