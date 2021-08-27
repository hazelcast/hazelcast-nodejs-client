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
/** @ignore *//** */

import * as _assert from 'assert';
import * as Long from 'long';
import * as Path from 'path';
import {BigDecimal, IllegalStateError, LocalDate, LocalDateTime, LocalTime, MemberImpl, OffsetDateTime, UUID} from '../core';
import {MemberVersion} from '../core/MemberVersion';
import {BuildInfo} from '../BuildInfo';

// Used to assert only in development mode
const IS_DEVELOPMENT_MODE = process.env.HZ_NODEJS_ENV === 'development';

/**
 * Used to only turn on asserts in development mode
 * @internal
 */
export function assert(value: any, message?: string | Error): asserts value {
    if (IS_DEVELOPMENT_MODE) {
        _assert(value, message);
    }
}

/** @internal */
export function assertNotNull(v: any): void {
    if (IS_DEVELOPMENT_MODE) {
        _assert.notStrictEqual(v, null, 'Non null value expected.');
    }
}

/** @internal */
export function assertArray(x: any): void {
    exports.assert(Array.isArray(x), 'Should be array.');
}

/** @internal */
export function assertString(v: any): void {
    exports.assert(typeof v === 'string', 'String value expected.');
}

/** @internal */
export function assertNumber(v: any): void {
    exports.assert(typeof v === 'number', 'Number value expected.');
}

/** @internal */
export function assertNonNegativeNumber(v: any, m?: string): void {
    exports.assert(typeof v === 'number', m || 'Number value expected.');
    exports.assert(v >= 0, m || 'Non-negative value expected.');
}

/** @internal */
export function assertPositiveNumber(v: any, m?: string): void {
    exports.assert(typeof v === 'number', m || 'Number value expected.');
    exports.assert(v > 0, m || 'Positive value expected.');
}

/** @internal */
export function shuffleArray<T>(array: T[]): void {
    let randomIndex: number;
    let temp: T;
    for (let i = array.length; i > 1; i--) {
        randomIndex = Math.floor(Math.random() * i);
        temp = array[i - 1];
        array[i - 1] = array[randomIndex];
        array[randomIndex] = temp;
    }
}

/** @internal */
export function getType(obj: any): string {
    if (IS_DEVELOPMENT_MODE) {
        assertNotNull(obj);
    }
    if (Long.isLong(obj)) {
        return 'long';
    } else if (Buffer.isBuffer(obj)) {
        return 'buffer';
    } else if (UUID.isUUID(obj)) {
        return 'uuid';
    } else if (obj instanceof LocalDate) {
        return 'localDate';
    } else if (obj instanceof LocalTime) {
        return 'localTime';
    } else if (obj instanceof LocalDateTime) {
        return 'localDateTime';
    } else if (obj instanceof OffsetDateTime) {
        return 'offsetDateTime';
    } else if (obj instanceof BigDecimal) {
        return 'bigDecimal';
    } else {
        const t = typeof obj;
        if (t !== 'object') {
            return t;
        } else {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        }
    }
}

/** @internal */
export function enumFromString<T>(enumType: any, value: string): T {
    return enumType[value];
}

/** @internal */
export function tryGetBoolean(val: any): boolean {
    if (typeof val === 'boolean') {
        return val;
    } else {
        throw new RangeError(val + ' is not a boolean.');
    }
}

/** @internal */
export function tryGetNumber(val: any): number {
    if (typeof val === 'number') {
        return val;
    } else {
        throw new RangeError(val + ' is not a number.');
    }
}

/** @internal */
export function tryGetArray(val: any): any[] {
    if (Array.isArray(val)) {
        return val;
    } else {
        throw new RangeError(val + ' is not an array.');
    }
}

/** @internal */
export function tryGetLong(val: any): Long {
    if (Long.isLong(val)) {
        return val;
    } else {
        throw new RangeError(val + ' is not a long.');
    }
}

/** @internal */
export function tryGetString(val: any): string {
    if (typeof val === 'string') {
        return val;
    } else {
        throw new RangeError(val + ' is not a string.');
    }
}

/** @internal */
export function getStringOrUndefined(val: any): string {
    try {
        return tryGetString(val);
    } catch (e) {
        return undefined;
    }
}

/** @internal */
export function getBooleanOrUndefined(val: any): boolean {
    try {
        return tryGetBoolean(val);
    } catch (e) {
        return undefined;
    }
}

/** @internal */
export function tryGetEnum<T>(enumClass: any | { [index: string]: number }, str: string): T {
    const result = enumClass[str.toUpperCase()];
    if (result == null) {
        throw new TypeError(str + ' is not a member of the enum ' + enumClass);
    }
    return result;
}

/** @internal */
export function resolvePath(path: string): string {
    const basePath = process.cwd();
    return Path.resolve(basePath, path);
}

/**
 * Returns a random integer between `0` (inclusive) and `upperBound` (exclusive).
 * Upper bound should be an integer.
 * @param upperBound
 * @returns A random integer between [0-upperBound)
 * @internal
 */
export function randomInt(upperBound: number): number {
    return Math.floor(Math.random() * upperBound);
}

/** @internal */
export class Task {
    timeoutId: NodeJS.Timer;
    intervalId: NodeJS.Timer;
}

/** @internal */
export function scheduleWithRepetition(callback: () => void,
                                       initialDelayMs: number,
                                       periodMs: number): Task {
    const task = new Task();
    task.timeoutId = setTimeout(() => {
        callback();
        task.intervalId = setInterval(callback, periodMs);
    }, initialDelayMs);
    return task;
}

/** @internal */
export function cancelRepetitionTask(task: Task): void {
    if (task.intervalId !== undefined) {
        clearInterval(task.intervalId);
    } else if (task.timeoutId !== undefined) {
        clearTimeout(task.timeoutId);
    }
}

/** @internal */
export interface DeferredPromise<T> {
    promise: Promise<T>;
    resolve: (result: T) => void;
    reject: (err: Error) => void;
}

/**
 * Returns a deferred promise.
 * @internal
 */
export function deferredPromise<T>(): DeferredPromise<T> {
    let resolve: any;
    let reject: any;
    const promise = new Promise<T>(function (): void {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve,
        reject,
        promise
    };
}

/**
 * Returns a promise that is resolved after the specified timeout.
 * @param timeout timeout in milliseconds.
 * @internal
 */
export function delayedPromise(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * Returns a Promise that will be fulfilled with the wrapped promise's
 * resolve value or rejection reason. However, if the wrapped promise is
 * not resolved or rejected within the given timeout, the returned
 * promise is rejected with an `Error` or the given error.
 *
 * @param wrapped wrapped promise
 * @param timeout timeout in millisecond
 * @param err optional error for the timeout case
 * @internal
 */
export function timedPromise<T>(wrapped: Promise<T>, timeout: number, err?: Error): Promise<T> {
    const deferred = deferredPromise<T>();
    let timed = false;

    const timer = setTimeout(() => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.reject(new Error('Operation did not finish within timeout: ' + timeout));
        }
        timed = true;
    }, timeout);

    wrapped.then((result) => {
        if (!timed) {
            deferred.resolve(result);
            clearTimeout(timer);
        }
    }).catch((err) => {
        if (!timed) {
            deferred.reject(err);
            clearTimeout(timer);
        }
    });

    return deferred.promise;
}

/**
 * Finds a larger same-version group of data members from a collection of
 * members.
 * Otherwise return a random member from the group. If the same-version
 * groups have the same size, return a member from the newer group.
 *
 * Used for getting an SQL connection for executing SQL.
 *
 * @param members list of all members
 * @throws IllegalStateError If there are more than 2 distinct member versions found
 * @return the chosen member or null, if no data member is found
 */
export function memberOfLargerSameVersionGroup(members: MemberImpl[]): MemberImpl | null {
    // The members should have at most 2 different version (ignoring the patch version).
    // Find a random member from the larger same-version group.

    let version0: MemberVersion | null = null;
    let version1: MemberVersion | null = null;
    let count0 = 0;
    let count1 = 0;

    for (const m of members) {
        if (m.liteMember) {
            continue;
        }

        const version = m.version;

        if (version0 === null || version0.equals(version, true)) {
            version0 = version;
            count0++;
        } else if (version1 === null || version1.equals(version, true)) {
            version1 = version;
            count1++
        } else {
            const strVer0 = version0.toString(true);
            const strVer1 = version1.toString(true);
            const strVer = version.toString(true);

            throw new IllegalStateError(`More than 2 distinct member versions found: ${strVer0}, ${strVer1}, ${strVer}`);
        }
    }

    // no data members
    if (count0 === 0) {
        return null;
    }

    let count: number;
    let version: MemberVersion;

    if (count0 > count1 || count0 === count1
        && BuildInfo.calculateMemberVersion(version0) > BuildInfo.calculateMemberVersion(version1)) {
        count = count0;
        version = version0;
    } else {
        count = count1;
        version = version1;
    }

    // otherwise return a random member from the larger group
    let randomMemberIndex = randomInt(count);
    for (const m of members) {
        if (!m.liteMember && m.version.equals(version, true)) {
            randomMemberIndex--;
            if (randomMemberIndex < 0) {
                return m;
            }
        }
    }
}
