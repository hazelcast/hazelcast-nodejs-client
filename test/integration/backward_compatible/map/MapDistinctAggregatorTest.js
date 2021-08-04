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

const { should } = require('chai');
should();
const RC = require('../../RC');
const long = require('long');
const {
    Aggregators,
    Client,
    Predicates
} = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('MapDistinctAggregatorTest', function () {

    let cluster;
    let client;
    let map;

    const mixedMapValues = ['0', '1', 1.1, long.fromNumber(1), {}, { a: 1 }, true, true, false, '0'];

    const fixedMapValues = ['0', '1', '1', '2', 'asd', 'asd', '1231231asd'];

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });

        // distinct aggregator is added in 5.0 to the Node.js client
        TestUtil.markClientVersionAtLeast(this, '5.0');
        // distinct aggregator fixed for non-java clients in 4.0 https://github.com/hazelcast/hazelcast/pull/15506
        TestUtil.markServerVersionAtLeast(this, client, '4.0');

        map = await client.getMap('aggregatorsMap');
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    afterEach(async function () {
        return map.destroy();
    });

    // isFixed, usePredicate, useAttributePath, expectedResult
    const testParams = [
        [true, true, true, 5],
        [true, true, false, 5],
        [true, false, true, 5],
        [true, false, false, 5],
        [false, true, true, 2],
        [false, true, false, 2],
        [false, false, true, 8],
        [false, false, false, 8],
    ];

    for (const testParam of testParams) {
        const isFixed = testParam[0];
        const usePredicate = testParam[1];
        const useAttributePath = testParam[2];
        const expectedResult = testParam[3];

        it(`distinct test. mapType: ${isFixed ? 'fixed' : 'mixed'},`
            + ` ${usePredicate ? 'with' : 'without'} predicate,`
            + ` ${useAttributePath ? 'with' : 'without'} attributePath,`, async function () {
            const mapValues = isFixed ? fixedMapValues : mixedMapValues;
            await map.putAll(mapValues.map((value, index) => [index, value]));

            const aggregator = useAttributePath ? Aggregators.distinct('this') : Aggregators.distinct();

            let set;
            if (usePredicate) {
                set = await map.aggregateWithPredicate(aggregator, Predicates.instanceOf('java.lang.String'));
            } else {
                set = await map.aggregate(aggregator);
            }

            set.size.should.be.equal(expectedResult);
        });
    }

});
