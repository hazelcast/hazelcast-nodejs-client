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
var Config = require('../../.').Config;
var Aggregators = require('../../').Aggregators;
var Predicates = require('../../').Predicates;
var _fillMap = require('../Util').fillMap;
var expect = require('chai').expect;
var Util = require('../Util');

describe('MapAggregatorsIntTest', function () {
    var cluster;
    var client;
    var map;

    before(function () {
        var cfg = new Config.ClientConfig();
        cfg.serializationConfig.defaultNumberType = 'integer';
        return Controller.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient(cfg);
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

    it('intAvg', function () {
        return map.aggregate(Aggregators.integerAvg()).then(function (avg) {
            return expect(avg).to.equal(24.5);
        });
    });

    it('intAvg with attribute path', function () {
        return map.aggregate(Aggregators.integerAvg('this')).then(function (avg) {
            return expect(avg).to.equal(24.5);
        });
    });

    it('intAvg with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.integerAvg(), Predicates.greaterEqual('this', 47)).then(function (avg) {
            return expect(avg).to.equal(48);
        });
    });

    it('intSum', function () {
        return map.aggregate(Aggregators.integerSum()).then(function (sum) {
            return expect(sum.toNumber()).to.equal(1225);
        });
    });

    it('intSum with attribute path', function () {
        return map.aggregate(Aggregators.integerSum('this')).then(function (sum) {
            return expect(sum.toNumber()).to.equal(1225);
        });
    });

    it('intSum with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.integerSum(), Predicates.greaterEqual('this', 47)).then(function (sum) {
            return expect(sum.toNumber()).to.equal(144);
        });
    });


    it('fixedPointSum', function () {
        return map.aggregate(Aggregators.fixedPointSum()).then(function (sum) {
            return expect(sum.toNumber()).to.equal(1225);
        });
    });

    it('fixedPointSum with attribute path', function () {
        return map.aggregate(Aggregators.fixedPointSum('this')).then(function (sum) {
            return expect(sum.toNumber()).to.equal(1225);
        });
    });

    it('fixedPointSum with predicate', function () {
        return map.aggregateWithPredicate(Aggregators.fixedPointSum(), Predicates.greaterEqual('this', 47)).then(function (sum) {
            return expect(sum.toNumber()).to.equal(144);
        });
    });
});
