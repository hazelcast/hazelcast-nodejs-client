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


/**
 Constructs and returns timezone for ISO string from offsetSeconds
 @internal

 @param offsetSeconds Offset in seconds, can be negative or positive. must be in valid timezone range [-64800, 64800]. If out of
 this range, the limit values are assumed.
 @throws RangeError if offset seconds is not number
 @return Timezone string, can be 'Z', +hh:mm or -hh:mm
 */
export function getTimezoneOffsetFromSeconds(offsetSeconds: number): string {
    if (!Number.isInteger(offsetSeconds)) {
        throw new RangeError('Expected integer');
    }

    if (offsetSeconds > 64800 || offsetSeconds < -64800) {
        throw new RangeError('Offset seconds should be in the range [-64800,64800]');
    }

    const offsetMinutes = Math.floor(Math.abs(offsetSeconds) / 60);

    let timezoneString = '';
    if (offsetSeconds === 0) {
        timezoneString = 'Z';
    } else {
        if (offsetSeconds < 0) {
            timezoneString += '-';
        } else {
            timezoneString += '+';
        }

        const hours = Math.floor(offsetMinutes / 60);
        timezoneString += leftZeroPadInteger(hours, 2);

        timezoneString += ':';

        const minutes = offsetMinutes % 60;
        timezoneString += leftZeroPadInteger(minutes, 2);
    }
    return timezoneString;
}

/**
 Parses timezone string and returns offset in seconds
 @internal

 @param timezoneString string, can be 'Z', +hh:mm or -hh:mm
 @throws RangeError If timezoneString is invalid
 @return Timezone Offset in seconds, can be negative or positive. must be in valid timezone range [-64800, 64800]
 */
export function getOffsetSecondsFromTimezoneString(timezoneString: string): number {
    if (typeof timezoneString !== 'string') {
        throw new RangeError('String expected');
    }
    let positive;
    if (timezoneString.toUpperCase() === 'Z') {
        return 0;
    } else if (timezoneString[0] === '-') {
        positive = false;
    } else if (timezoneString[0] === '+') {
        positive = true;
    } else {
        throw new RangeError('Invalid format');
    }

    const substring = timezoneString.substring(1);
    const split = substring.split(':');
    if (split.length !== 2) {
        throw new RangeError('Invalid format');
    }
    const hourAsNumber = +split[0]
    const minuteAsNumber = +split[1];

    if (isNaN(hourAsNumber) || isNaN(minuteAsNumber)) {
        throw new RangeError('Invalid format');
    }

    const offsetSeconds = hourAsNumber * 3600 + minuteAsNumber * 60;

    if (offsetSeconds > 64800) {
        throw new RangeError('Invalid offset');
    }
    return positive ? offsetSeconds : -offsetSeconds;
}

/**
 * Give this function integer and it will zero pad to the given length.
 * @internal
 * @param value
 * @param length total length after padding
 * @returns Zero padded string
 */
export function leftZeroPadInteger(value: number, length: number): string {
    return value.toString().padStart(length, '0');
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
 * Returns the string representation of a local date.
 * @param year Must be between -999999999-999999999
 * @param month Must be between 1-12
 * @param date Must be between 1-31 depending on year and month
 * @returns A string in the form yyyy:mm:dd. Values are zero padded from left
 * @throws RangeError if any of the arguments are invalid
 */
export function getLocalDateString(year: number, month: number, date: number): string {
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
                maxDate = (year & 3) == 0 && (year % 100 != 0 || year % 400 == 0) ? 29 : 28;
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
                throw new RangeError(`Invalid date. February 29 as ${year} is not a leap year`);
            }
            throw new RangeError(`Invalid date. ${Months[month]} ${date}`);
        }
    }
    const sign = year < 0 ? '-' : '';
    const paddedYear = Math.abs(year).toString().padStart(4, '0');
    const monthString = month.toString().padStart(2, '0');
    const dateString = date.toString().padStart(2, '0');
    return `${sign}${paddedYear}-${monthString}-${dateString}`;
}

/**
 * Returns the string representation of a local time.
 *
 * @param hour The hour-of-day to represent, from 0 to 23
 * @param minute The minute-of-hour to represent, from 0 to 59
 * @param second The second-of-minute to represent, from 0 to 59
 * @param nano The nano-of-second to represent, from 0 to 999,999,999
 * @throws RangeError if any of the arguments are invalid
 * @returns A string in the form HH:mm:ss.SSS (9 digits, nano second precision). The constructed string is
 * zero-padded from left. If nanosecond is 0, it is not included in the constructed string.
 */
export function getLocalTimeString(hour: number, minute: number, second: number, nano: number): string {
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

    const hourString = hour.toString().padStart(2, '0');
    const minuteString = minute.toString().padStart(2, '0');
    const secondString = second.toString().padStart(2, '0');

    let hourMinuteSecondString = `${hourString}:${minuteString}:${secondString}`;
    // Do not add .000000000 if nano is 0
    if (nano !== 0) {
        hourMinuteSecondString += `.${nano.toString().padStart(9, '0')}`;
    }
    return hourMinuteSecondString;
}
