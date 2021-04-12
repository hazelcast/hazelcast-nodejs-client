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

    if (zLast) { // if Z was present in the iso string add it.
        return withoutTimezone + 'Z';
    } else if (hourFormatTimezone) {
        return withoutTimezone + hourFormatTimezone;
    } else {
        return withoutTimezone;
    }
}

/**
 Constructs and returns timezone for iso string from offsetSeconds

 @param {number} offsetSeconds Offset in seconds, can be negative or positive. must be in valid timezone range [-64800, 64800]
 @return {string} timezone string, can be 'Z', +hh:mm or -hh:mm
 */
export function getTimezoneOffsetFromSeconds(offsetSeconds: number) {

    if (offsetSeconds > 64800) {
        return '+18:00';
    } else if (offsetSeconds < -64800) {
        return '-18:00';
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
 * Give this function integer and it will zero pad to the given length.
 * @param {number} value
 * @param {number} length total length after padding
 * @returns {string} Zero padded string
 */
export function leftZeroPadInteger(value: number, length: number): string {
    let asStr = value.toString();
    while (asStr.length < length) asStr = '0' + asStr;
    return asStr;
}
