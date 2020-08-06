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

const expect = require('chai').expect;
const RC = require('../RC');
const Client = require('../../').Client;

describe('PNCounterBasicTest', function () {

    let cluster;
    let client;
    let pnCounter;

    before(function () {
        return RC.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        }).then(function (member) {
            return Client.newHazelcastClient({ clusterName: cluster.id });
        }).then(function (cl) {
            client = cl;
        });
    });

    after(function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    beforeEach(function () {
        return client.getPNCounter('pncounter').then(function (counter) {
            pnCounter = counter;
        });
    });

    afterEach(function () {
        return pnCounter.destroy();
    });

    function testPNCounterMethod(promise, returnVal, postOperation) {
        return promise.then(function (value) {
            expect(value.toNumber()).to.equal(returnVal);
            return pnCounter.get();
        }).then(function (value) {
            return expect(value.toNumber()).to.equal(postOperation);
        });
    }

    it('get', function () {
        return pnCounter.getAndAdd(4).then(function (value) {
            return pnCounter.get();
        }).then(function (value) {
            return expect(value.toNumber()).to.equal(4);
        });
    });

    it('getAndAdd', function () {
        return testPNCounterMethod(pnCounter.getAndAdd(3), 0, 3);
    });

    it('addAndGet', function () {
        return testPNCounterMethod(pnCounter.addAndGet(3), 3, 3);
    });

    it('getAndSubtract', function () {
        return testPNCounterMethod(pnCounter.getAndSubtract(3), 0, -3);
    });

    it('subtractAndGet', function () {
        return testPNCounterMethod(pnCounter.subtractAndGet(3), -3, -3);
    });

    it('decrementAndGet', function () {
        return testPNCounterMethod(pnCounter.decrementAndGet(3), -1, -1);
    });

    it('incrementAndGet', function () {
        return testPNCounterMethod(pnCounter.incrementAndGet(), 1, 1);
    });

    it('getAndDecrement', function () {
        return testPNCounterMethod(pnCounter.getAndDecrement(), 0, -1);
    });

    it('getAndIncrement', function () {
        return testPNCounterMethod(pnCounter.getAndIncrement(), 0, 1);
    });
});
