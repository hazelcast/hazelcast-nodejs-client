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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const {
    deferredPromise,
    timedPromise
} = require('../../../lib/util/Util');

describe('UtilTest', function () {

    it('deferredPromise: resolves promise on resolve call', async function () {
        const deferred = deferredPromise();
        let resolveCalled = false;

        setTimeout(() => {
            deferred.resolve(1);
            resolveCalled = true;
        }, 50);

        const result = await deferred.promise;
        expect(resolveCalled).to.be.true;
        expect(result).to.be.equal(1);
    });

    it('deferredPromise: rejects promise on reject call', async function () {
        const deferred = deferredPromise();
        const rejectWith = new Error();
        let rejectCalled = false;

        setTimeout(() => {
            deferred.reject(rejectWith);
            rejectCalled = true;
        }, 50);

        await deferred.promise.catch((err) => {
            expect(rejectCalled).to.be.true;
            expect(err).to.be.equal(rejectWith);
        });
    });

    it('timedPromise: rejects by timeout with default error', async function () {
        const deferred = deferredPromise();
        const timed = timedPromise(deferred.promise, 50);

        await timed.catch((err) => {
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.contain('Operation did not finish within timeout');
        });
    });

    it('timedPromise: rejects by timeout with given error', async function () {
        const deferred = deferredPromise();
        const rejectWith = new Error();
        const timed = timedPromise(deferred.promise, 50, rejectWith);

        await timed.catch((err) => {
            expect(err).to.be.equal(rejectWith);
        });
    });

    it('timedPromise: resolves when wrapper promise is resolved in time', async function () {
        const deferred = deferredPromise();
        const timed = timedPromise(deferred.promise, 50);

        deferred.resolve(42);
        const result = await timed;
        expect(result).to.be.equal(42);
    });

    it('timedPromise: rejects when wrapper promise is rejected in time', async function () {
        const deferred = deferredPromise();
        const rejectWith = new Error();
        const timed = timedPromise(deferred.promise, 50);

        deferred.reject(rejectWith);
        await timed.catch((err) => {
            expect(err).to.be.equal(rejectWith);
        });
    });
});
