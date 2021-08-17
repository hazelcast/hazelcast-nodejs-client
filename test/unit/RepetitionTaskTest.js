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
const Util = require('../../lib/util/Util');
const TestUtil = require('../TestUtil');

describe('RepetitionTaskTest', function () {
    it('should be cancelled before timeout', async function () {
        let counter = 0;
        const task = Util.scheduleWithRepetition(() => counter++, 50, 100);

        await TestUtil.promiseWaitMilliseconds(25);
        Util.cancelRepetitionTask(task);
        expect(counter).to.be.equal(0);
        await TestUtil.promiseWaitMilliseconds(150);
        expect(counter).to.be.equal(0);
    });

    it('should be cancelled after timeout', async function () {
        let counter = 0;
        const task = Util.scheduleWithRepetition(() => {
            counter++;
        }, 50, 100);

        await TestUtil.promiseWaitMilliseconds(100);
        Util.cancelRepetitionTask(task);
        expect(counter).to.be.equal(1);
        await TestUtil.promiseWaitMilliseconds(100);
        expect(counter).to.be.equal(1);
    });

    it('should be cancelled after interval', async function () {
        let counter = 0;
        const task = Util.scheduleWithRepetition(() => counter++, 50, 100);

        await TestUtil.promiseWaitMilliseconds(200);
        Util.cancelRepetitionTask(task);
        expect(counter).to.be.equal(2);
        await TestUtil.promiseWaitMilliseconds(75);
        expect(counter).to.be.equal(2);
    });

    it('should not throw when cancelled twice', function () {
        const task = Util.scheduleWithRepetition(() => {}, 100, 200);

        Util.cancelRepetitionTask(task);
        Util.cancelRepetitionTask(task);
    });
});
