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

var expect = require("chai").expect;
var Long = require("long");
var HazelcastClient = require("../../lib/index.js").Client;
var Controller = require('./../RC');
var Util = require('./../Util');

function expectLongEq(expected, l) {
    return expect(l.toString()).to.equal(Long.fromValue(expected).toString());
}

describe("AtomicLong Proxy", function () {

    var cluster;
    var client;
    var l;

    before(function () {
        this.timeout(10000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function () {
        return client.getAtomicLong('along').then(function (al) {
            l = al;
        });
    });

    afterEach(function () {
        return l.destroy();
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('get return 0 initially', function () {
        return l.get().then(function (v) {
            return expectLongEq(0, v);
        });
    });

    it('addAndGet returns added value', function () {
        return l.addAndGet(33).then(function (v) {
            return expectLongEq(33, v);
        });
    });

    it('addAndGet adds', function () {
        return l.addAndGet(33).then(function () {
            return l.get();
        }).then(function (v) {
            return expectLongEq(33, v);
        });
    });

    it('getAndAdd returns old val', function () {
        return l.getAndAdd(123).then(function (v) {
            return expectLongEq(0, v);
        });
    });

    it('getAndAdd adds', function () {
        return l.getAndAdd(123).then(function () {
            return l.get();
        }).then(function (v) {
            return expectLongEq(123, v);
        });
    });

    it('decrementAndGet decrements', function () {
        return l.decrementAndGet().then(function (v) {
            return expectLongEq(-1, v);
        });
    });

    it('compareAndSet sets the value when comdition is true', function () {
        return l.set('99999999999999').then(function () {
            return l.compareAndSet('99999999999999', 13);
        }).then(function (v) {
            expect(v).to.be.true;
            return l.get();
        }).then(function (v) {
            return expectLongEq(13, v);
        });
    });

    it('compareAndSet has no efffect the value when comdition is false', function () {
        return l.set('99999999999999').then(function () {
            return l.compareAndSet(13, 13);
        }).then(function (v) {
            expect(v).to.be.false;
            return l.get();
        }).then(function (v) {
            return expectLongEq('99999999999999', v);
        });
    });

    it('set', function () {
        return l.set('99999999999999').then(function () {
            return l.get();
        }).then(function (v) {
            return expectLongEq('99999999999999', v);
        });
    });

    it('getAndSet returns old value', function () {
        return l.getAndSet(-123).then(function (v) {
            return expectLongEq(0, v);
        });
    });

    it('getAndSet sets the value', function () {
        return l.getAndSet(-123).then(function (v) {
            return l.get();
        }).then(function (v) {
            return expectLongEq(-123, v);
        });
    });

    it('incrementAndGet increments', function () {
        return l.incrementAndGet().then(function (v) {
            return expectLongEq(1, v);
        });
    });

    it('getAndIncrement returns old value', function () {
        return l.getAndIncrement().then(function (v) {
            return expectLongEq(0, v);
        });
    });

    it('getAndIncrement increments the value', function () {
        return l.getAndIncrement(1).then(function (v) {
            return l.get();
        }).then(function (v) {
            return expectLongEq(1, v);
        });
    });
});
