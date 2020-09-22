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
const {
    deferredPromise,
    timedPromise
} = require('../../lib/util/Util');

describe('UtilTest', function () {

    it('deferredPromise: resolves promise on resolve call', function (done) {
        const deferred = deferredPromise();
        let resolveCalled = false;

        deferred.promise
            .then(() => {
                expect(resolveCalled).to.be.true;
                done();
            })
            .catch(done);

        setTimeout(() => {
            deferred.resolve();
            resolveCalled = true;
        }, 50);
    });

    it('deferredPromise: rejects promise on reject call', function (done) {
        const deferred = deferredPromise();
        const rejectWith = new Error();
        let rejectCalled = false;

        deferred.promise
            .catch((err) => {
                expect(rejectCalled).to.be.true;
                expect(err).to.be.equal(rejectWith);
                done();
            })
            .catch(done);

        setTimeout(() => {
            deferred.reject(rejectWith);
            rejectCalled = true;
        }, 50);
    });

    it('timedPromise: rejects by timeout with default error', function (done) {
        const deferred = deferredPromise();
        const timed = timedPromise(deferred.promise, 50);

        timed
            .catch((err) => {
                expect(err).to.be.instanceOf(Error);
                expect(err.message).to.contain('Operation did not finish within timeout');
                done();
            })
            .catch(done);
    });

    it('timedPromise: rejects by timeout with given error', function (done) {
        const deferred = deferredPromise();
        const rejectWith = new Error();
        const timed = timedPromise(deferred.promise, 50, rejectWith);

        timed
            .catch((err) => {
                expect(err).to.be.equal(rejectWith);
                done();
            })
            .catch(done);
    });

    it('timedPromise: resolves when wrapper promise is resolved in time', function (done) {
        const deferred = deferredPromise();
        const timed = timedPromise(deferred.promise, 50);

        deferred.resolve(42);
        timed
            .then((result) => {
                expect(result).to.be.equal(42);
                done();
            })
            .catch(done);
    });

    it('timedPromise: rejects when wrapper promise is rejected in time', function (done) {
        const deferred = deferredPromise();
        const rejectWith = new Error();
        const timed = timedPromise(deferred.promise, 50);

        deferred.reject(rejectWith);
        timed
            .catch((err) => {
                expect(err).to.be.equal(rejectWith);
                done();
            })
            .catch(done);
    });
});
