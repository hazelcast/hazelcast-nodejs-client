/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import * as Long from 'long';
import {PagingPredicate} from './serialization/DefaultPredicates';
import {IterationType} from './core/Predicate';
import * as assert from 'assert';
import {Comparator} from './core/Comparator';
import * as Path from 'path';
import {JsonConfigLocator} from './config/JsonConfigLocator';
import Address = require('./Address');
export function assertNotNull(v: any) {
    assert.notEqual(v, null, 'Non null value expected.');
}

export function assertArray(x: any) {
    assert(Array.isArray(x), 'Should be array.');
}

export function shuffleArray<T>(array: Array<T>): void {
    var randomIndex: number;
    var temp: T;
    for (var i = array.length; i > 1; i--) {
        randomIndex = Math.floor(Math.random() * i);
        temp = array[i - 1];
        array[i - 1] = array[randomIndex];
        array[randomIndex] = temp;
    }
}

export function assertNotNegative(v: number, message: string = 'The value cannot be negative.') {
    assert(v >= 0, message);
}

export function getType(obj: any): string {
    assertNotNull(obj);
    if (Long.isLong(obj)) {
        return 'long';
    } else {
        var t = typeof obj;
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

export function getSortedQueryResultSet(list: Array<any>, predicate: PagingPredicate) {
    if (list.length === 0) {
        return list;
    }
    var comparatorObject = predicate.getComparator();
    if (comparatorObject == null) {
        comparatorObject = createComparator(predicate.getIterationType());
    }
    list.sort(comparatorObject.sort.bind(comparatorObject));
    var nearestAnchorEntry = (predicate == null) ? null : predicate.getNearestAnchorEntry();
    var nearestPage = nearestAnchorEntry[0];
    var page = predicate.getPage();
    var pageSize = predicate.getPageSize();
    var begin = pageSize * (page - nearestPage - 1);
    var size = list.length;
    if (begin > size ) {
        return [];
    }
    var end = begin + pageSize;
    if (end > size) {
        end = size;
    }

    setAnchor(list, predicate, nearestPage);
    var iterationType = predicate.getIterationType();
    return list.slice(begin, end).map(function(item) {
        switch (iterationType) {
            case IterationType.ENTRY: return item;
            case IterationType.KEY: return item[0];
            case IterationType.VALUE: return item[1];
        }
    });
}

export function copyObjectShallow<T>(obj: T): T {
    if (obj === undefined || obj === null) {
        return obj;
    }
    if (typeof obj === 'object') {
        var newObj: any = {};
        for (var prop in obj) {
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

export function tryGetArray(val: any): Array<any> {
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

export function getStringOrUndefined(val: any) {
    try {
        return tryGetString(val);
    } catch (e) {
        return undefined;
    }
}

export function getBooleanOrUndefined(val: any) {
    try {
        return tryGetBoolean(val);
    } catch (e) {
        return undefined;
    }
}

export function tryGetEnum<T>(enumClass: any | {[index: string]: number}, str: string): T {
    return <any>enumClass[str.toUpperCase()];
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
    let requirePath = require(resolvePath(path));
    if (exportedName === undefined) {
        return requirePath;
    } else {
        return require(resolvePath(path))[exportedName];
    }
}

export function createAddressFromString(address: string, defaultPort?: number): Address {
    let indexBracketStart = address.indexOf('[');
    let indexBracketEnd = address.indexOf(']', indexBracketStart);
    let indexColon = address.indexOf(':');
    let lastIndexColon = address.lastIndexOf(':');
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

export function mergeJson(base: any, other: any): void {
    for (let key in other) {
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

function createComparator(iterationType: IterationType): Comparator  {
    var object: Comparator = {
        sort: function(a: [any, any], b: [any, any]): number {
            return 0;
        }
    };
    switch (iterationType) {
        case IterationType.KEY:
            object.sort = (e1: [any, any], e2: [any, any]) => {return e1[0] < e2[0] ? -1 : +(e1[0] > e2[0]); }; break;
        case IterationType.ENTRY:
            object.sort = (e1: [any, any], e2: [any, any]) => {return e1[1] < e2[1] ? -1 : +(e1[1] > e2[1]); }; break;
        case IterationType.VALUE:
            object.sort = (e1: [any, any], e2: [any, any]) => {return e1[1] < e2[1] ? -1 : +(e1[1] > e2[1]); }; break;
    }
    return object;
}

function setAnchor(list: Array<any>, predicate: PagingPredicate, nearestPage: number) {
    assert(list.length > 0);
    var size = list.length;
    var pageSize = predicate.getPageSize();
    var page = predicate.getPage();
    for (var i = pageSize; i <= size && nearestPage < page; i += pageSize ) {
        var anchor = list[i - 1];
        nearestPage++;
        predicate.setAnchor(nearestPage, anchor);
    }
}
