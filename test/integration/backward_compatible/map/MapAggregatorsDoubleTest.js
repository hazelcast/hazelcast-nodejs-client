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

describe('MapAggregatorsDoubleTest', function () {

    let cluster;
    let client;
    let map;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
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

    it('count', async function () {
        const count = await map.aggregate(Aggregators.count());
        expect(count.toNumber()).to.equal(50);
    });

    it('count with attribute path', async function () {
        const count = await map.aggregate(Aggregators.count('this'));
        expect(count.toNumber()).to.equal(50);
    });

    it('count with predicate', async function () {
        const count = await map.aggregateWithPredicate(Aggregators.count(), Predicates.greaterEqual('this', 1));
        expect(count.toNumber()).to.equal(49);
    });

    it('doubleAvg', async function () {
        const avg = await map.aggregate(Aggregators.doubleAvg());
        expect(avg).to.equal(24.5);
    });

    it('doubleAvg with attribute path', async function () {
        const avg = await map.aggregate(Aggregators.doubleAvg('this'));
        expect(avg).to.equal(24.5);
    });

    it('doubleAvg with predicate', async function () {
        const avg = await map.aggregateWithPredicate(Aggregators.doubleAvg(), Predicates.greaterEqual('this', 47));
        expect(avg).to.equal(48);
    });

    it('doubleSum', async function () {
        const sum = await map.aggregate(Aggregators.doubleSum());
        expect(sum).to.equal(1225);
    });

    it('doubleSum with attribute path', async function () {
        const sum = await map.aggregate(Aggregators.doubleSum('this'));
        expect(sum).to.equal(1225);
    });

    it('doubleSum with predicate', async function () {
        const avg = await map.aggregateWithPredicate(Aggregators.doubleSum(), Predicates.greaterEqual('this', 47));
        expect(avg).to.equal(144);
    });

    it('floatingPointSum', async function () {
        const sum = await map.aggregate(Aggregators.floatingPointSum());
        expect(sum).to.equal(1225);
    });

    it('floatingPointSum with attribute path', async function () {
        const sum = await map.aggregate(Aggregators.floatingPointSum('this'));
        expect(sum).to.equal(1225);
    });

    it('floatingPointSum with predicate', async function () {
        const sum = await map.aggregateWithPredicate(Aggregators.floatingPointSum(), Predicates.greaterEqual('this', 47));
        expect(sum).to.equal(144);
    });

    it('numberAvg', async function () {
        const avg = await map.aggregate(Aggregators.numberAvg());
        expect(avg).to.equal(24.5);
    });

    it('numberAvg with attribute path', async function () {
        const avg = await map.aggregate(Aggregators.numberAvg('this'));
        expect(avg).to.equal(24.5);
    });

    it('numberAvg with predicate', async function () {
        const avg = await map.aggregateWithPredicate(Aggregators.numberAvg(), Predicates.greaterEqual('this', 47));
        expect(avg).to.equal(48);
    });

    it('max', async function () {
        const avg = await map.aggregate(Aggregators.max());
        expect(avg).to.equal(49);
    });

    it('max with attribute path', async function () {
        const avg = await map.aggregate(Aggregators.max('this'));
        expect(avg).to.equal(49);
    });

    it('max with predicate', async function () {
        const avg = await map.aggregateWithPredicate(Aggregators.max(), Predicates.lessEqual('this', 3));
        expect(avg).to.equal(3);
    });

    it('min', async function () {
        const avg = await map.aggregate(Aggregators.min());
        expect(avg).to.equal(0);
    });

    it('min with attribute path', async function () {
        const avg = await map.aggregate(Aggregators.min('this'));
        expect(avg).to.equal(0);
    });

    it('min with predicate', async function () {
        const avg = await map.aggregateWithPredicate(Aggregators.min(), Predicates.greaterEqual('this', 3));
        expect(avg).to.equal(3);
    });
});
