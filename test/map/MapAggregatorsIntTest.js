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

const RC = require('../RC');
const Client = require('../../').Client;
const Aggregators = require('../../').Aggregators;
const Predicates = require('../../').Predicates;
const fillMap = require('../Util').fillMap;
const expect = require('chai').expect;

describe('MapAggregatorsIntTest', function () {

    let cluster, client;
    let map;

    before(function () {
        return RC.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        }).then(function () {
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                serialization: {
                    defaultNumberType: 'integer'
                }
            });
        }).then(function (cl) {
            client = cl;
            return client.getMap('aggregatorsMap');
        }).then(function (mp) {
            map = mp;
        });
    });

    after(function () {
        return client.shutdown()
            .then(() => RC.terminateCluster(cluster.id));
    });

    beforeEach(function () {
        return fillMap(map, 50, 'key', 0);
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
        return map.aggregateWithPredicate(Aggregators.integerAvg(), Predicates.greaterEqual('this', 47))
            .then(function (avg) {
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
        return map.aggregateWithPredicate(Aggregators.integerSum(), Predicates.greaterEqual('this', 47))
            .then(function (sum) {
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
        return map.aggregateWithPredicate(Aggregators.fixedPointSum(), Predicates.greaterEqual('this', 47))
            .then(function (sum) {
                return expect(sum.toNumber()).to.equal(144);
            });
    });
});
