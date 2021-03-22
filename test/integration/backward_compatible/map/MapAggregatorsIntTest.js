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
const RC = require('../../RC');
const {
    Aggregators,
    Client,
    Predicates
} = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('MapAggregatorsIntTest', function () {

    let cluster;
    let client;
    let map;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            serialization: {
                defaultNumberType: 'integer'
            }
        });
        map = await client.getMap('aggregatorsMap');
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    beforeEach(async function () {
        return TestUtil.fillMap(map, 50, 'key', 0);
    });

    afterEach(async function () {
        return map.destroy();
    });

    it('intAvg', async function () {
        const avg = await map.aggregate(Aggregators.integerAvg());
        expect(avg).to.equal(24.5);
    });

    it('intAvg with attribute path', async function () {
        const avg = await map.aggregate(Aggregators.integerAvg('this'));
        expect(avg).to.equal(24.5);
    });

    it('intAvg with predicate', async function () {
        const avg = await map.aggregateWithPredicate(Aggregators.integerAvg(), Predicates.greaterEqual('this', 47));
        expect(avg).to.equal(48);
    });

    it('intSum', async function () {
        const sum = await map.aggregate(Aggregators.integerSum());
        expect(sum.toNumber()).to.equal(1225);
    });

    it('intSum with attribute path', async function () {
        const sum = await map.aggregate(Aggregators.integerSum('this'));
        expect(sum.toNumber()).to.equal(1225);
    });

    it('intSum with predicate', async function () {
        const sum = await map.aggregateWithPredicate(Aggregators.integerSum(), Predicates.greaterEqual('this', 47));
        expect(sum.toNumber()).to.equal(144);
    });

    it('fixedPointSum', async function () {
        const sum = await map.aggregate(Aggregators.fixedPointSum());
        expect(sum.toNumber()).to.equal(1225);
    });

    it('fixedPointSum with attribute path', async function () {
        const sum = await map.aggregate(Aggregators.fixedPointSum('this'));
        expect(sum.toNumber()).to.equal(1225);
    });

    it('fixedPointSum with predicate', async function () {
        const sum = await map.aggregateWithPredicate(Aggregators.fixedPointSum(), Predicates.greaterEqual('this', 47));
        expect(sum.toNumber()).to.equal(144);
    });
});
