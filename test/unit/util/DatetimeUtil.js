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

const {expect} = require('chai');
const {
    parseTimeString,
    getTimeOfIsoString,
    combineISOStringWithTimeString
} = require('../../../lib/util/DatetimeUtil');

describe('DatetimeUtilTest', function () {
    describe('parseTimeStringTest', function () {

        it('should give 0 hours when hour is not a number', function () {
            expect(parseTimeString('10as-:32:23.123').hours).to.be.equal(0);
        });

        it('should give 0 minutes when minute is not a number', function () {
            expect(parseTimeString('10:3s-2:23.123as').minutes).to.be.equal(0);
        });
        it('should give 0 seconds when seconds is not a number', function () {
            expect(parseTimeString('10:32:-.123as').seconds).to.be.equal(0);
        });
        it('should give 0 nano when precision is absent', function () {
            expect(parseTimeString('10:32:23').nano).to.be.equal(0);
        });

        it('should give all 0 if invalid format string given', function () {
            const parsed = parseTimeString('10::32:23.123456789');
            expect(parsed.hours).to.be.equal(0);
            expect(parsed.minutes).to.be.equal(0);
            expect(parsed.seconds).to.be.equal(0);
            expect(parsed.nano).to.be.equal(0);
        });

        it('should correctly parse time string', function () {
            const parsed = parseTimeString('10:32:23.123456789');
            expect(parsed.hours).to.be.equal(10);
            expect(parsed.minutes).to.be.equal(32);
            expect(parsed.seconds).to.be.equal(23);
            expect(parsed.nano).to.be.equal(123456789);
        });

        it('should have at most 9 digits in nano', function () {
            const parsed = parseTimeString('10:32:23.1234567891');
            expect(parsed.hours).to.be.equal(10);
            expect(parsed.minutes).to.be.equal(32);
            expect(parsed.seconds).to.be.equal(23);
            expect(parsed.nano.toString().length).to.be.equal(9);
        });

    });
    describe('getTimeOfIsoStringTest', function () {
        it('should extract time string of iso string, without time zone', function () {
            expect(getTimeOfIsoString('2021-04-06T12:00:09.401Z')).to.be.equal('12:00:09.401Z');
        });

        it('should extract time string of iso string, with time zone', function () {
            expect(getTimeOfIsoString('2021-04-06T12:00:09.401+01:30')).to.be.equal('12:00:09.401+01:30');
        });
    });
    describe('combineTimeAndDateStringsTest', function () {
        it('should be able to combine iso string with time string', function () {
            expect(
                combineISOStringWithTimeString('2021-04-06T12:00:09.401Z', '12:30:09.123456789')
            ).to.be.equal('2021-04-06T12:30:09.123456789Z');
        });

        it('should be able to combine iso string with time string with positive timezone', function () {
            expect(
                combineISOStringWithTimeString('2021-04-06T12:00:09.401+01:45', '12:30:09.123456789')
            ).to.be.equal('2021-04-06T12:30:09.123456789+01:45');
        });

        it('should be able to combine iso string with time string with negative timezone', function () {
            expect(
                combineISOStringWithTimeString('2021-04-06T12:00:09.401-01:46', '12:30:09.123456789')
            ).to.be.equal('2021-04-06T12:30:09.123456789-01:46');
        });

        it('should be able to combine iso string with time string without timezone', function () {
            expect(
                combineISOStringWithTimeString('2021-04-06T12:00:09.401', '12:30:09.123456789')
            ).to.be.equal('2021-04-06T12:30:09.123456789');
        });
    });
});
