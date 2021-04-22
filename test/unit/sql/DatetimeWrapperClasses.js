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
const { HzLocalTime, HzLocalDate, HzLocalDateTime, HzOffsetDateTime } = require('../../../lib/sql/DatetimeWrapperClasses');
const { IllegalArgumentError } = require('../../../lib/core/HazelcastError.js');

describe('DatetimeWrapperClassesTest', function () {
    describe('HzLocalTimeTest', function () {
        it('should return hour, minute and seconds correctly', function () {
            const newHzTime = new HzLocalTime(2, 3, 4, 60000);
            newHzTime.getHour().should.be.equal(2);
            newHzTime.getMinute().should.be.equal(3);
            newHzTime.getSecond().should.be.equal(4);
            newHzTime.getNano().should.be.equal(60000);
        });

        it('should throw IllegalArgumentError if hour is not an integer between 0-23(inclusive)', function () {
            (() => new HzLocalTime(-1, 1, 1, 1)).should.throw(IllegalArgumentError, 'Hour');
            (() => new HzLocalTime(1.1, 1, 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(25, 1, 1, 1)).should.throw(IllegalArgumentError, 'Hour');
            (() => new HzLocalTime('500', 1, 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime({}, 1, 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime([], 1, 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(24, 1, 1, 1)).should.throw(IllegalArgumentError, 'Hour');
        });

        it('should throw IllegalArgumentError if minute is not an integer between 0-59(inclusive)', function () {
            (() => new HzLocalTime(1, -1, 1, 1)).should.throw(IllegalArgumentError, 'Minute');
            (() => new HzLocalTime(1, 1.1, 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 233, 1, 1)).should.throw(IllegalArgumentError, 'Minute');
            (() => new HzLocalTime(1, '1', 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, {1: 1}, 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, [], 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 60, 1, 1)).should.throw(IllegalArgumentError, 'Minute');
        });

        it('should throw IllegalArgumentError if seconds is not an integer between 0-59(inclusive)', function () {
            (() => new HzLocalTime(1, 1, -1, 1)).should.throw(IllegalArgumentError, 'Second');
            (() => new HzLocalTime(1, 1, 1.1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 1, 233, 1)).should.throw(IllegalArgumentError, 'Second');
            (() => new HzLocalTime(1, 1, '1', 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 1, {1: 1}, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 1, [], 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 1, 60, 1)).should.throw(IllegalArgumentError, 'Second');
        });

        it('should throw IllegalArgumentError if nano is not an integer between 0-999_999_999(inclusive)', function () {
            (() => new HzLocalTime(1, 1, 1, -1)).should.throw(IllegalArgumentError, 'Nano');
            (() => new HzLocalTime(1, 1, 1, 1.1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 1, 1, 1e23)).should.throw(IllegalArgumentError, 'Nano');
            (() => new HzLocalTime(1, 1, 1, '1')).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 1, 1, {1: 1})).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 1, 1, [])).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalTime(1, 1, 1, 1e9)).should.throw(IllegalArgumentError, 'Nano');
        });

        it('should convert to string correctly', function () {
            (new HzLocalTime(1, 1, 1, 1)).toString().should.be.eq('01:01:01.000000001');
            (new HzLocalTime(12, 10, 10, 1)).toString().should.be.eq('12:10:10.000000001');
            (new HzLocalTime(23, 1, 11, 99999)).toString().should.be.eq('23:01:11.000099999');
            (new HzLocalTime(23, 1, 11, 0)).toString().should.be.eq('23:01:11');
        });

        it('should construct from string correctly', function () {
            const localtime1 = HzLocalTime.fromString('07:35:02.1');
            localtime1.getNano().should.be.eq(100000000);
            localtime1.getSecond().should.be.eq(2);
            localtime1.getMinute().should.be.eq(35);
            localtime1.getHour().should.be.eq(7);

            const localtime2 = HzLocalTime.fromString('00:00:02');
            localtime2.getNano().should.be.eq(0);
            localtime2.getSecond().should.be.eq(2);
            localtime2.getMinute().should.be.eq(0);
            localtime2.getHour().should.be.eq(0);

            // Nano has 10 digits, first 9 digits is considered.
            HzLocalTime.fromString('23:41:01.0000011111').getNano().should.be.eq(1111);
            HzLocalTime.fromString('23:01:01.0000000001').getNano().should.be.eq(0);

            // invalid hour
            (() => HzLocalTime.fromString('24:01:01.000000001')).should.throw(IllegalArgumentError);
            // invalid minute
            (() => HzLocalTime.fromString('23:71:01.000000001')).should.throw(IllegalArgumentError);
            // invalid second
            (() => HzLocalTime.fromString('23:01:71.000000001')).should.throw(IllegalArgumentError);
            // invalid format
            (() => HzLocalTime.fromString('23:0171')).should.throw(IllegalArgumentError);
            (() => HzLocalTime.fromString('-')).should.throw(IllegalArgumentError);
            // Non string
            (() => HzLocalTime.fromString(1)).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalTime.fromString([])).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalTime.fromString({})).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalTime.fromString(null)).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalTime.fromString()).should.throw(IllegalArgumentError, 'String expected');
        });
    });
    describe('HzLocalDateTest', function () {
        it('should return hour, minute and seconds correctly', function () {
            const newHzDate = new HzLocalDate(12, 3, 4);
            newHzDate.getYear().should.be.equal(12);
            newHzDate.getMonth().should.be.equal(3);
            newHzDate.getDate().should.be.equal(4);
        });

        it('should throw IllegalArgumentError if year is not an integer between -999_999_999-999_999_999(inclusive)',
            function () {
            (() => new HzLocalDate(1e9, 1, 1)).should.throw(IllegalArgumentError, 'Year');
            (() => new HzLocalDate(-1e9, 1, 1)).should.throw(IllegalArgumentError, 'Year');
            (() => new HzLocalDate(1.1, 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate('1', 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate({1: 1}, 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate([], 1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate(1e12, 1, 1)).should.throw(IllegalArgumentError, 'Year');
        });

        it('should throw IllegalArgumentError if month is not an integer between 0-59(inclusive)', function () {
            (() => new HzLocalDate(1, -1, 1)).should.throw(IllegalArgumentError, 'Month');
            (() => new HzLocalDate(1, 1.1, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate(1, 233, 1)).should.throw(IllegalArgumentError, 'Month');
            (() => new HzLocalDate(1, '1', 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate(1, {1: 1}, 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate(1, [], 1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate(1, 13, 1)).should.throw(IllegalArgumentError, 'Month');
        });

        it('should throw IllegalArgumentError if date is not an integer between 1-28/31 and it is not valid', function () {
            (() => new HzLocalDate(1, 1, -1)).should.throw(IllegalArgumentError, 'Invalid date');
            (() => new HzLocalDate(1, 1, 1.1)).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate(1, 1, 233)).should.throw(IllegalArgumentError, 'Invalid date');
            (() => new HzLocalDate(1, 1, '1')).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate(1, 1, {1: 1})).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate(1, 1, [])).should.throw(IllegalArgumentError, 'All arguments must be integers');
            (() => new HzLocalDate(2001, 2, 29)).should.throw(IllegalArgumentError, /Invalid.*not a leap year/);
            (() => new HzLocalDate(2000, 2, 29)).should.not.throw(IllegalArgumentError, 'Invalid date');
            (() => new HzLocalDate(2001, 4, 31)).should.throw(IllegalArgumentError, /Invalid.*April/);
            (() => new HzLocalDate(2001, 4, 30)).should.not.throw(IllegalArgumentError, 'Invalid date');
        });

        it('should convert to string correctly', function () {
            (new HzLocalDate(2000, 2, 29)).toString().should.be.eq('2000-02-29');
            (new HzLocalDate(2001, 2, 1)).toString().should.be.eq('2001-02-01');
            (new HzLocalDate(35, 2, 28)).toString().should.be.eq('0035-02-28');
            (new HzLocalDate(-100, 3, 31)).toString().should.be.eq('-100-03-31');
        });

        it('should construct from string correctly', function () {
            const localtime1 = HzLocalDate.fromString('2000-02-29');
            localtime1.getYear().should.be.eq(2000);
            localtime1.getMonth().should.be.eq(2);
            localtime1.getDate().should.be.eq(29);

            const localtime2 = HzLocalDate.fromString('0001-02-03');
            localtime2.getYear().should.be.eq(1);
            localtime2.getMonth().should.be.eq(2);
            localtime2.getDate().should.be.eq(3);

            // invalid month
            (() => HzLocalDate.fromString('2000-24-29')).should.throw(IllegalArgumentError, 'Month');
            // invalid date
            (() => HzLocalDate.fromString('2001-02-29')).should.throw(IllegalArgumentError, 'Invalid date');
            (() => HzLocalDate.fromString('2000-03-32')).should.throw(IllegalArgumentError, 'Invalid date');
            // invalid format
            (() => HzLocalDate.fromString('9999999999-02-29')).should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzLocalDate.fromString('2301-71')).should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzLocalDate.fromString('-')).should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzLocalDate.fromString('2000-02-a')).should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzLocalDate.fromString('00001-02-12')).should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzLocalDate.fromString('0001-002-21')).should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzLocalDate.fromString('0001-02-1')).should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzLocalDate.fromString('0001-2-10')).should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzLocalDate.fromString('1-2-10')).should.throw(IllegalArgumentError, 'Invalid format');
            // Non string
            (() => HzLocalDate.fromString(1)).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalDate.fromString({})).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalDate.fromString([])).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalDate.fromString(null)).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalDate.fromString()).should.throw(IllegalArgumentError, 'String expected');
        });
    });
    describe('HzLocalDateTimeTest', function () {

        it('should return parse values correctly', function () {
            const dateTime1 = new HzLocalDateTime(new HzLocalDate(2000, 2, 29), new HzLocalTime(2, 3, 4, 6000000));

            dateTime1.getHzLocalDate().getYear().should.be.equal(2000);
            dateTime1.getHzLocalDate().getMonth().should.be.equal(2);
            dateTime1.getHzLocalDate().getDate().should.be.equal(29);
            dateTime1.getHzLocalTime().getHour().should.be.equal(2);
            dateTime1.getHzLocalTime().getMinute().should.be.equal(3);
            dateTime1.getHzLocalTime().getSecond().should.be.equal(4);
            dateTime1.getHzLocalTime().getNano().should.be.equal(6000000);
        });

        it('should throw IllegalArgumentError if local time is not valid', function () {
            (() => new HzLocalDateTime(new HzLocalDate(2000, 2, 29), ''))
                .should.throw(IllegalArgumentError, 'Invalid local time');
            (() => new HzLocalDateTime(new HzLocalDate(2000, 2, 29), 100))
                .should.throw(IllegalArgumentError, 'Invalid local time');
            // hour is too big
            (() => new HzLocalDateTime(new HzLocalDate(2000, 2, 29), new HzLocalTime(299, 3, 4, 0)))
                .should.throw(IllegalArgumentError);
        });

        it('should throw IllegalArgumentError if local date is not valid', function () {
            (() => new HzLocalDateTime(1, new HzLocalTime(2, 3, 4, 0))).should.throw(IllegalArgumentError, 'Invalid local date');
            (() => new HzLocalDateTime('', new HzLocalTime(2, 3, 4, 0))).should.throw(IllegalArgumentError, 'Invalid local date');
            // date is not possible
            (() => new HzLocalDateTime(new HzLocalDate(2001, 2, 29), new HzLocalTime(2, 3, 4, 0)))
                .should.throw(IllegalArgumentError);
        });

        it('should construct from iso string correctly', function () {
            const localDatetime1 = HzLocalDateTime.fromISOString('2021-04-15T07:33:04.914456789');
            const localTime1 = localDatetime1.getHzLocalTime();
            const localDate1 = localDatetime1.getHzLocalDate();
            localTime1.getNano().should.be.eq(914456789);
            localTime1.getSecond().should.be.eq(4);
            localTime1.getMinute().should.be.eq(33);
            localTime1.getHour().should.be.eq(7);

            localDate1.getYear().should.be.eq(2021);
            localDate1.getMonth().should.be.eq(4);
            localDate1.getDate().should.be.eq(15);

            // use t instead of T
            const localDatetime2 = HzLocalDateTime.fromISOString('2020-04-15t07:35:02.1');
            const localTime2 = localDatetime2.getHzLocalTime();
            const localDate2 = localDatetime2.getHzLocalDate();
            localTime2.getNano().should.be.eq(100000000);
            localTime2.getSecond().should.be.eq(2);
            localTime2.getMinute().should.be.eq(35);
            localTime2.getHour().should.be.eq(7);

            localDate2.getYear().should.be.eq(2020);
            localDate2.getMonth().should.be.eq(4);
            localDate2.getDate().should.be.eq(15);

            // invalid format
            (() => HzLocalDateTime.fromISOString('23:0171')).should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzLocalDateTime.fromISOString('-')).should.throw(IllegalArgumentError, 'Invalid format');
            // Non string
            (() => HzLocalDateTime.fromISOString(1)).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalDateTime.fromISOString([])).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalDateTime.fromISOString({})).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalDateTime.fromISOString(null)).should.throw(IllegalArgumentError, 'String expected');
            (() => HzLocalDateTime.fromISOString()).should.throw(IllegalArgumentError, 'String expected');
        });

        const dateTime1 = new HzLocalDateTime(new HzLocalDate(2000, 2, 29), new HzLocalTime(2, 3, 4, 6000000));
        it('should return local time correctly', function () {
            dateTime1.getHzLocalTime().toString().should.be.eq(new HzLocalTime(2, 3, 4, 6000000).toString());
        });

        it('should return local date correctly', function () {
            dateTime1.getHzLocalDate().toString().should.be.eq(new HzLocalDate(2000, 2, 29).toString());
        });

        it('should convert to string correctly', function () {
            dateTime1.toString().should.be.eq('2000-02-29T02:03:04.006000000');
        });

    });
    describe('HzOffsetDateTimeTest', function () {

        it('should return parse values correctly', function () {
            const dateTime1 = new HzOffsetDateTime(new Date(Date.UTC(2000, 2, 29, 2, 3, 4, 6)), 1000);

            dateTime1.getHzLocalDateTime().getHzLocalDate().getYear().should.be.equal(2000);
            dateTime1.getHzLocalDateTime().getHzLocalDate().getMonth().should.be.equal(2);
            dateTime1.getHzLocalDateTime().getHzLocalDate().getDate().should.be.equal(29);
            dateTime1.getHzLocalDateTime().getHzLocalTime().getHour().should.be.equal(2);
            dateTime1.getHzLocalDateTime().getHzLocalTime().getMinute().should.be.equal(3);
            dateTime1.getHzLocalDateTime().getHzLocalTime().getSecond().should.be.equal(4);
            dateTime1.getHzLocalDateTime().getHzLocalTime().getNano().should.be.equal(6000000);
            dateTime1.getOffsetSeconds().should.be.equal(1000);
        });

        it('should throw IllegalArgumentError if date is invalid', function () {
            (() => new HzOffsetDateTime(new Date(-1), 1)).should.throw(IllegalArgumentError, 'Invalid date');
            (() => new HzOffsetDateTime(new Date('s', 1))).should.throw(IllegalArgumentError, 'Invalid date');
            (() => new HzOffsetDateTime(1, 1)).should.throw(IllegalArgumentError, 'Invalid date');
            (() => new HzOffsetDateTime('s', 1)).should.throw(IllegalArgumentError, 'Invalid date');
            (() => new HzOffsetDateTime([], 1)).should.throw(IllegalArgumentError, 'Invalid date');
        });

        it('should throw IllegalArgumentError if offset is not an integer between -64800-64800', function () {
            (() => new HzOffsetDateTime(new Date(), '1')).should.throw(IllegalArgumentError, 'Offset');
            (() => new HzOffsetDateTime(new Date(), 90000)).should.throw(IllegalArgumentError, 'Offset');
            (() => new HzOffsetDateTime(new Date(), [])).should.throw(IllegalArgumentError, 'Offset');
            (() => new HzOffsetDateTime(new Date(), -90000)).should.throw(IllegalArgumentError, 'Offset');
            (() => new HzOffsetDateTime(new Date(), {})).should.throw(IllegalArgumentError, 'Offset');
        });

        const dateTime1 = new HzOffsetDateTime(new Date(Date.UTC(2000, 2, 29, 2, 19, 4, 6)), 1000);

        it('should convert to date correctly', function () {
            dateTime1.asDate().toISOString().should.be.eq('2000-02-29T02:02:24.006Z');
        });

        it('should convert to string correctly', function () {
            dateTime1.toISOString().should.be.eq('2000-02-29T02:19:04.006000000+00:16');
        });

        it('should construct from iso string correctly', function () {
            const offsetDatetime1 = HzOffsetDateTime.fromISOString('2000-02-29T02:03:04+01:30');
            const offsetSeconds1 = offsetDatetime1.getOffsetSeconds();
            const localDatetime1 = offsetDatetime1.getHzLocalDateTime();
            const localTime1 = localDatetime1.getHzLocalTime();
            const localDate1 = localDatetime1.getHzLocalDate();

            localDate1.getYear().should.be.eq(2000);
            localDate1.getMonth().should.be.eq(2);
            localDate1.getDate().should.be.eq(29);

            localTime1.getHour().should.be.eq(2);
            localTime1.getMinute().should.be.eq(3);
            localTime1.getSecond().should.be.eq(4);
            localTime1.getNano().should.be.eq(0);

            offsetSeconds1.should.be.eq(90*60);

            // use t instead of T
            const offsetDatetime2 = HzOffsetDateTime.fromISOString('2021-04-15t07:33:04.914+02:30');
            const offsetSeconds2 = offsetDatetime2.getOffsetSeconds();
            const localDatetime2 = offsetDatetime2.getHzLocalDateTime();
            const localTime2 = localDatetime2.getHzLocalTime();
            const localDate2 = localDatetime2.getHzLocalDate();

            localDate2.getYear().should.be.eq(2021);
            localDate2.getMonth().should.be.eq(4);
            localDate2.getDate().should.be.eq(15);

            localTime2.getHour().should.be.eq(7);
            localTime2.getMinute().should.be.eq(33);
            localTime2.getSecond().should.be.eq(4);
            localTime2.getNano().should.be.eq(914*1000000);

            offsetSeconds2.should.be.eq(150*60);

            // Use of Z
            const offsetDatetime3 = HzOffsetDateTime.fromISOString('2021-04-15T07:33:04.914Z');
            const offsetSeconds3 = offsetDatetime3.getOffsetSeconds();
            const localDatetime3 = offsetDatetime3.getHzLocalDateTime();
            const localTime3 = localDatetime3.getHzLocalTime();
            const localDate3 = localDatetime3.getHzLocalDate();

            localDate3.getYear().should.be.eq(2021);
            localDate3.getMonth().should.be.eq(4);
            localDate3.getDate().should.be.eq(15);

            localTime3.getHour().should.be.eq(7);
            localTime3.getMinute().should.be.eq(33);
            localTime3.getSecond().should.be.eq(4);
            localTime3.getNano().should.be.eq(914*1000000);

            offsetSeconds3.should.be.eq(0);

            // invalid format
            (() => HzOffsetDateTime.fromISOString('2021-04-15T07:33:04.914++02:30'))
                .should.throw(IllegalArgumentError, 'Invalid format');
            (() => HzOffsetDateTime.fromISOString('2021-04-15T07:33:04')).should.throw(IllegalArgumentError, 'Invalid format');
            // Non string
            (() => HzOffsetDateTime.fromISOString(1)).should.throw(IllegalArgumentError, 'String expected');
            (() => HzOffsetDateTime.fromISOString([])).should.throw(IllegalArgumentError, 'String expected');
            (() => HzOffsetDateTime.fromISOString({})).should.throw(IllegalArgumentError, 'String expected');
            (() => HzOffsetDateTime.fromISOString(null)).should.throw(IllegalArgumentError, 'String expected');
            (() => HzOffsetDateTime.fromISOString()).should.throw(IllegalArgumentError, 'String expected');
        });
        it('should construct from fromHzLocalDateTime correctly', function () {
            const dateTime3 = HzOffsetDateTime.fromHzLocalDateTime(
                new HzLocalDateTime(new HzLocalDate(2000, 2, 29), new HzLocalTime(2, 3, 4, 12)),
                1800
            );
            dateTime3.toISOString().should.be.eq('2000-02-29T02:03:04.000000012+00:30');
        });
    });
});
