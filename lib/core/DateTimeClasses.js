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
exports.OffsetDateTime = exports.LocalDateTime = exports.LocalDate = exports.LocalTime = void 0;
const DateTimeUtil_1 = require("../util/DateTimeUtil");
/**
 * ### Local time object
 * * Represents time in day without timezone.
 */
class LocalTime {
    /**
     * @param hour The hour-of-day to represent, from 0 to 23
     * @param minute The minute-of-hour to represent, from 0 to 59
     * @param second The second-of-minute to represent, from 0 to 59
     * @param nano The nano-of-second to represent, from 0 to 999,999,999
     * @throws TypeError if any of the arguments are invalid
     * @throws RangeError if value of any of the arguments are invalid
     */
    constructor(hour, minute, second, nano) {
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.nano = nano;
        if (typeof hour !== 'number' || typeof minute !== 'number' || typeof second !== 'number' || typeof nano !== 'number') {
            throw new TypeError('Illegal arguments given to LocalTime. All arguments must be numbers.');
        }
        if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second) || !Number.isInteger(nano)) {
            throw new RangeError('Illegal arguments given to LocalTime. All arguments must be integers.');
        }
        if (!(hour >= 0 && hour <= 23)) {
            throw new RangeError('Hour-of-day must be between 0-23');
        }
        if (!(minute >= 0 && minute <= 59)) {
            throw new RangeError('Minute-of-hour must be between 0-59');
        }
        if (!(second >= 0 && second <= 59)) {
            throw new RangeError('Second-of-minute must be between 0-59');
        }
        if (!(nano >= 0 && nano <= 999999999)) {
            throw new RangeError('Nano-of-second must be between 0-999_999_999');
        }
    }
    /**
     * Constructs a new {@link LocalTime} object from timeString.
     * @param timeString A string in the form HH:mm:ss.SSS, where the last part represents nanoseconds and optional.
     * At most 9 digits allowed for nanosecond value. If more than 9 digits are given, the first 9 of them are used.
     * @throws RangeError if given timeString is invalid
     * @throws TypeError if given argument is not string
     */
    static fromString(timeString) {
        if (typeof timeString !== 'string') {
            throw new TypeError('String expected.');
        }
        const match = timeString.match(LocalTime.timeStringRegex);
        if (!match) {
            throw new RangeError('Illegal time string. Expected a string in HH:mm:ss.SSS format');
        }
        const hours = +match[1];
        const minutes = +match[2];
        const seconds = +match[3];
        let nano = 0;
        if (match[4] !== undefined) { // nano second included
            let nanoStr = match[4].substring(1, 10); // does not include first dot
            nanoStr = nanoStr.padEnd(9, '0');
            nano = +nanoStr;
        }
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(nano)) {
            throw new RangeError('Illegal time string. Expected a string in HH:mm:ss.SSS format');
        }
        return new LocalTime(hours, minutes, seconds, nano);
    }
    /**
     * Constructs a new instance from Date.
     * @param date must be a valid Date. `date.getTime()` should be not NaN
     * @throws TypeError if the passed param is not a Date
     * @throws RangeError if an invalid Date is passed
     */
    static fromDate(date) {
        if (!(date instanceof Date)) {
            throw new TypeError('A Date is not passed');
        }
        if (isNaN(date.getTime())) {
            throw new RangeError('Invalid Date is passed.');
        }
        return new LocalTime(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds() * 1000000);
    }
    /**
     * Returns the string representation of this local time.
     *
     * @returns A string in the form HH:mm:ss.SSS (9 digits, nano second precision). The constructed string is
     * zero-padded from left. If nanosecond is 0, it is not included in the constructed string.
     */
    toString() {
        const hour = this.hour.toString().padStart(2, '0');
        const minute = this.minute.toString().padStart(2, '0');
        const second = this.second.toString().padStart(2, '0');
        let hourMinuteSecondString = `${hour}:${minute}:${second}`;
        // Do not add .000000000 if nano is 0
        if (this.nano !== 0) {
            hourMinuteSecondString += `.${this.nano.toString().padStart(9, '0')}`;
        }
        return hourMinuteSecondString;
    }
}
exports.LocalTime = LocalTime;
LocalTime.timeStringRegex = /(\d\d):(\d\d):(\d\d)(\.\d+)?/;
/**
 * Months for LocalDate
 * @internal
 */
var Months;
(function (Months) {
    Months[Months["January"] = 1] = "January";
    Months[Months["February"] = 2] = "February";
    Months[Months["March"] = 3] = "March";
    Months[Months["April"] = 4] = "April";
    Months[Months["May"] = 5] = "May";
    Months[Months["June"] = 6] = "June";
    Months[Months["July"] = 7] = "July";
    Months[Months["August"] = 8] = "August";
    Months[Months["September"] = 9] = "September";
    Months[Months["October"] = 10] = "October";
    Months[Months["November"] = 11] = "November";
    Months[Months["December"] = 12] = "December";
})(Months || (Months = {}));
/**
 * ### Local date object
 * * Represents date in year without timezone.
 */
class LocalDate {
    /**
     * @param year Must be between -999999999-999999999
     * @param month Must be between 1-12
     * @param date Must be between 1-31 depending on year and month
     * @throws RangeError if value of any of the arguments are invalid, or the date formed by them is invalid (e.g 02/29/2021)
     * @throws TypeError if any of the arguments are of wrong type
     */
    constructor(year, month, date) {
        this.year = year;
        this.month = month;
        this.date = date;
        if (typeof year !== 'number' || typeof month !== 'number' || typeof date !== 'number') {
            throw new TypeError('Illegal arguments given to LocalTime. All arguments must be numbers.');
        }
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(date)) {
            throw new RangeError('Illegal arguments given to LocalTime. All arguments must be integers.');
        }
        if (!(month >= 1 && month <= 12)) {
            throw new RangeError('Month must be between 1-12');
        }
        if (!(year >= -999999999 && year <= 999999999)) {
            throw new RangeError('Year must be between -999_999_999 - 999_999_999');
        }
        if (date < 1) {
            throw new RangeError('Invalid Date. Date cannot be less than 1');
        }
        if (date > 28) {
            let maxDate = 31;
            switch (month) {
                case 2:
                    maxDate = LocalDate.isLeapYear(this.year) ? 29 : 28;
                    break;
                case 4:
                    maxDate = 30;
                    break;
                case 6:
                    maxDate = 30;
                    break;
                case 9:
                    maxDate = 30;
                    break;
                case 11:
                    maxDate = 30;
                    break;
            }
            if (date > maxDate) {
                if (date == 29) {
                    throw new RangeError(`Invalid Date. February 29 as ${this.year} is not a leap year`);
                }
                throw new RangeError(`Invalid Date. ${Months[this.month]} ${this.date}`);
            }
        }
    }
    /**
     * @internal
     * Implementation is taken from java IsoChronology.isLeapYear()
     * @param year Year value
     */
    static isLeapYear(year) {
        return (year & 3) == 0 && (year % 100 != 0 || year % 400 == 0);
    }
    /**
     * Constructs a {@link LocalDate} object from string.
     * @param dateString String in the form of yyyy-mm-dd
     * @throws TypeError if a string is not passed
     * @throws RangeError if the string format is wrong
     */
    static fromString(dateString) {
        if (typeof dateString !== 'string') {
            throw new TypeError('String expected.');
        }
        const match = dateString.match(LocalDate.dateRegex);
        if (!match) {
            throw new RangeError('Invalid format. Expected a string in yyyy-mm-dd format');
        }
        const yearNumber = +match[1];
        const monthNumber = +match[2];
        const dateNumber = +match[3];
        if (isNaN(yearNumber) || isNaN(monthNumber) || isNaN(dateNumber)) {
            throw new RangeError('Invalid format. Expected a string in yyyy-mm-dd format');
        }
        return new LocalDate(yearNumber, monthNumber, dateNumber);
    }
    /**
     * Constructs a new instance from Date.
     * @param date must be a valid Date. `date.getTime()` should be not NaN
     * @throws TypeError if the passed param is not a Date
     * @throws RangeError if an invalid Date is passed
     */
    static fromDate(date) {
        if (!(date instanceof Date)) {
            throw new TypeError('A Date is not passed');
        }
        if (isNaN(date.getTime())) {
            throw new RangeError('Invalid Date is passed.');
        }
        return new LocalDate(date.getFullYear(), date.getMonth() + 1, // month start with 0 in Date
        date.getDate());
    }
    /**
     * Returns the string representation of this local date.
     * @returns A string in the form yyyy:mm:dd. Values are zero padded from left
     */
    toString() {
        const sign = this.year < 0 ? '-' : '';
        const paddedYear = Math.abs(this.year).toString().padStart(4, '0');
        const month = this.month.toString().padStart(2, '0');
        const date = this.date.toString().padStart(2, '0');
        return `${sign}${paddedYear}-${month}-${date}`;
    }
}
exports.LocalDate = LocalDate;
LocalDate.dateRegex = /(-?\d+)-(\d\d)-(\d\d)/;
/**
 * ### Local datetime object
 * * Represents date and time without timezone.
 */
class LocalDateTime {
    /**
     * @param localDate a {@link LocalDate} object
     * @param localTime a {@link LocalTime} object
     * @throws TypeError if passed arguments are of wrong type
     */
    constructor(localDate, localTime) {
        this.localDate = localDate;
        this.localTime = localTime;
        if (!(localDate instanceof LocalDate)) {
            throw new TypeError('Invalid local date.');
        }
        if (!(localTime instanceof LocalTime)) {
            throw new TypeError('Invalid local time.');
        }
    }
    /**
     * Constructs LocalDateTime from ISO 8601 string.
     * @param isoString Must not include timezone information. The string format is yyyy-mm-ss(T|t)HH:mm:ss.SSS. The last SSS
     * part represents nanoseconds and can be omitted.
     * @throws RangeError if ISO string is invalid or any of the values in ISO string is invalid
     * @throws TypeError if the value is not a string
     */
    static fromString(isoString) {
        if (typeof isoString !== 'string') {
            throw new TypeError('String expected.');
        }
        const split = isoString.split(LocalDateTime.separatorRegex);
        if (split.length !== 2) {
            throw new RangeError('Invalid format. Expected a string in the form yyyy-mm-ss(T|t)HH:mm:ss.SSS');
        }
        return new LocalDateTime(LocalDate.fromString(split[0]), LocalTime.fromString(split[1]));
    }
    /**
     * Returns this LocalDataTime as Date.
     */
    asDate() {
        return new Date(this.localDate.year, this.localDate.month - 1, // month start with 0 in Date
        this.localDate.date, this.localTime.hour, this.localTime.minute, this.localTime.second, Math.floor(this.localTime.nano / 1000000));
    }
    /**
     * Constructs a new instance from Date.
     * @param date must be a valid Date. `date.getTime()` should be not NaN
     * @throws TypeError if the passed param is not a Date
     * @throws RangeError if an invalid Date is passed
     */
    static fromDate(date) {
        if (!(date instanceof Date)) {
            throw new TypeError('A Date is not passed');
        }
        if (isNaN(date.getTime())) {
            throw new RangeError('Invalid Date is passed.');
        }
        return new LocalDateTime(LocalDate.fromDate(date), LocalTime.fromDate(date));
    }
    /**
     * Static constructor for convenient construction.
     *
     * @param year Must be between -999999999-999999999
     * @param month Must be between 1-12
     * @param date Must be between 1-31 depending on year and month
     * @param hour The hour-of-day to represent, from 0 to 23
     * @param minute The minute-of-hour to represent, from 0 to 59
     * @param second The second-of-minute to represent, from 0 to 59
     * @param nano The nano-of-second to represent, from 0 to 999,999,999
     * @throws TypeError if passed arguments are of wrong type
     * @throws RangeError if value of any of the arguments are invalid
     */
    static from(year, month, date, hour, minute, second, nano) {
        return new LocalDateTime(new LocalDate(year, month, date), new LocalTime(hour, minute, second, nano));
    }
    /**
     * Returns the string representation of this local datetime.
     * @returns A string in the form yyyy:mm:ddTHH:mm:ss.SSS. Values are zero padded from left. If nano second value
     * is zero, second decimal is not include in the returned string
     */
    toString() {
        return `${this.localDate.toString()}T${this.localTime.toString()}`;
    }
}
exports.LocalDateTime = LocalDateTime;
LocalDateTime.separatorRegex = /[Tt]/;
/**
 * ### Offset datetime object
 * * Represents date and time with timezone.
 * * Timezone is specified with offset from UTC in seconds. This offset can be negative or positive.
 * * This class internally stores a {@link LocalDateTime} and offset number.
 */
class OffsetDateTime {
    /**
     * @param localDateTime {@link LocalDateTime} object
     * @param offsetSeconds timezone offset in seconds. Must be in [-64800, 64800] range.
     * @throws TypeError if type of arguments are invalid
     */
    constructor(localDateTime, offsetSeconds) {
        this.localDateTime = localDateTime;
        this.offsetSeconds = offsetSeconds;
        if (!(localDateTime instanceof LocalDateTime)) {
            throw new TypeError('Invalid local datetime');
        }
        if (typeof offsetSeconds !== 'number') {
            throw new TypeError('offsetSeconds is not a number.');
        }
        if (!Number.isInteger(offsetSeconds) || !(offsetSeconds >= -64800 && offsetSeconds <= 64800)) {
            throw new RangeError('Offset seconds can be between -64800(-18:00) and 64800(+18:00).');
        }
    }
    /**
     * Constructs a new instance from Date and offset seconds.
     * @param date must be a valid Date. `date.getTime()` should be not NaN
     * @param offsetSeconds Offset in seconds, must be between [-64800, 64800]
     * @throws TypeError if a wrong type is passed as argument
     * @throws RangeError if an invalid argument value is passed
     */
    static fromDate(date, offsetSeconds) {
        if (!(date instanceof Date)) {
            throw new TypeError('A Date is not passed');
        }
        if (typeof offsetSeconds !== 'number') {
            throw new TypeError('offsetSeconds is not a number');
        }
        if (isNaN(date.getTime())) {
            throw new RangeError('Invalid Date is passed.');
        }
        if (!Number.isInteger(offsetSeconds) || !(offsetSeconds >= -64800 && offsetSeconds <= 64800)) {
            throw new RangeError('Offset seconds can be between -64800(-18:00) and 64800(+18:00).');
        }
        return new OffsetDateTime(LocalDateTime.fromDate(date), offsetSeconds);
    }
    /**
     * Constructs a new instance from ISO 8601 string. The string format is yyyy-mm-ddTHH-mm-ss.SSS(Z | (+|-)HH:mm).
     * @param isoString ISO 8601 string with timezone. If timezone is omitted, UTC is assumed
     * @throws TypeError if passed value is not a string
     * @throws RangeError if passed string is invalid
     */
    static fromString(isoString) {
        if (typeof isoString !== 'string') {
            throw new TypeError('String expected');
        }
        const indexOfFirstMatch = isoString.search(OffsetDateTime.timezoneRegex);
        const split = isoString.split(isoString[indexOfFirstMatch]);
        let offsetSeconds;
        if (split.length !== 2) {
            throw new RangeError('Invalid format');
        }
        if (indexOfFirstMatch === -1) {
            offsetSeconds = 0;
        }
        else {
            offsetSeconds = (0, DateTimeUtil_1.getOffsetSecondsFromTimezoneString)(isoString[indexOfFirstMatch] + split[1]);
        }
        return new OffsetDateTime(LocalDateTime.fromString(split[0]), offsetSeconds);
    }
    /**
     * Returns this offset datetime as Date. Note that the timezone information is not stored in Date objects and you
     * effectively get a timestamp.(an instance in time without timezone)
     */
    asDate() {
        return new Date(this.localDateTime.asDate().getTime() - this.offsetSeconds * 1000);
    }
    /**
     * Static constructor for convenient construction.
     *
     * @param year Must be between -999999999-999999999
     * @param month Must be between 1-12
     * @param date Must be between 1-31 depending on year and month
     * @param hour The hour-of-day to represent, from 0 to 23
     * @param minute The minute-of-hour to represent, from 0 to 59
     * @param second The second-of-minute to represent, from 0 to 59
     * @param nano The nano-of-second to represent, from 0 to 999,999,999
     * @param offsetSeconds timezone offset in seconds. Must be in [-64800, 64800] range.
     * @throws TypeError if passed arguments are of wrong type
     * @throws RangeError if value of any of the arguments are invalid
     */
    static from(year, month, date, hour, minute, second, nano, offsetSeconds) {
        return new OffsetDateTime(LocalDateTime.from(year, month, date, hour, minute, second, nano), offsetSeconds);
    }
    /**
     * Returns ISO 8601 string with timezone of this instance.
     * @returns A string in the format yyyy-mm-ddTHH-mm-ss.SSS(Z | (+|-)HH:mm)
     * Timezone is denoted either with `Z` or timezone string like +-HH:mm
     */
    toString() {
        const timezoneOffsetString = (0, DateTimeUtil_1.getTimezoneOffsetFromSeconds)(this.offsetSeconds);
        return this.localDateTime.toString() + timezoneOffsetString;
    }
}
exports.OffsetDateTime = OffsetDateTime;
OffsetDateTime.timezoneRegex = /([Zz]|[+-]\d\d:\d\d)/;
//# sourceMappingURL=DateTimeClasses.js.map