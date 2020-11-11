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
'use strict';

const { expect } = require('chai');
const { murmur } = require('../../../lib/invocation/Murmur');

describe('MurmurTest', function () {

    // Expected values are from the Java implementation
    const payloads = [
        { input: Buffer.from('key-1'), expected: 1228513025 },
        { input: Buffer.from('key-2'), expected: 1503416236 },
        { input: Buffer.from('key-3'), expected: 1876349747 },
        { input: Buffer.from('key-4'), expected: -914632498 },
        { input: Buffer.from('key-5'), expected: -803210507 },
        { input: Buffer.from('key-6'), expected: -847942313 },
        { input: Buffer.from('key-7'), expected: 1196747334 },
        { input: Buffer.from('key-8'), expected: -1444149994 },
        { input: Buffer.from('key-9'), expected: 1182720020 },
        // tests with different lengths
        { input: Buffer.from(''), expected: -1585187909 },
        { input: Buffer.from('a'), expected: -1686100800 },
        { input: Buffer.from('ab'), expected: 312914265 },
        { input: Buffer.from('abc'), expected: -2068121803 },
        { input: Buffer.from('abcd'), expected: -973615161 }
    ];

    it('should produce same murmurhash3 results as Java implementation', function () {
        for (const payload of payloads) {
            expect(murmur(payload.input)).to.be.equal(payload.expected);
        }
    });
});
