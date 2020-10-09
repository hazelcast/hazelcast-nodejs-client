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
const Long = require('long');
const expect = require('chai').expect;

describe('MapAggregatorsLongTest', function () {

    let cluster, client;
    let map;
    const entryCount = 50;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            serialization: {
                defaultNumberType: 'long'
            }
        });
        map = await client.getMap('aggregatorsMap');
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    beforeEach(async function () {
        const entries = [];
        for (let i = 0; i < entryCount; i++) {
            entries.push(['key' + i, Long.fromNumber(i)]);
        }
        return map.putAll(entries);
    });

    afterEach(async function () {
        return map.destroy();
    });

    it('longAvg', async function () {
        const avg = await map.aggregate(Aggregators.longAvg());
        expect(avg).to.equal(24.5);
    });

    it('longAvg with attribute path', async function () {
        const avg = await map.aggregate(Aggregators.longAvg('this'));
        expect(avg).to.equal(24.5);
    });

    it('longAvg with predicate', async function () {
        const avg = await map.aggregateWithPredicate(Aggregators.longAvg(), Predicates.greaterEqual('this', Long.fromNumber(47)));
        expect(avg).to.equal(48);
    });

    it('longSum', async function () {
        const sum = await map.aggregate(Aggregators.longSum());
        expect(sum.toNumber()).to.equal(1225);
    });

    it('longSum with attribute path', async function () {
        const sum = await map.aggregate(Aggregators.longSum('this'));
        expect(sum.toNumber()).to.equal(1225);
    });

    it('longSum with predicate', async function () {
        const sum = await map.aggregateWithPredicate(Aggregators.longSum(), Predicates.greaterEqual('this', Long.fromNumber(47)));
        expect(sum.toNumber()).to.equal(144);
    });
});
