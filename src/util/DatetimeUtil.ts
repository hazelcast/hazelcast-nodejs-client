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
 @internal
 Parse local time string and return values in it

 @param {string} timeString A string in the form hh:mm:ss.sss (at most 9 digits, so nano second precision)
 @return {object} an object including hours, minutes, seconds and nano. If nano is not 0, it always includes 9 digits.
 */
export function parseTimeString(timeString: string): {
    hours: number;
    minutes: number;
    seconds: number;
    nano: number;
} {
    const timeStringSplit = timeString.split(':');
    if (timeStringSplit.length != 3) {
        return {
            hours: 0,
            minutes: 0,
            seconds: 0,
            nano: 0
        }
    }
    const secondsSplit = timeStringSplit[2].split('.');
    let nano = 0;
    if (secondsSplit.length == 2) {
        let nanoStr = secondsSplit[1];
        // make nanoStr 9 digits if it's longer
        if (nanoStr.length > 9) nanoStr = nanoStr.slice(0, 9);

        nano = +nanoStr;
        if (!isNaN(nano)) {
            while (nano <= 99_999_999) nano *= 10;
        }
    }

    const hours = +timeStringSplit[0];
    const minutes = +timeStringSplit[1];
    const seconds = +secondsSplit[0];

    return {
        hours: isNaN(hours) ? 0 : hours,
        minutes: isNaN(minutes) ? 0 : minutes,
        seconds: isNaN(seconds) ? 0 : seconds,
        nano: isNaN(nano) ? 0 : nano
    }
}

/**
 Extract and return local time string from iso string

 @param {string} isoString ISO 8601 string
 @return {string} local time string, empty string on error
 */
export function getTimeOfIsoString(isoString: string): string {
    const isoStringSplit = isoString.split('T');

    if (isoStringSplit.length < 2) return '';

    return isoStringSplit[1].split('+-Z')[0];
}

/**
 Constructs and returns ISO string from iso string only including date and time string

 @param {string} isoString ISO 8601 string containing date
 @param {string} timeString A string in the form hh:mm:ss.sss (at most 9 digits, so nano second precision)
 @return {string} ISO string
 */
export function combineISOStringWithTimeString(isoString: string, timeString: string): string {
    const zLast = isoString[isoString.length - 1] === 'Z';
    let hourFormatTimezone;

    const isoStringSplit = isoString.split('T');

    if (isoStringSplit.length >= 2) {
        const timeString = isoStringSplit[1];
        const indexOfPlus = timeString.indexOf('+');
        const indexOfMinus = timeString.indexOf('-');
        if (indexOfMinus != -1) {
            hourFormatTimezone = timeString.slice(indexOfMinus);
        } else if (indexOfPlus != -1) {
            hourFormatTimezone = timeString.slice(indexOfPlus);
        }
    }

    const withoutTimezone = [isoString.split('T')[0], timeString].join('T');

    if (zLast) {
        return withoutTimezone + 'Z';
    } else if (hourFormatTimezone) {
        return withoutTimezone + hourFormatTimezone;
    } else {
        return withoutTimezone;
    }
}

