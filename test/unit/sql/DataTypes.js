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
'use strict';

const { expect } = require('chai');
const { HzLocalTime } = require('../../../lib/sql/DataTypes');
const { IllegalArgumentError } = require('../../../lib/core/HazelcastError');

describe('BuildInfo', function () {
    it('should return hour, minute and seconds correctly', function () {
        const newHzTime = new HzLocalTime(2, 3, 4, 60000);
        expect(newHzTime.getHour()).to.be.equal(2);
        expect(newHzTime.getMinute()).to.be.equal(3);
        expect(newHzTime.getSecond()).to.be.equal(4);
        expect(newHzTime.getNano()).to.be.equal(60000);
    });

    it('should throw IllegalArgumentError if hour is not an integer between 0-23(inclusive)', function () {
        expect(() => new HzLocalTime(-1, 1, 1, 1)).to.throw(IllegalArgumentError, 'Hour');
        expect(() => new HzLocalTime(1.1, 1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(25, 1, 1, 1)).to.throw(IllegalArgumentError, 'Hour');
        expect(() => new HzLocalTime('500', 1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime({}, 1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime([], 1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(24, 1, 1, 1)).to.throw(IllegalArgumentError, 'Hour');
    });

    it('should throw IllegalArgumentError if minute is not an integer between 0-59(inclusive)', function () {
        expect(() => new HzLocalTime(1, -1, 1, 1)).to.throw(IllegalArgumentError, 'Minute');
        expect(() => new HzLocalTime(1, 1.1, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(1, 233, 1, 1)).to.throw(IllegalArgumentError, 'Minute');
        expect(() => new HzLocalTime(1, "1", 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(1, {1:1}, 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(1, [], 1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(1, 60, 1, 1)).to.throw(IllegalArgumentError, 'Minute');
    });

    it('should throw IllegalArgumentError if seconds is not an integer between 0-59(inclusive)', function () {
        expect(() => new HzLocalTime(1, 1, -1, 1)).to.throw(IllegalArgumentError, 'Second');
        expect(() => new HzLocalTime(1, 1, 1.1, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(1, 1, 233, 1)).to.throw(IllegalArgumentError, 'Second');
        expect(() => new HzLocalTime(1, 1, "1", 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(1, 1, {1:1}, 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(1, 1, [], 1)).to.throw(IllegalArgumentError, 'All arguments must be integers');
        expect(() => new HzLocalTime(1, 1, 60, 1)).to.throw(IllegalArgumentError, 'Second');
    });

    it('should give string zero padded correctly', function () {
        expect(new HzLocalTime(1, 1, 1, 1).toString()).to.be.eq('01:01:01.000000001');
        expect(new HzLocalTime(12, 10, 10, 1).toString()).to.be.eq('12:10:10.000000001');
        expect(new HzLocalTime(23, 1, 11, 99999).toString()).to.be.eq('23:01:11.000099999');
    });
});
