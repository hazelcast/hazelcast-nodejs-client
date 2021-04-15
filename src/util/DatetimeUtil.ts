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
 Constructs and returns timezone for iso string from offsetSeconds
 @internal

 @param offsetSeconds Offset in seconds, can be negative or positive. must be in valid timezone range [-64800, 64800]
 @return Timezone string, can be 'Z', +hh:mm or -hh:mm
 */
export function getTimezoneOffsetFromSeconds(offsetSeconds: number): string {

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
 * @internal
 * @param value
 * @param length total length after padding
 * @returns Zero padded string
 */
export function leftZeroPadInteger(value: number, length: number): string {
    let asStr = value.toString();
    while (asStr.length < length) asStr = '0' + asStr;
    return asStr;
}
