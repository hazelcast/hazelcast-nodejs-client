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

var Controller = require('../RC');
var Client = require('../../').Client;
var Aggregators = require('../../').Aggregators;
var Predicates = require('../../').Predicates;
var _fillMap = require('../Util').fillMap;
var expect = require('chai').expect;
var Util = require('../Util');

describe('MapAggregatorsDoubleTest', function () {
    var cluster;
    var client;
    var map;

    before(function () {
        return Controller.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient();
        }).then(function (cl) {
            client = cl;
            return client.getMap('aggregatorsMap');
        }).then(function (mp) {
            map = mp;
        });
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    beforeEach(function () {
        Util.markServerVersionAtLeast(this, client, '3.8');
        return _fillMap(map, 50, 'key', 0);
    });

    afterEach(function () {
        return map.destroy();
    });

    it('count', function () {
        return map.aggregate(Aggregators.count()).then(function (count) {
            return expect(count.toNumber()).to.equal(50);
        });
    });

    it('count with attribute path', function () {
        return map.aggregate(Aggregators.count('this')).then(function (count) {
            return expect(count.toNumber()).to.equal(50);
        });
    });

    it('count with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.count(), Predicates.greaterEqual('this', 1)).then(function (count) {
            return expect(count.toNumber()).to.equal(49);
        });
    });

    it('doubleAvg', function () {
        return map.aggregate(Aggregators.doubleAvg()).then(function (avg) {
            return expect(avg).to.equal(24.5);
        });
    });

    it('doubleAvg with attribute path', function () {
        return map.aggregate(Aggregators.doubleAvg('this')).then(function (avg) {
            return expect(avg).to.equal(24.5);
        });
    });

    it('doubleAvg with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.doubleAvg(), Predicates.greaterEqual('this', 47)).then(function (avg) {
            return expect(avg).to.equal(48);
        });
    });

    it('doubleSum', function () {
        return map.aggregate(Aggregators.doubleSum()).then(function (sum) {
            return expect(sum).to.equal(1225);
        });
    });

    it('doubleSum with attribute path', function () {
        return map.aggregate(Aggregators.doubleSum('this')).then(function (sum) {
            return expect(sum).to.equal(1225);
        });
    });

    it('doubleSum with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.doubleSum(), Predicates.greaterEqual('this', 47)).then(function (avg) {
            return expect(avg).to.equal(144);
        });
    });

    it('floatingPointSum', function () {
        return map.aggregate(Aggregators.floatingPointSum()).then(function (sum) {
            return expect(sum).to.equal(1225);
        });
    });

    it('floatingPointSum with attribute path', function () {
        return map.aggregate(Aggregators.floatingPointSum('this')).then(function (sum) {
            return expect(sum).to.equal(1225);
        });
    });

    it('floatingPointSum with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.floatingPointSum(), Predicates.greaterEqual('this', 47)).then(function (sum) {
            return expect(sum).to.equal(144);
        });
    });

    it('numberAvg', function () {
        return map.aggregate(Aggregators.numberAvg()).then(function (avg) {
            return expect(avg).to.equal(24.5);
        });
    });

    it('numberAvg with attribute path', function () {
        return map.aggregate(Aggregators.numberAvg('this')).then(function (avg) {
            return expect(avg).to.equal(24.5);
        });
    });

    it('numberAvg with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.numberAvg(), Predicates.greaterEqual('this', 47)).then(function (avg) {
            return expect(avg).to.equal(48);
        });
    });

    it('max', function () {
        return map.aggregate(Aggregators.max()).then(function (avg) {
            return expect(avg).to.equal(49);
        });
    });

    it('max with attribute path', function () {
        return map.aggregate(Aggregators.max('this')).then(function (avg) {
            return expect(avg).to.equal(49);
        });
    });

    it('max with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.max(), Predicates.lessEqual('this', 3)).then(function (avg) {
            return expect(avg).to.equal(3);
        });
    });

    it('min', function () {
        return map.aggregate(Aggregators.min()).then(function (avg) {
            return expect(avg).to.equal(0);
        });
    });

    it('min with attribute path', function () {
        return map.aggregate(Aggregators.min('this')).then(function (avg) {
            return expect(avg).to.equal(0);
        });
    });

    it('min with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.min(), Predicates.greaterEqual('this', 3)).then(function (avg) {
            return expect(avg).to.equal(3);
        });
    });
});
