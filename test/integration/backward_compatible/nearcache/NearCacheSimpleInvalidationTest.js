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

const RC = require('../../RC');
const { Client } = require('../../../../');

describe('NearCacheSimpleInvalidationTest', function () {

    const mapName = 'nccmap';

    let cluster;
    let client;
    let updaterClient;

    [false, true].forEach((batchInvalidationEnabled) => {
        describe('batch invalidations enabled=' + batchInvalidationEnabled, function () {
            before(async function () {
                let clusterConfig = null;
                if (!batchInvalidationEnabled) {
                    clusterConfig = fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8');
                }
                cluster = await RC.createCluster(null, clusterConfig);
                await RC.startMember(cluster.id);
                client = await Client.newHazelcastClient({
                    clusterName: cluster.id,
                    nearCaches: {
                        [mapName]: {}
                    }
                });
                updaterClient = await Client.newHazelcastClient({ clusterName: cluster.id });
            });

            after(async function () {
                await client.shutdown();
                await updaterClient.shutdown();
                return RC.terminateCluster(cluster.id);
            });

            it('client observes outside invalidations', async function () {
                const entryCount = 1000;
                const map = await client.getMap(mapName);
                for (let i = 0; i < entryCount; i++) {
                    await map.get('' + i);
                }
                let stats = map.nearCache.getStatistics();
                expect(stats.missCount).to.equal(entryCount);
                expect(stats.entryCount).to.equal(entryCount);
                for (let i = 0; i < entryCount; i++) {
                    await map.put('' + i, 'changedvalue');
                }
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
