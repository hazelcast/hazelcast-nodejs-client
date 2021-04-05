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
 @return {object} an object including hours, minutes, seconds and nano
 */
export function parseTimeString(timeString: string): {
    hours: number;
    minutes: number;
    seconds: number;
    nano: number;
} {
    // TODO
    const timeStringSplit = timeString.split(':');
    /*
    const time = timeStringSplit[1];
    const timeSplit = time.split(':');
    // we have seconds YYYY-MM-DDThh:mm:(ss.sTZD)
    if (timeSplit.length >= 3) {
        const secondsWithTimezone = timeSplit[2];
        const dotSplit = secondsWithTimezone.split('.');
        if (dotSplit.length >= 2) {
            const fractionWithTimezone = dotSplit[1];
            const fractionString = fractionWithTimezone.split('+-Z')[0];
            // Convert string to number
            let fraction = +fractionString;
            if (!isNaN(fraction)) {
                // Convert to nanoseconds
                while (fraction <= 99_999_999) fraction *= 10;
                return fraction;
            }
        }
    }
     */
    return undefined;
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

 @param {string} dateISOString ISO 8601 string containing date
 @param {string} timeString A string in the form hh:mm:ss.sss (at most 9 digits, so nano second precision)
 @return {string} ISO string
 */
export function combineTimeAndDateStrings(dateISOString: string, timeString: string): string {
    return [dateISOString.split('T')[0], timeString].join('T');
}

