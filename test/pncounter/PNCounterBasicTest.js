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
var RC = require('../RC');
var Client = require('../../').Client;
var Util = require('../Util');

describe('PNCounterBasicTest', function () {

    var cluster;
    var client;
    var pncounter;

    before(function () {
        return RC.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        }).then(function (member) {
            return Client.newHazelcastClient();
        }).then(function (cl) {
            client = cl;
        });
    });

    after(function () {
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    beforeEach(function () {
        Util.markServerVersionAtLeast(this, client, '3.10');
        return client.getPNCounter('pncounter').then(function (counter) {
            pncounter = counter;
        })
    });

    afterEach(function () {
        return pncounter.destroy();
    });

    function testPNCounterMethod(promise, returnVal, postOperation) {
        return promise.then(function (value) {
            expect(value.toNumber()).to.equal(returnVal);
            return pncounter.get();
        }).then(function (value) {
            return expect(value.toNumber()).to.equal(postOperation);
        });
    }

    it('get', function () {
        return pncounter.getAndAdd(4).then(function (value) {
            return pncounter.get();
        }).then(function (value) {
            return expect(value.toNumber()).to.equal(4);
        });
    });

    it('getAndAdd', function () {
        return testPNCounterMethod(pncounter.getAndAdd(3), 0, 3);
    });

    it('addAndGet', function () {
        return testPNCounterMethod(pncounter.addAndGet(3), 3, 3);
    });

    it('getAndSubtract', function () {
        return testPNCounterMethod(pncounter.getAndSubtract(3), 0, -3);
    });

    it('subtractAndGet', function () {
        return testPNCounterMethod(pncounter.subtractAndGet(3), -3, -3);
    });

    it('decrementAndGet', function () {
        return testPNCounterMethod(pncounter.decrementAndGet(3), -1, -1);
    });

    it('incrementAndGet', function () {
        return testPNCounterMethod(pncounter.incrementAndGet(), 1, 1);
    });

    it('getAndDecrement', function () {
        return testPNCounterMethod(pncounter.getAndDecrement(), 0, -1);
    });

    it('getAndIncrement', function () {
        return testPNCounterMethod(pncounter.getAndIncrement(), 0, 1);
    });
});
