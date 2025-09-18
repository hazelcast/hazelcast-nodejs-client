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
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberOfLargerSameVersionGroup = exports.timedPromise = exports.delayedPromise = exports.deferredPromise = exports.cancelRepetitionTask = exports.scheduleWithRepetition = exports.Task = exports.randomInt = exports.resolvePath = exports.tryGetEnum = exports.getBooleanOrUndefined = exports.getStringOrUndefined = exports.tryGetStringOrNull = exports.getTypeKeyForDefaultNumberType = exports.tryGetString = exports.tryGetLong = exports.tryGetArray = exports.tryGetNumber = exports.tryGetBoolean = exports.enumFromString = exports.shuffleArray = exports.assertPositiveNumber = exports.assertNonNegativeNumber = exports.assertNumber = exports.assertString = exports.assertArray = exports.assertNotNull = void 0;
const assert = require("assert");
const Long = require("long");
const Path = require("path");
const core_1 = require("../core");
const BuildInfo_1 = require("../BuildInfo");
const SerializationSymbols_1 = require("../serialization/SerializationSymbols");
/** @internal */
function assertNotNull(v) {
    assert.notStrictEqual(v, null, 'Non null value expected.');
}
exports.assertNotNull = assertNotNull;
/** @internal */
function assertArray(x) {
    assert(Array.isArray(x), 'Should be array.');
}
exports.assertArray = assertArray;
/** @internal */
function assertString(v) {
    assert(typeof v === 'string', 'String value expected.');
}
exports.assertString = assertString;
/** @internal */
function assertNumber(v) {
    assert(typeof v === 'number', 'Number value expected.');
}
exports.assertNumber = assertNumber;
/** @internal */
function assertNonNegativeNumber(v, m) {
    assert(typeof v === 'number', m || 'Number value expected.');
    assert(v >= 0, m || 'Non-negative value expected.');
}
exports.assertNonNegativeNumber = assertNonNegativeNumber;
/** @internal */
function assertPositiveNumber(v, m) {
    assert(typeof v === 'number', m || 'Number value expected.');
    assert(v > 0, m || 'Positive value expected.');
}
exports.assertPositiveNumber = assertPositiveNumber;
/** @internal */
function shuffleArray(array) {
    let randomIndex;
    let temp;
    for (let i = array.length; i > 1; i--) {
        randomIndex = Math.floor(Math.random() * i);
        temp = array[i - 1];
        array[i - 1] = array[randomIndex];
        array[randomIndex] = temp;
    }
}
exports.shuffleArray = shuffleArray;
/** @internal */
function enumFromString(enumType, value) {
    return enumType[value.toUpperCase()];
}
exports.enumFromString = enumFromString;
/** @internal */
function tryGetBoolean(val) {
    if (typeof val === 'boolean') {
        return val;
    }
    else {
        throw new RangeError(val + ' is not a boolean.');
    }
}
exports.tryGetBoolean = tryGetBoolean;
/** @internal */
function tryGetNumber(val) {
    if (typeof val === 'number') {
        return val;
    }
    else {
        throw new RangeError(val + ' is not a number.');
    }
}
exports.tryGetNumber = tryGetNumber;
/** @internal */
function tryGetArray(val) {
    if (Array.isArray(val)) {
        return val;
    }
    else {
        throw new RangeError(val + ' is not an array.');
    }
}
exports.tryGetArray = tryGetArray;
/** @internal */
function tryGetLong(val) {
    if (Long.isLong(val)) {
        return val;
    }
    else {
        throw new RangeError(val + ' is not a long.');
    }
}
exports.tryGetLong = tryGetLong;
/** @internal */
function tryGetString(val) {
    if (typeof val === 'string') {
        return val;
    }
    else {
        throw new RangeError(val + ' is not a string.');
    }
}
exports.tryGetString = tryGetString;
/** @internal */
// eslint-disable-next-line @typescript-eslint/ban-types
function getTypeKeyForDefaultNumberType(defaultNumberType) {
    switch (defaultNumberType) {
        case 'byte':
            return SerializationSymbols_1.SerializationSymbols.BYTE_SYMBOL;
        case 'short':
            return SerializationSymbols_1.SerializationSymbols.SHORT_SYMBOL;
        case 'integer':
            return SerializationSymbols_1.SerializationSymbols.INTEGER_SYMBOL;
        case 'float':
            return SerializationSymbols_1.SerializationSymbols.FLOAT_SYMBOL;
        case 'double':
            return SerializationSymbols_1.SerializationSymbols.DOUBLE_SYMBOL;
        case 'long':
            return Long;
        default:
            throw new RangeError(`Unexpected defaultNumberType value. (${defaultNumberType})
                Expected values: byte, short, integer, float, double, long`);
    }
}
exports.getTypeKeyForDefaultNumberType = getTypeKeyForDefaultNumberType;
/** @internal */
function tryGetStringOrNull(val) {
    if (val === null || typeof val === 'string') {
        return val;
    }
    throw new RangeError(val + ' is not a string or null.');
}
exports.tryGetStringOrNull = tryGetStringOrNull;
/** @internal */
function getStringOrUndefined(val) {
    try {
        return tryGetString(val);
    }
    catch (e) {
        return undefined;
    }
}
exports.getStringOrUndefined = getStringOrUndefined;
/** @internal */
function getBooleanOrUndefined(val) {
    try {
        return tryGetBoolean(val);
    }
    catch (e) {
        return undefined;
    }
}
exports.getBooleanOrUndefined = getBooleanOrUndefined;
/** @internal */
function tryGetEnum(enumClass, str) {
    const result = enumClass[str.toUpperCase()];
    if (result == null) {
        throw new TypeError(str + ' is not a member of the enum ' + enumClass);
    }
    return result;
}
exports.tryGetEnum = tryGetEnum;
/** @internal */
function resolvePath(path) {
    const basePath = process.cwd();
    return Path.resolve(basePath, path);
}
exports.resolvePath = resolvePath;
/**
 * Returns a random integer between `0` (inclusive) and `upperBound` (exclusive).
 * Upper bound should be an integer.
 * @param upperBound
 * @returns A random integer between [0-upperBound)
 * @internal
 */
function randomInt(upperBound) {
    return Math.floor(Math.random() * upperBound);
}
exports.randomInt = randomInt;
/** @internal */
class Task {
}
exports.Task = Task;
/** @internal */
function scheduleWithRepetition(callback, initialDelayMs, periodMs) {
    const task = new Task();
    task.timeoutId = setTimeout(() => {
        callback();
        task.intervalId = setInterval(callback, periodMs);
    }, initialDelayMs);
    return task;
}
exports.scheduleWithRepetition = scheduleWithRepetition;
/** @internal */
function cancelRepetitionTask(task) {
    if (task.intervalId !== undefined) {
        clearInterval(task.intervalId);
    }
    else if (task.timeoutId !== undefined) {
        clearTimeout(task.timeoutId);
    }
}
exports.cancelRepetitionTask = cancelRepetitionTask;
/**
 * Returns a deferred promise.
 * @internal
 */
function deferredPromise() {
    let resolve;
    let reject;
    const promise = new Promise(function () {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve,
        reject,
        promise
    };
}
exports.deferredPromise = deferredPromise;
/**
 * Returns a promise that is resolved after the specified timeout.
 * @param timeout timeout in milliseconds.
 * @internal
 */
function delayedPromise(timeout) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
}
exports.delayedPromise = delayedPromise;
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
function timedPromise(wrapped, timeout, err) {
    const deferred = deferredPromise();
    let timed = false;
    const timer = setTimeout(() => {
        if (err) {
            deferred.reject(err);
        }
        else {
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
exports.timedPromise = timedPromise;
/**
 * Finds a larger same-version group of data members from a collection of
 * members.
 * Otherwise return a random member from the group. If the same-version
 * groups have the same size, return a member from the newer group.
 *
 * Used for getting an SQL connection for executing SQL.
 *
 * @param members list of all members
 * @throws {@link IllegalStateError} If there are more than 2 distinct member versions found
 * @return the chosen member or null, if no data member is found
 * @internal
 */
function memberOfLargerSameVersionGroup(members) {
    // The members should have at most 2 different version (ignoring the patch version).
    // Find a random member from the larger same-version group.
    let version0 = null;
    let version1 = null;
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
        }
        else if (version1 === null || version1.equals(version, true)) {
            version1 = version;
            count1++;
        }
        else {
            const strVer0 = version0.toString(true);
            const strVer1 = version1.toString(true);
            const strVer = version.toString(true);
            throw new core_1.IllegalStateError(`More than 2 distinct member versions found: ${strVer0}, ${strVer1}, ${strVer}`);
        }
    }
    // no data members
    if (count0 === 0) {
        return null;
    }
    let count;
    let version;
    if (count0 > count1 || count0 === count1
        && BuildInfo_1.BuildInfo.calculateMemberVersion(version0) > BuildInfo_1.BuildInfo.calculateMemberVersion(version1)) {
        count = count0;
        version = version0;
    }
    else {
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
exports.memberOfLargerSameVersionGroup = memberOfLargerSameVersionGroup;
//# sourceMappingURL=Util.js.map