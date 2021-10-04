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

const fs = require('fs');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const RC = require('../../../RC');
const TestUtil = require('../../../../TestUtil');
const { assertTrueEventually } = require('../../../../TestUtil');

describe('NearCacheSimpleInvalidationTest', function () {
    const mapName = 'nccmap';
    const testFactory = new TestUtil.TestFactory();

    let cluster;
    let client;
    let updaterClient;

    [false, true].forEach((batchInvalidationEnabled) => {
        describe('batch invalidations enabled=' + batchInvalidationEnabled, function () {
            before(async function () {
                let clusterConfig = undefined;
                if (!batchInvalidationEnabled) {
                    clusterConfig = fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8');
                }
                cluster = await testFactory.createClusterForParallelTests(null, clusterConfig);
                const member = await RC.startMember(cluster.id);
                client = await testFactory.newHazelcastClientForParallelTests({
                    clusterName: cluster.id,
                    nearCaches: {
                        [mapName]: {}
                    }
                }, member);
                updaterClient = await testFactory.newHazelcastClientForParallelTests({
                    clusterName: cluster.id
                }, member);
            });

            after(async function () {
                await testFactory.shutdownAll();
            });

            it('client observes outside invalidations', async function () {
                const entryCount = 1000;
                const map = await client.getMap(mapName);
                const updaterClientMap = await updaterClient.getMap(mapName);

                for (let i = 0; i < entryCount; i++) {
                    await map.get('' + i);
                }

                let stats = map.nearCache.getStatistics();
                expect(stats.missCount).to.equal(entryCount);
                expect(stats.entryCount).to.equal(entryCount);

                for (let i = 0; i < entryCount; i++) {
                    await updaterClientMap.put('' + i, 'changedvalue');
                }
                // wait for the entries to be invalidated
                await assertTrueEventually(async () => {
                    expect(map.nearCache.getStatistics().entryCount).to.equal(0);
                }, 1000, 100000); // high timeout due to parallel test run

                for (let i = 0; i < entryCount; i++) {
                    await map.get('' + i);
                }

                stats = map.nearCache.getStatistics();
                expect(stats.entryCount).to.equal(entryCount);
                expect(stats.hitCount).to.equal(0);
                expect(stats.missCount).to.equal(entryCount * 2);
            });
        });
    });
});
