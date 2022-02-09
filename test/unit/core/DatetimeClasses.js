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
const {
    LocalTime,
    LocalDate,
    LocalDateTime,
    OffsetDateTime,
} = require('../../../lib/core/DateTimeClasses');
const { leftZeroPadInteger } = require('../../../lib/util/DateTimeUtil');

describe('DateTimeClassesTest', function () {
    describe('LocalTimeTest', function () {
        it('should throw if hour is not an integer between 0-23(inclusive)', function () {
            (() => new LocalTime(-1, 1, 1, 1)).should.throw(RangeError, 'Hour');
            (() => new LocalTime(1.1, 1, 1, 1)).should.throw(RangeError, 'All arguments must be integers.');
            (() => new LocalTime(25, 1, 1, 1)).should.throw(RangeError, 'Hour');
            (() => new LocalTime('500', 1, 1, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime({}, 1, 1, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime([], 1, 1, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(24, 1, 1, 1)).should.throw(RangeError, 'Hour');
            (() => new LocalTime(299, 3, 4, 0)).should.throw(RangeError, 'Hour');
        });

        it('should throw RangeError if minute is not an integer between 0-59(inclusive)', function () {
            (() => new LocalTime(1, -1, 1, 1)).should.throw(RangeError, 'Minute');
            (() => new LocalTime(1, 1.1, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => new LocalTime(1, 233, 1, 1)).should.throw(RangeError, 'Minute');
            (() => new LocalTime(1, '1', 1, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(1, { 1: 1 }, 1, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(1, [], 1, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(1, 60, 1, 1)).should.throw(RangeError, 'Minute');
        });

        it('should throw RangeError if seconds is not an integer between 0-59(inclusive)', function () {
            (() => new LocalTime(1, 1, -1, 1)).should.throw(RangeError, 'Second');
            (() => new LocalTime(1, 1, 1.1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => new LocalTime(1, 1, 233, 1)).should.throw(RangeError, 'Second');
            (() => new LocalTime(1, 1, '1', 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(1, 1, { 1: 1 }, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(1, 1, [], 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(1, 1, 60, 1)).should.throw(RangeError, 'Second');
        });

        it('should throw RangeError if nano is not an integer between 0-999_999_999(inclusive)', function () {
            (() => new LocalTime(1, 1, 1, -1)).should.throw(RangeError, 'Nano');
            (() => new LocalTime(1, 1, 1, 1.1)).should.throw(RangeError, 'All arguments must be integers');
            (() => new LocalTime(1, 1, 1, 1e23)).should.throw(RangeError, 'Nano');
            (() => new LocalTime(1, 1, 1, '1')).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(1, 1, 1, { 1: 1 })).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(1, 1, 1, [])).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalTime(1, 1, 1, 1e9)).should.throw(RangeError, 'Nano');
        });

        it('should convert to string correctly', function () {
            new LocalTime(1, 1, 1, 1).toString().should.be.eq('01:01:01.000000001');
            new LocalTime(12, 10, 10, 1).toString().should.be.eq('12:10:10.000000001');
            new LocalTime(23, 1, 11, 99999).toString().should.be.eq('23:01:11.000099999');
            new LocalTime(23, 1, 11, 0).toString().should.be.eq('23:01:11');
        });

        it('should construct from string correctly', function () {
            const localtime1 = LocalTime.fromString('07:35:02.1');
            localtime1.nano.should.be.eq(100000000);
            localtime1.second.should.be.eq(2);
            localtime1.minute.should.be.eq(35);
            localtime1.hour.should.be.eq(7);

            const localtime2 = LocalTime.fromString('00:00:02');
            localtime2.nano.should.be.eq(0);
            localtime2.second.should.be.eq(2);
            localtime2.minute.should.be.eq(0);
            localtime2.hour.should.be.eq(0);

            // Nano has 10 digits, first 9 digits is considered.
            LocalTime.fromString('23:41:01.0000011111').nano.should.be.eq(1111);
            LocalTime.fromString('23:01:01.0000000001').nano.should.be.eq(0);
        });

        it('should throw RangeError on invalid string', function () {
            // invalid hour
            (() => LocalTime.fromString('24:01:01.000000001')).should.throw(RangeError);
            // invalid minute
            (() => LocalTime.fromString('23:71:01.000000001')).should.throw(RangeError);
            // invalid second
            (() => LocalTime.fromString('23:01:71.000000001')).should.throw(RangeError);
            // invalid format
            (() => LocalTime.fromString('23:0171')).should.throw(RangeError);
            (() => LocalTime.fromString('1:1:1')).should.throw(RangeError);
            (() => LocalTime.fromString('-')).should.throw(RangeError);
            // Non string
            (() => LocalTime.fromString(1)).should.throw(TypeError, 'String expected');
            (() => LocalTime.fromString([])).should.throw(TypeError, 'String expected');
            (() => LocalTime.fromString({})).should.throw(TypeError, 'String expected');
            (() => LocalTime.fromString(null)).should.throw(TypeError, 'String expected');
            (() => LocalTime.fromString()).should.throw(TypeError, 'String expected');
        });

        it('should construct from fromDate correctly', function () {
            const localTime1 = LocalTime.fromDate(new Date(2000, 2, 29, 0, 0, 0, 0));
            localTime1.toString().should.be.eq('00:00:00');
            const localTime2 = LocalTime.fromDate(new Date(2000, 0, 29, 2, 3, 4, 6));
            localTime2.toString().should.be.eq('02:03:04.006000000');
        });

        it('should throw when constructed from fromDate with a non-date thing', function () {
            const nonDateThings = [1, null, '', {}, [], function() {}, class A {}, LocalDateTime.fromDate(new Date())];
            nonDateThings.forEach(nonDateThing => {
                (() => LocalTime.fromDate(nonDateThing)).should.throw(TypeError, 'A Date is not passed');
            });
        });

        it('should throw when constructed from fromDate with an invalid date', function () {
            const invalidDates = [new Date('aa'), new Date({}), new Date(undefined)];
            invalidDates.forEach(invalidDate => {
                isNaN(invalidDate.getTime).should.be.true;
                (() => LocalTime.fromDate(invalidDate)).should.throw(RangeError, 'Invalid Date is passed');
            });
        });
    });
    describe('LocalDateTest', function () {
        it('should throw RangeError if year is not an integer between -999_999_999-999_999_999(inclusive)', function () {
            (() => new LocalDate(1e9, 1, 1)).should.throw(RangeError, 'Year');
            (() => new LocalDate(-1e9, 1, 1)).should.throw(RangeError, 'Year');
            (() => new LocalDate(1.1, 1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => new LocalDate('1', 1, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalDate({ 1: 1 }, 1, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalDate([], 1, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalDate(1e12, 1, 1)).should.throw(RangeError, 'Year');
        });

        it('should throw RangeError if month is not an integer between 1-12(inclusive)', function () {
            (() => new LocalDate(1, -1, 1)).should.throw(RangeError, 'Month');
            (() => new LocalDate(1, 0, 1)).should.throw(RangeError, 'Month');
            (() => new LocalDate(1, 1.1, 1)).should.throw(RangeError, 'All arguments must be integers');
            (() => new LocalDate(1, 233, 1)).should.throw(RangeError, 'Month');
            (() => new LocalDate(1, '1', 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalDate(1, { 1: 1 }, 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalDate(1, [], 1)).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalDate(1, 13, 1)).should.throw(RangeError, 'Month');
        });

        it('should throw RangeError if date is not an integer between 1-28/31 and it is not valid', function () {
            (() => new LocalDate(1, 1, -1)).should.throw(RangeError, 'Invalid Date');
            (() => new LocalDate(1, 1, 1.1)).should.throw(RangeError, 'All arguments must be integers');
            (() => new LocalDate(1, 1, 233)).should.throw(RangeError, 'Invalid Date');
            (() => new LocalDate(1, 1, '1')).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalDate(1, 1, { 1: 1 })).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalDate(1, 1, [])).should.throw(TypeError, 'All arguments must be numbers');
            (() => new LocalDate(2001, 2, 29)).should.throw(RangeError, /Invalid.*not a leap year/);
            (() => new LocalDate(2000, 2, 29)).should.not.throw(RangeError, 'Invalid Date');
            (() => new LocalDate(2001, 4, 31)).should.throw(RangeError, /Invalid.*April/);
            (() => new LocalDate(2001, 4, 30)).should.not.throw(RangeError, 'Invalid Date');
        });

        it('should convert to string correctly', function () {
            new LocalDate(999999999, 12, 31).toString().should.be.eq('999999999-12-31');
            new LocalDate(0, 1, 1).toString().should.be.eq('0000-01-01');
            new LocalDate(2000, 2, 29).toString().should.be.eq('2000-02-29');
            new LocalDate(2001, 2, 1).toString().should.be.eq('2001-02-01');
            new LocalDate(35, 2, 28).toString().should.be.eq('0035-02-28');
            new LocalDate(-100, 3, 31).toString().should.be.eq('-0100-03-31');
            new LocalDate(-35, 3, 31).toString().should.be.eq('-0035-03-31');
            new LocalDate(-30205, 3, 31).toString().should.be.eq('-30205-03-31');
            new LocalDate(30205, 3, 31).toString().should.be.eq('30205-03-31');
        });

        it('should construct from string correctly', function () {
            const localtime1 = LocalDate.fromString('2000-02-29');
            localtime1.year.should.be.eq(2000);
            localtime1.month.should.be.eq(2);
            localtime1.date.should.be.eq(29);

            const localtime2 = LocalDate.fromString('0001-02-03');
            localtime2.year.should.be.eq(1);
            localtime2.month.should.be.eq(2);
            localtime2.date.should.be.eq(3);

            const localtime3 = LocalDate.fromString('-2000-03-29');
            localtime3.year.should.be.eq(-2000);
            localtime3.month.should.be.eq(3);
            localtime3.date.should.be.eq(29);

            const localtime4 = LocalDate.fromString('-29999-03-29');
            localtime4.year.should.be.eq(-29999);
            localtime4.month.should.be.eq(3);
            localtime4.date.should.be.eq(29);

            const localtime5 = LocalDate.fromString('29999-03-29');
            localtime5.year.should.be.eq(29999);
            localtime5.month.should.be.eq(3);
            localtime5.date.should.be.eq(29);

            const localtime6 = LocalDate.fromString('999999999-12-31');
            localtime6.year.should.be.eq(999999999);
            localtime6.month.should.be.eq(12);
            localtime6.date.should.be.eq(31);

            const localtime7 = LocalDate.fromString('0000-01-01');
            localtime7.year.should.be.eq(0);
            localtime7.month.should.be.eq(1);
            localtime7.date.should.be.eq(1);
        });

        it('should throw RangeError on invalid string', function () {
            // invalid month
            (() => LocalDate.fromString('2000-24-29')).should.throw(RangeError, 'Month');
            // invalid date
            (() => LocalDate.fromString('2001-02-29')).should.throw(RangeError, 'Invalid Date');
            (() => LocalDate.fromString('2000-03-32')).should.throw(RangeError, 'Invalid Date');
            // invalid format
            (() => LocalDate.fromString('9999999999-02-29')).should.throw(RangeError, 'Year');
            (() => LocalDate.fromString('2301-71')).should.throw(RangeError, 'Invalid format');
            (() => LocalDate.fromString('-')).should.throw(RangeError, 'Invalid format');
            (() => LocalDate.fromString('2000-02-a')).should.throw(RangeError, 'Invalid format');
            (() => LocalDate.fromString('0001-002-21')).should.throw(RangeError, 'Invalid format');
            (() => LocalDate.fromString('0001-02-1')).should.throw(RangeError, 'Invalid format');
            (() => LocalDate.fromString('0001-2-10')).should.throw(RangeError, 'Invalid format');
            (() => LocalDate.fromString('1-2-10')).should.throw(RangeError, 'Invalid format');
            // Non string
            (() => LocalDate.fromString(1)).should.throw(TypeError, 'String expected');
            (() => LocalDate.fromString({})).should.throw(TypeError, 'String expected');
            (() => LocalDate.fromString([])).should.throw(TypeError, 'String expected');
            (() => LocalDate.fromString(null)).should.throw(TypeError, 'String expected');
            (() => LocalDate.fromString()).should.throw(TypeError, 'String expected');
        });

        it('should construct from fromDate correctly', function () {
            const date1 = LocalDate.fromDate(new Date(2000, 2, 29, 2, 3, 4, 6));
            date1.toString().should.be.eq('2000-03-29');
            const date2 = LocalDate.fromDate(new Date(2000, 0, 29, 2, 3, 4, 6));
            date2.toString().should.be.eq('2000-01-29');
            const date3 = LocalDate.fromDate(new Date(-2000, 2, 29, 2, 3, 4, 6));
            date3.toString().should.be.eq('-2000-03-29');
            const date4 = LocalDate.fromDate(new Date(-2000, 0, 29, 2, 3, 4, 6));
            date4.toString().should.be.eq('-2000-01-29');
        });

        it('should throw when constructed from fromDate with a non-date thing', function () {
            const nonDateThings = [1, null, '', {}, [], function() {}, class A {}, LocalDateTime.fromDate(new Date())];
            nonDateThings.forEach(nonDateThing => {
                (() => LocalDate.fromDate(nonDateThing)).should.throw(TypeError, 'A Date is not passed');
            });
        });

        it('should throw when constructed from fromDate with an invalid date', function () {
            const invalidDates = [new Date('aa'), new Date({}), new Date(undefined)];
            invalidDates.forEach(invalidDate => {
                isNaN(invalidDate.getTime).should.be.true;
                (() => LocalDate.fromDate(invalidDate)).should.throw(RangeError, 'Invalid Date is passed');
            });
        });
    });
    describe('LocalDateTimeTest', function () {
        it('should throw RangeError if local time is not valid', function () {
            (() => new LocalDateTime(new LocalDate(2000, 2, 29), '')).should.throw(TypeError, 'Invalid local time');
            (() => new LocalDateTime(new LocalDate(2000, 2, 29), 100)).should.throw(TypeError, 'Invalid local time');
            (() => new LocalDateTime('', new LocalTime(2, 3, 4, 6000000))).should.throw(TypeError, 'Invalid local date');
        });

        it('should throw RangeError if local date is not valid', function () {
            (() => new LocalDateTime(1, new LocalTime(2, 3, 4, 0))).should.throw(TypeError, 'Invalid local date');
            (() => new LocalDateTime('', new LocalTime(2, 3, 4, 0))).should.throw(TypeError, 'Invalid local date');
            (() => new LocalDateTime(new LocalDate(2000, 2, 29), '')).should.throw(TypeError, 'Invalid local time');
        });

        it('should construct from string correctly', function () {
            const localDateTime1 = LocalDateTime.fromString('2021-04-15T07:33:04.914456789');
            const localTime1 = localDateTime1.localTime;
            const localDate1 = localDateTime1.localDate;
            localTime1.nano.should.be.eq(914456789);
            localTime1.second.should.be.eq(4);
            localTime1.minute.should.be.eq(33);
            localTime1.hour.should.be.eq(7);

            localDate1.year.should.be.eq(2021);
            localDate1.month.should.be.eq(4);
            localDate1.date.should.be.eq(15);

            // use t instead of T
            const localDateTime2 = LocalDateTime.fromString('2020-04-15t07:35:02.1');
            const localTime2 = localDateTime2.localTime;
            const localDate2 = localDateTime2.localDate;
            localTime2.nano.should.be.eq(100000000);
            localTime2.second.should.be.eq(2);
            localTime2.minute.should.be.eq(35);
            localTime2.hour.should.be.eq(7);

            localDate2.year.should.be.eq(2020);
            localDate2.month.should.be.eq(4);
            localDate2.date.should.be.eq(15);
        });

        it('should throw RangeError on invalid string', function () {
            // invalid format
            (() => LocalDateTime.fromString('23:0171')).should.throw(RangeError, 'Invalid format');
            (() => LocalDateTime.fromString('-')).should.throw(RangeError, 'Invalid format');
            // Non string
            (() => LocalDateTime.fromString(1)).should.throw(TypeError, 'String expected');
            (() => LocalDateTime.fromString([])).should.throw(TypeError, 'String expected');
            (() => LocalDateTime.fromString({})).should.throw(TypeError, 'String expected');
            (() => LocalDateTime.fromString(null)).should.throw(TypeError, 'String expected');
            (() => LocalDateTime.fromString()).should.throw(TypeError, 'String expected');
        });

        const dateTime1 = new LocalDateTime(new LocalDate(2000, 2, 29), new LocalTime(2, 3, 4, 6000000));
        it('should return local time correctly', function () {
            dateTime1.localTime.toString().should.be.eq(new LocalTime(2, 3, 4, 6000000).toString());
        });

        it('should return local date correctly', function () {
            dateTime1.localDate.toString().should.be.eq(new LocalDate(2000, 2, 29).toString());
        });

        it('should convert to string correctly', function () {
            dateTime1.toString().should.be.eq('2000-02-29T02:03:04.006000000');
        });

        it('fromDate should throw RangeError if date is invalid', function () {
            (() => LocalDateTime.fromDate(new Date('s'))).should.throw(RangeError, 'Invalid Date');
            (() => LocalDateTime.fromDate(1, 1)).should.throw(TypeError, 'A Date is not passed');
            (() => LocalDateTime.fromDate('s', 1)).should.throw(TypeError, 'A Date is not passed');
            (() => LocalDateTime.fromDate([], 1)).should.throw(TypeError, 'A Date is not passed');
        });

        it('should construct from fromDate correctly', function () {
            const dateTime1 = LocalDateTime.fromDate(new Date(2000, 2, 29, 2, 3, 4, 6));
            dateTime1.toString().should.be.eq('2000-03-29T02:03:04.006000000');
            const dateTime2 = LocalDateTime.fromDate(new Date(2000, 0, 29, 2, 3, 4, 6));
            dateTime2.toString().should.be.eq('2000-01-29T02:03:04.006000000');
        });

        it('should convert to date correctly', function () {
            const dateTime = new LocalDateTime(new LocalDate(2000, 2, 29), new LocalTime(2, 19, 4, 6000000));
            const asDate = dateTime.asDate();
            const date = leftZeroPadInteger(asDate.getDate(), 2);
            const month = leftZeroPadInteger(asDate.getMonth() + 1, 2); // Date's month is 0-based
            const year = leftZeroPadInteger(asDate.getFullYear(), 4);
            const hours = leftZeroPadInteger(asDate.getHours(), 2);
            const minutes = leftZeroPadInteger(asDate.getMinutes(), 2);
            const seconds = leftZeroPadInteger(asDate.getSeconds(), 2);

            `${date}.${month}.${year} ${hours}:${minutes}:${seconds}`.should.be.eq('29.02.2000 02:19:04');
        });
    });
    describe('OffsetDateTimeTest', function () {
        it('should return parse values correctly', function () {
            const dateTime1 = new OffsetDateTime(new LocalDateTime(new LocalDate(2000, 2, 29), new LocalTime(2, 3, 4, 6)), 1000);

            dateTime1.localDateTime.localDate.year.should.be.equal(2000);
            dateTime1.localDateTime.localDate.month.should.be.equal(2);
            dateTime1.localDateTime.localDate.date.should.be.equal(29);
            dateTime1.localDateTime.localTime.hour.should.be.equal(2);
            dateTime1.localDateTime.localTime.minute.should.be.equal(3);
            dateTime1.localDateTime.localTime.second.should.be.equal(4);
            dateTime1.localDateTime.localTime.nano.should.be.equal(6);
            dateTime1.offsetSeconds.should.be.equal(1000);
        });

        it('fromDate should throw RangeError if date is invalid', function () {
            (() => OffsetDateTime.fromDate(new Date('s'), 1)).should.throw(RangeError, 'Invalid Date');
            (() => OffsetDateTime.fromDate(1, 1)).should.throw(TypeError, 'A Date is not passed');
            (() => OffsetDateTime.fromDate('s', 1)).should.throw(TypeError, 'A Date is not passed');
            (() => OffsetDateTime.fromDate([], 1)).should.throw(TypeError, 'A Date is not passed');
        });

        it('fromDate should throw RangeError if offset is not an integer between -64800-64800', function () {
            (() => OffsetDateTime.fromDate(new Date(), '1')).should.throw(TypeError, 'is not a number');
            (() => OffsetDateTime.fromDate(new Date(), 90000)).should.throw(RangeError, 'Offset');
            (() => OffsetDateTime.fromDate(new Date(), [])).should.throw(TypeError, 'is not a number');
            (() => OffsetDateTime.fromDate(new Date(), -90000)).should.throw(RangeError, 'Offset');
            (() => OffsetDateTime.fromDate(new Date(), {})).should.throw(TypeError, 'is not a number');
        });

        it('should construct from fromDate correctly', function () {
            const offsetDateTime1 = OffsetDateTime.fromDate(new Date(2000, 2, 29, 2, 3, 4, 6), 1800);
            offsetDateTime1.toString().should.be.eq('2000-03-29T02:03:04.006000000+00:30');
            const offsetDateTime2 = OffsetDateTime.fromDate(new Date(2000, 0, 29, 2, 3, 4, 6), 1800);
            offsetDateTime2.toString().should.be.eq('2000-01-29T02:03:04.006000000+00:30');
        });

        const dateTime1 = new OffsetDateTime(
            new LocalDateTime(new LocalDate(2000, 2, 29), new LocalTime(2, 19, 4, 6000000)), 1000
        );

        it('should convert to date correctly', function () {
            const asDate = dateTime1.asDate();

            const date = leftZeroPadInteger(asDate.getDate(), 2);
            const month = leftZeroPadInteger(asDate.getMonth() + 1, 2); // Date's month is 0-based
            const year = leftZeroPadInteger(asDate.getFullYear(), 4);
            const hours = leftZeroPadInteger(asDate.getHours(), 2);
            const minutes = leftZeroPadInteger(asDate.getMinutes(), 2);
            const seconds = leftZeroPadInteger(asDate.getSeconds(), 2);

            `${date}.${month}.${year} ${hours}:${minutes}:${seconds}`.should.be.eq('29.02.2000 02:02:24');

            asDate.getMilliseconds().should.be.equal(6);
        });

        it('should convert to string correctly', function () {
            dateTime1.toString().should.be.eq('2000-02-29T02:19:04.006000000+00:16');
        });

        it('should construct from string correctly', function () {
            const offsetDateTime1 = OffsetDateTime.fromString('2000-02-29T02:03:04+01:30');
            const offsetSeconds1 = offsetDateTime1.offsetSeconds;
            const localDateTime1 = offsetDateTime1.localDateTime;
            const localTime1 = localDateTime1.localTime;
            const localDate1 = localDateTime1.localDate;

            localDate1.year.should.be.eq(2000);
            localDate1.month.should.be.eq(2);
            localDate1.date.should.be.eq(29);

            localTime1.hour.should.be.eq(2);
            localTime1.minute.should.be.eq(3);
            localTime1.second.should.be.eq(4);
            localTime1.nano.should.be.eq(0);

            offsetSeconds1.should.be.eq(90 * 60);

            // use t instead of T
            const offsetDateTime2 = OffsetDateTime.fromString('2021-04-15t07:33:04.914+02:30');
            const offsetSeconds2 = offsetDateTime2.offsetSeconds;
            const localDateTime2 = offsetDateTime2.localDateTime;
            const localTime2 = localDateTime2.localTime;
            const localDate2 = localDateTime2.localDate;

            localDate2.year.should.be.eq(2021);
            localDate2.month.should.be.eq(4);
            localDate2.date.should.be.eq(15);

            localTime2.hour.should.be.eq(7);
            localTime2.minute.should.be.eq(33);
            localTime2.second.should.be.eq(4);
            localTime2.nano.should.be.eq(914 * 1000000);

            offsetSeconds2.should.be.eq(150 * 60);

            // Use of Z
            const offsetDateTime3 = OffsetDateTime.fromString('2021-04-15T07:33:04.914Z');
            const offsetSeconds3 = offsetDateTime3.offsetSeconds;
            const localDateTime3 = offsetDateTime3.localDateTime;
            const localTime3 = localDateTime3.localTime;
            const localDate3 = localDateTime3.localDate;

            localDate3.year.should.be.eq(2021);
            localDate3.month.should.be.eq(4);
            localDate3.date.should.be.eq(15);

            localTime3.hour.should.be.eq(7);
            localTime3.minute.should.be.eq(33);
            localTime3.second.should.be.eq(4);
            localTime3.nano.should.be.eq(914 * 1000000);

            offsetSeconds3.should.be.eq(0);

            const offsetDateTime4 = OffsetDateTime.fromString('2021-04-15T07:33:04.914Z');
            const offsetSeconds4 = offsetDateTime4.offsetSeconds;
            const localDateTime4 = offsetDateTime4.localDateTime;
            const localTime4 = localDateTime4.localTime;
            const localDate4 = localDateTime4.localDate;

            localDate4.year.should.be.eq(2021);
            localDate4.month.should.be.eq(4);
            localDate4.date.should.be.eq(15);

            localTime4.hour.should.be.eq(7);
            localTime4.minute.should.be.eq(33);
            localTime4.second.should.be.eq(4);
            localTime4.nano.should.be.eq(914 * 1000000);

            offsetSeconds4.should.be.eq(0);
        });

        it('should throw RangeError on invalid string', function () {
            // invalid format
            (() => OffsetDateTime.fromString('2021-04-15T07:33:04.914++02:30'))
                .should.throw(RangeError, 'Invalid format');
            // Non string
            (() => OffsetDateTime.fromString(1)).should.throw(TypeError, 'String expected');
            (() => OffsetDateTime.fromString([])).should.throw(TypeError, 'String expected');
            (() => OffsetDateTime.fromString({})).should.throw(TypeError, 'String expected');
            (() => OffsetDateTime.fromString(null)).should.throw(TypeError, 'String expected');
            (() => OffsetDateTime.fromString()).should.throw(TypeError, 'String expected');
        });
    });
});
