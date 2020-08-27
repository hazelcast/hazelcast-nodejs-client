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

const fs = require('fs');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const RC = require('../RC');
const Client = require('../../.').Client;

describe('NearCacheSimpleInvalidationTest', function () {

    let cluster, client;
    let updaterClient;
    const mapName = 'nccmap';

    [false, true].forEach(function (batchInvalidationEnabled) {
        describe('batch invalidations enabled=' + batchInvalidationEnabled, function () {
            before(function () {
                let clusterConfig = null;
                if (!batchInvalidationEnabled) {
                    clusterConfig = fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8');
                }
                return RC.createCluster(null, clusterConfig).then(function (res) {
                    cluster = res;
                    return RC.startMember(cluster.id);
                }).then(function () {
                    return Client.newHazelcastClient({
                        clusterName: cluster.id,
                        nearCaches: {
                            [mapName]: {}
                        }
                    });
                }).then(function (cl) {
                    client = cl;
                    return Client.newHazelcastClient({ clusterName: cluster.id });
                }).then(function (cl) {
                    updaterClient = cl;
                });
            });

            after(function () {
                return client.shutdown()
                    .then(() => updaterClient.shutdown())
                    .then(() => RC.terminateCluster(cluster.id));
            });

            it('client observes outside invalidations', function () {
                this.timeout(10000);
                const entryCount = 1000;
                let map;
                return client.getMap(mapName).then(function (mp) {
                    map = mp;
                    let getPromise = Promise.resolve();
                    for (let i = 0; i < entryCount; i++) {
                        getPromise = getPromise.then(map.get.bind(map, '' + i));
                    }
                    return getPromise;
                }).then(function () {
                    const stats = map.nearCache.getStatistics();
                    expect(stats.missCount).to.equal(entryCount);
                    expect(stats.entryCount).to.equal(entryCount);
                    let putPromise = Promise.resolve();
                    for (let i = 0; i < entryCount; i++) {
                        putPromise = putPromise.then(map.put.bind(map, '' + i, 'changedvalue', undefined));
                    }
                    return putPromise;
                }).then(function () {
                    let getPromise = Promise.resolve();
                    for (let i = 0; i < entryCount; i++) {
                        getPromise = getPromise.then(map.get.bind(map, '' + i));
                    }
                    return getPromise;
                }).then(function () {
                    const stats = map.nearCache.getStatistics();
                    expect(stats.entryCount).to.equal(entryCount);
                    expect(stats.hitCount).to.equal(0);
                    expect(stats.missCount).to.equal(entryCount * 2);
                });
            });
        });
    });
});
