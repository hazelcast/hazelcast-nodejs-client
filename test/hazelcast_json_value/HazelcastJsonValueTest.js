/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var expect = require('chai').expect;
var assert = require('assert');
var HazelcastJsonValue = require('../../.').HazelcastJsonValue;

describe('HazelcastJsonValue', function () {
    it('constructing HazelcastJsonValue with null or undefined', function () {
        expect(function () {
            new HazelcastJsonValue(null);
        }).to.throw(assert.AssertionError);

        expect(function () {
            new HazelcastJsonValue(undefined);
        }).to.throw(assert.AssertionError);
    });

    it('constructing HazelcastJsonValue with non-string value', function () {
       expect(function () {
           new HazelcastJsonValue(123);
       }).to.throw(assert.AssertionError);
    });
});
