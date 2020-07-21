/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

import * as assert from 'assert';
import * as Long from 'long';
import * as Promise from 'bluebird';
import * as Path from 'path';
import {JsonConfigLocator} from './config/JsonConfigLocator';
import {Address} from './Address';

export function assertNotNull(v: any): void {
    assert.notEqual(v, null, 'Non null value expected.');
}

export function assertArray(x: any): void {
    assert(Array.isArray(x), 'Should be array.');
}

export function assertString(v: any): void {
    assert(typeof v === 'string', 'String value expected.');
}

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

export function assertNotNegative(v: number, message = 'The value cannot be negative.'): void {
    assert(v >= 0, message);
}

export function getType(obj: any): string {
    assertNotNull(obj);
    if (Long.isLong(obj)) {
        return 'long';
    } else {
        const t = typeof obj;
        if (t !== 'object') {
            return t;
        } else {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        }
    }
}

export function enumFromString<T>(enumType: any, value: string): T {
    return enumType[value];
}

export function copyObjectShallow<T>(obj: T): T {
    if (obj === undefined || obj === null) {
        return obj;
    }
    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                newObj[prop] = obj[prop];
            }
        }
        return newObj;
    }
    assert(false, 'Object should be undefined or type of object.');
}

export function tryGetBoolean(val: any): boolean {
    if (typeof val === 'boolean') {
        return val;
    } else {
        throw new RangeError(val + ' is not a boolean.');
    }
}

export function tryGetNumber(val: any): number {
    if (typeof val === 'number') {
        return val;
    } else {
        throw new RangeError(val + ' is not a number.');
    }
}

export function tryGetArray(val: any): any[] {
    if (Array.isArray(val)) {
        return val;
    } else {
        throw new RangeError(val + ' is not an array.');
    }
}

export function tryGetString(val: any): string {
    if (typeof val === 'string') {
        return val;
    } else {
        throw new RangeError(val + ' is not a string.');
    }
}

export function getStringOrUndefined(val: any): string {
    try {
        return tryGetString(val);
    } catch (e) {
        return undefined;
    }
}

export function getBooleanOrUndefined(val: any): boolean {
    try {
        return tryGetBoolean(val);
    } catch (e) {
        return undefined;
    }
}

export function tryGetEnum<T>(enumClass: any | { [index: string]: number }, str: string): T {
    const result = enumClass[str.toUpperCase()];
    if (result == null) {
        throw new TypeError(str + ' is not a member of the enum ' + enumClass);
    }
    return result;
}

export function resolvePath(path: string): string {
    let basePath: string;
    if (process.env[JsonConfigLocator.ENV_VARIABLE_NAME]) {
        basePath = Path.dirname(process.env[JsonConfigLocator.ENV_VARIABLE_NAME]);
    } else {
        basePath = process.cwd();
    }
    return Path.resolve(basePath, path);
}

export function loadNameFromPath(path: string, exportedName: string): any {
    const requirePath = require(resolvePath(path)); /*eslint-disable-line @typescript-eslint/no-var-requires*/
    if (exportedName === undefined) {
        return requirePath;
    } else {
        return requirePath[exportedName];
    }
}

export class AddressHelper {
    private static readonly MAX_PORT_TRIES: number = 3;
    private static readonly INITIAL_FIRST_PORT: number = 5701;

    static getSocketAddresses(address: string): Address[] {
        const addressHolder = this.createAddressFromString(address, -1);
        let possiblePort = addressHolder.port;
        let maxPortTryCount = 1;
        if (possiblePort === -1) {
            maxPortTryCount = AddressHelper.MAX_PORT_TRIES;
            possiblePort = AddressHelper.INITIAL_FIRST_PORT;
        }

        const addresses: Address[] = [];

        for (let i = 0; i < maxPortTryCount; i++) {
            addresses.push(new Address(addressHolder.host, possiblePort + i));
        }

        return addresses;
    }

    static createAddressFromString(address: string, defaultPort?: number): Address {
        const indexBracketStart = address.indexOf('[');
        const indexBracketEnd = address.indexOf(']', indexBracketStart);
        const indexColon = address.indexOf(':');
        const lastIndexColon = address.lastIndexOf(':');
        let host: string;
        let port = defaultPort;
        if (indexColon > -1 && lastIndexColon > indexColon) {
            // IPv6
            if (indexBracketStart === 0 && indexBracketEnd > indexBracketStart) {
                host = address.substring(indexBracketStart + 1, indexBracketEnd);
                if (lastIndexColon === indexBracketEnd + 1) {
                    port = Number.parseInt(address.substring(lastIndexColon + 1));
                }
            } else {
                host = address;
            }
        } else if (indexColon > 0 && indexColon === lastIndexColon) {
            host = address.substring(0, indexColon);
            port = Number.parseInt(address.substring(indexColon + 1));
        } else {
            host = address;
        }
        return new Address(host, port);
    }

}

export function mergeJson(base: any, other: any): void {
    for (const key in other) {
        if (Array.isArray(base[key]) && Array.isArray(other[key])) {
            base[key] = base[key].concat(other[key]);
        } else if (typeof base[key] === 'object' && typeof other[key] === 'object') {
            mergeJson(base[key], other[key]);
        } else {
            base[key] = other[key];
        }
    }
}

/**
 * Returns a random integer between 0(inclusive) and `upperBound`(exclusive)
 * Upper bound should be an integer.
 * @param upperBound
 * @returns A random integer between [0-upperBound)
 */
export function randomInt(upperBound: number): number {
    return Math.floor(Math.random() * upperBound);
}

export class Task {
    intervalId: NodeJS.Timer;
    timeoutId: NodeJS.Timer;
}

export function scheduleWithRepetition(callback: (...args: any[]) => void, initialDelay: number,
                                       periodMillis: number): Task {
    const task = new Task();
    task.timeoutId = setTimeout(function (): void {
        callback();
        task.intervalId = setInterval(callback, periodMillis);
    }, initialDelay);

    return task;
}

export function cancelRepetitionTask(task: Task): void {
    if (task.intervalId != null) {
        clearInterval(task.intervalId);
    } else if (task.timeoutId != null) {
        clearTimeout(task.timeoutId);
    }
}

export function DeferredPromise<T>(): Promise.Resolver<T> {
    let resolve: any;
    let reject: any;
    const promise = new Promise(function (): void {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve,
        reject,
        promise,
    } as Promise.Resolver<T>;
}

export function getNodejsMajorVersion(): number {
    const versionString = process.version;
    const versions = versionString.split('.');
    return Number.parseInt(versions[0].substr(1));
}
