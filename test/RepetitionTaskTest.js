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

var expect = require('chai').expect;

var Util = require("../lib/Util");
var TestUtil = require('./Util');

describe('Repetition Task', function () {

    it('should be cancelled before timeout', function () {
        var counter = 0;
        var task = Util.scheduleWithRepetition(function () {
            counter++;
        }, 50, 75);

        return TestUtil.promiseWaitMilliseconds(40).then(function () {
            Util.cancelRepetitionTask(task);
            expect(counter).to.be.equal(0);
        }).then(function () {
            return TestUtil.promiseWaitMilliseconds(130)
        }).then(function () {
            expect(counter).to.be.equal(0);
        });
    });

    it('should be cancelled after timeout', function () {
        var counter = 0;
        var task = Util.scheduleWithRepetition(function () {
            counter++;
        }, 50, 75);

        return TestUtil.promiseWaitMilliseconds(60).then(function () {
            Util.cancelRepetitionTask(task);
            expect(counter).to.be.equal(1);
        }).then(function () {
            return TestUtil.promiseWaitMilliseconds(75)
        }).then(function () {
            expect(counter).to.be.equal(1);
        });
    });

    it('should be cancelled after interval', function () {
        var counter = 0;
        var task = Util.scheduleWithRepetition(function () {
            counter++;
        }, 50, 75);

        return TestUtil.promiseWaitMilliseconds(130).then(function () {
            Util.cancelRepetitionTask(task);
            expect(counter).to.be.equal(2);
        }).then(function () {
            return TestUtil.promiseWaitMilliseconds(75)
        }).then(function () {
            expect(counter).to.be.equal(2);
        });
    });

    it('should not throw when cancelled twice', function () {
        var task = Util.scheduleWithRepetition(function () {
        }, 100, 200);

        Util.cancelRepetitionTask(task);
        Util.cancelRepetitionTask(task);
    });
});
