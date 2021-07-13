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

import {
    getOffsetSecondsFromTimezoneString,
    getTimezoneOffsetFromSeconds
} from '../util/DatetimeUtil';

/**
 * ### Local time object
 * * Represents time in day without timezone.
 */
export class HzLocalTimeClass {
    private static readonly timeStringRegex = /(\d\d):(\d\d):(\d\d)(\.\d+)?/;

    private constructor(readonly hour: number, readonly minute: number, readonly second: number, readonly nano: number) {
        if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second) || !Number.isInteger(nano)) {
            throw new RangeError('Illegal arguments given to HzLocalTime. All arguments must be integers.');
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
        if (!(nano >= 0 && nano <= 999_999_999)) {
            throw new RangeError('Nano-of-second must be between 0-999_999_999');
        }
    }

    /**
     * @internal
     * Static constructor that is used by constructor function
     */
    static _new(hour: number, minute: number, second: number, nano: number) {
        return new HzLocalTimeClass(hour, minute, second, nano);
    }

    /**
     * Constructs a new {@link HzLocalTimeClass} object from timeString.
     * @param timeString A string in the form HH:mm:ss.SSS, where the last part represents nanoseconds and optional.
     * At most 9 digits allowed for nanosecond value. If more than 9 digits are given, the first 9 of them are used.
     * @throws RangeError if invalid timeString is given
     */
    static fromString(timeString: string): HzLocalTimeClass {
        if (typeof timeString !== 'string') {
            throw new RangeError('String expected.');
        }
        const match = timeString.match(HzLocalTimeClass.timeStringRegex);
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
        return new HzLocalTimeClass(hours, minutes, seconds, nano);
    }

    /**
     * Returns the string representation of this local time.
     *
     * @returns A string in the form HH:mm:ss.SSS (9 digits, nano second precision). The constructed string is
     * zero-padded from left. If nanosecond is 0, it is not included in the constructed string.
     */
    toString(): string {
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

/**
 * Months for HzLocalDate
 * @internal
 */
enum Months {
    January = 1,
    February,
    March,
    April,
    May,
    June,
    July,
    August,
    September,
    October,
    November,
    December
}

/**
 * ### Local date object
 * * Represents date in year without timezone.
 */
export class HzLocalDateClass {
    private static readonly dateRegex = /(-?\d+)-(\d\d)-(\d\d)/;

    private constructor(readonly year: number, readonly month: number, readonly date: number) {
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(date)) {
            throw new RangeError('Illegal arguments given to HzLocalTime. All arguments must be integers.');
        }
        if (!(month >= 1 && month <= 12)) {
            throw new RangeError('Month must be between 1-12');
        }
        if (!(year >= -999_999_999 && year <= 999_999_999)) {
            throw new RangeError('Year must be between -999_999_999 - 999_999_999');
        }

        if (date < 1) {
            throw new RangeError('Invalid date. Date cannot be less than 1');
        }

        if (date > 28) {
            let maxDate = 31;
            switch (month) {
                case 2:
                    maxDate = HzLocalDateClass.isLeapYear(this.year) ? 29 : 28;
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
                    throw new RangeError(`Invalid date. February 29 as ${this.year} is not a leap year`);
                }
                throw new RangeError(`Invalid date. ${Months[this.month]} ${this.date}`);
            }
        }
    }

    /**
     * @internal
     * Static constructor that is used by constructor function
     */
    static _new(year: number, month: number, date: number) {
        return new HzLocalDateClass(year, month, date);
    }

    /**
     * @internal
     * Implementation is taken from java IsoChronology.isLeapYear()
     * @param year Year value
     */
    private static isLeapYear(year: number): boolean {
        return (year & 3) == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    /**
     * Constructs a {@link HzLocalDateClass} object from string.
     * @throws RangeError if string is not passed, or string format is wrong
     * @param dateString String in the form of yyyy-mm-dd
     */
    static fromString(dateString: string): HzLocalDateClass {
        if (typeof dateString !== 'string') {
            throw new RangeError('String expected.');
        }
        const match = dateString.match(HzLocalDateClass.dateRegex);
        if (!match) {
            throw new RangeError('Invalid format. Expected a string in yyyy-mm-dd format');
        }

        const yearNumber = +match[1];
        const monthNumber = +match[2];
        const dateNumber = +match[3];

        if (isNaN(yearNumber) || isNaN(monthNumber) || isNaN(dateNumber)) {
            throw new RangeError('Invalid format. Expected a string in yyyy-mm-dd format');
        }
        return new HzLocalDateClass(yearNumber, monthNumber, dateNumber);
    }

    /**
     * Returns the string representation of this local date.
     * @returns A string in the form yyyy:mm:dd. Values are zero padded from left
     */
    toString(): string {
        const sign = this.year < 0 ? '-' : '';
        const paddedYear = Math.abs(this.year).toString().padStart(4, '0');
        const month = this.month.toString().padStart(2, '0');
        const date = this.date.toString().padStart(2, '0');
        return `${sign}${paddedYear}-${month}-${date}`;
    }
}

/**
 * ### Local datetime object
 * * Represents date and time without timezone.
 */
export class HzLocalDateTimeClass {
    private static tRegex = /[Tt]/;

    private constructor(readonly hzLocalDate: HzLocalDateClass, readonly hzLocalTime: HzLocalTimeClass) {
        if (!(hzLocalDate instanceof HzLocalDateClass)) {
            throw new RangeError('Invalid local date.');
        }
        if (!(hzLocalTime instanceof HzLocalTimeClass)) {
            throw new RangeError('Invalid local time.');
        }
    }

    /**
     * @internal
     * Static constructor that is used by constructor function
     */
    static _new(hzLocalDate: HzLocalDateClass, hzLocalTime: HzLocalTimeClass) {
        return new HzLocalDateTimeClass(hzLocalDate, hzLocalTime);
    }

    /**
     * Constructs HzLocalDateTime from ISO 8601 string.
     * @param isoString Must not include timezone information. The string format is yyyy-mm-ss(T|t)HH:mm:ss.SSS. The last SSS
     * part represents nanoseconds and can be omitted.
     * @throws RangeError if ISO string is invalid or any of the values in ISO string is invalid
     */
    static fromString(isoString: string): HzLocalDateTimeClass {
        if (typeof isoString !== 'string') {
            throw new RangeError('String expected.');
        }
        const split = isoString.split(HzLocalDateTimeClass.tRegex);
        if (split.length !== 2) {
            throw new RangeError('Invalid format. Expected a string in the form yyyy-mm-ss(T|t)HH:mm:ss.SSS');
        }
        return new HzLocalDateTimeClass(HzLocalDateClass.fromString(split[0]), HzLocalTimeClass.fromString(split[1]));
    }

    /**
     * Returns this local datetime as Date.
     */
    asDate(): Date {
        return new Date(
            Date.UTC(
                this.hzLocalDate.year,
                this.hzLocalDate.month - 1, // month start with 0 in Date
                this.hzLocalDate.date,
                this.hzLocalTime.hour,
                this.hzLocalTime.minute,
                this.hzLocalTime.second,
                Math.floor(this.hzLocalTime.nano / 1_000_000)
            )
        );
    }

    /**
     * Constructs a new instance from Date.
     * @param date Must be a valid date. So `date.getTime()` should be not NaN
     */
    static fromDate(date: Date): HzLocalDateTimeClass {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new RangeError('Invalid date.');
        }
        return HzLocalDateTimeClass._new(
            HzLocalDateClass._new(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate()
            ),
            HzLocalTimeClass._new(
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds(),
                date.getUTCMilliseconds() * 1_000_000
            )
        );
    }

    /**
     * Returns the string representation of this local datetime.
     * @returns A string in the form yyyy:mm:ddTHH:mm:ss.SSS. Values are zero padded from left. If nano second value
     * is zero, second decimal is not include in the returned string
     */
    toString(): string {
        return `${this.hzLocalDate.toString()}T${this.hzLocalTime.toString()}`;
    }
}

/**
 * ### Offset datetime object
 * * Represents date and time with timezone.
 * * Timezone is specified with offset from UTC in seconds. This offset can be negative or positive.
 * * This class internally stores a {@link HzLocalDateTimeClass} and offset number.
 */
export class HzOffsetDateTimeClass {

    private static readonly timezoneRegex = /([Zz]|[+-]\d\d:\d\d)/;

    private constructor(readonly hzLocalDateTime: HzLocalDateTimeClass, readonly offsetSeconds: number) {
    }

    /**
     * @internal
     * Static constructor that is used by constructor function
     */
    static _new(hzLocalDateTime: HzLocalDateTimeClass, offsetSeconds: number) {
        return new HzOffsetDateTimeClass(hzLocalDateTime, offsetSeconds);
    }

    /**
     * Constructs a new instance from Date and offset seconds.
     * @param date Must be a valid date. So `date.getTime()` should be not NaN
     * @param offsetSeconds Must be between -64800-64800 (-+18:00)
     */
    static fromDate(date: Date, offsetSeconds: number): HzOffsetDateTimeClass {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new RangeError('Invalid date.');
        }
        if (!Number.isInteger(offsetSeconds) || !(offsetSeconds >= -64800 && offsetSeconds <= 64800)) {
            throw new RangeError('Offset seconds can be between -64800(-18:00) and 64800(+18:00).');
        }
        return new HzOffsetDateTimeClass(HzLocalDateTimeClass.fromDate(date), offsetSeconds);
    }

    /**
     * Constructs a new instance from ISO 8601 string.
     * @param isoString ISO 8601 string with timezone. If timezone is omitted, UTC is assumed
     */
    static fromString(isoString: string): HzOffsetDateTimeClass {
        if (typeof isoString !== 'string') {
            throw new RangeError('String expected');
        }
        const indexOfFirstMatch = isoString.search(HzOffsetDateTimeClass.timezoneRegex);
        const split = isoString.split(isoString[indexOfFirstMatch]);
        let offsetSeconds;
        if (split.length !== 2) {
            throw new RangeError('Invalid format');
        }
        if (indexOfFirstMatch === -1) {
            offsetSeconds = 0;
        } else {
            offsetSeconds = getOffsetSecondsFromTimezoneString(isoString[indexOfFirstMatch] + split[1]);
        }
        return new HzOffsetDateTimeClass(HzLocalDateTimeClass.fromString(split[0]), offsetSeconds);
    }

    /**
     * Returns this offset datetime as Date. Note that the timezone information is not stored in Date objects and you
     * effectively get a timestamp.(an instance in time without timezone)
     */
    asDate(): Date {
        return new Date(this.hzLocalDateTime.asDate().getTime() - this.offsetSeconds * 1000);
    }

    /**
     * Returns ISO 8601 string with timezone of this instance.
     * @returns A string in the format yyyy-mm-ddTHH-mm-ss.SSS(Z | (+|-)HH:mm)
     * Timezone is denoted either with `Z` or timezone string like +-HH:mm
     */
    toString(): string {
        const timezoneOffsetString = getTimezoneOffsetFromSeconds(this.offsetSeconds);
        return this.hzLocalDateTime.toString() + timezoneOffsetString;
    }
}


interface HzLocalDateInterface {
    (year: number, month: number, date: number): HzLocalDateClass;

    new(year: number, month: number, date: number): HzLocalDateClass;
}

function _HzLocalDate(year: number, month: number, date: number): HzLocalDateClass {
    return HzLocalDateClass._new(year, month, date);
}

/**
 * Constructor function, can be invoked with or without new keyword.
 *
 * @param year Must be between -999999999-999999999
 * @param month Must be between 1-12
 * @param date Must be between 1-31 depending on year and month
 * @throws RangeError if any of the arguments are invalid
 */
export const HzLocalDate: HzLocalDateInterface = <HzLocalDateInterface>_HzLocalDate;

interface HzLocalTimeInterface {
    (hour: number, minute: number, second: number, nano: number): HzLocalTimeClass;

    new(hour: number, minute: number, second: number, nano: number): HzLocalTimeClass;
}

function _HzLocalTime(hour: number, minute: number, second: number, nano: number): HzLocalTimeClass {
    return HzLocalTimeClass._new(hour, minute, second, nano);
}

/**
 * Constructor function, can be invoked with or without new keyword.
 *
 * @param hour The hour-of-day to represent, from 0 to 23
 * @param minute The minute-of-hour to represent, from 0 to 59
 * @param second The second-of-minute to represent, from 0 to 59
 * @param nano The nano-of-second to represent, from 0 to 999,999,999
 * @throws RangeError if any of the arguments are invalid
 */
export const HzLocalTime: HzLocalTimeInterface = <HzLocalTimeInterface>_HzLocalTime;

interface HzLocalDateTimeInterface {
    (hzLocalDate: HzLocalDateClass, hzLocalTime: HzLocalTimeClass): HzLocalDateTimeClass;

    new(hzLocalDate: HzLocalDateClass, hzLocalTime: HzLocalTimeClass): HzLocalDateTimeClass;
}

function _HzLocalDateTime(hzLocalDate: HzLocalDateClass, hzLocalTime: HzLocalTimeClass): HzLocalDateTimeClass {
    return HzLocalDateTimeClass._new(hzLocalDate, hzLocalTime);
}

/**
 * Constructor function, can be invoked with or without new keyword.
 *
 * @param hzLocalDate a {@link HzLocalDateClass} object
 * @param hzLocalTime a {@link HzLocalTimeClass} object
 * @throws RangeError if any of the arguments are invalid
 */
export const HzLocalDateTime: HzLocalDateTimeInterface = <HzLocalDateTimeInterface>_HzLocalDateTime;

interface HzOffsetDateTimeInterface {
    (hzLocalDateTime: HzLocalDateTimeClass, offsetSeconds: number): HzOffsetDateTimeClass;

    new(hzLocalDateTime: HzLocalDateTimeClass, offsetSeconds: number): HzOffsetDateTimeClass;
}

function _HzOffsetDateTime(hzLocalDateTime: HzLocalDateTimeClass, offsetSeconds: number): HzOffsetDateTimeClass {
    return HzOffsetDateTimeClass._new(hzLocalDateTime, offsetSeconds);
}

/**
 * Constructor function, can be invoked with or without new keyword.
 * @param hzLocalDateTime {@link HzLocalDateTimeClass} object
 * @param offsetSeconds timezone offset in seconds. Must be in [-64800, 64800] range.
 * @throws RangeError if any of the arguments are invalid
 */
export const HzOffsetDateTime: HzOffsetDateTimeInterface = <HzOffsetDateTimeInterface>_HzOffsetDateTime;
