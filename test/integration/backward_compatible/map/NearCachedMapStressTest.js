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

const expect = require('chai').expect;
const fs = require('fs');

const RC = require('../../RC');
const { Client } = require('../../../../');
const { deferredPromise } = require('../../../../lib/util/Util');
const TestUtil = require('../../../TestUtil');

describe('NearCachedMapStress', function () {

    const NUMBER_OF_ENTRIES = 1000;
    const MAP_NAME = 'stressncmap';
    const CONCURRENCY_LEVEL = 32;
    const TOTAL_NUM_OPS = 100000;
    const PUT_PERCENT = 15;
    const REMOVE_PERCENT = 20;
    const GET_PERCENT = 100 - PUT_PERCENT - REMOVE_PERCENT;

    const completedDeferred = deferredPromise();
    let cluster;
    let client1;
    let validatingClient;
    let runningOperations = 0;
    let completedOperations = 0;
    let totalGetOperations = 0;

    before(async function () {
        const cfg = {
            nearCaches: {
                [MAP_NAME]: {
                    invalidateOnChange: true
                }
            }
        };
        cluster = await RC.createCluster(null,
            fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8'));
        await RC.startMember(cluster.id);
        cfg.clusterName = cluster.id;
        client1 = await Client.newHazelcastClient(cfg);
        validatingClient = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    after(async function () {
        await client1.shutdown();
        await validatingClient.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    async function completeOperation() {
        runningOperations--;
        completedOperations++;
        if (completedOperations >= TOTAL_NUM_OPS && runningOperations === 0) {
            completedDeferred.resolve();
        }
    }

    it('stress test with put, get and remove', function (done) {
        let map;
        client1.getMap(MAP_NAME).then((mp) => {
            map = mp;
            (function innerOperation() {
                if (completedOperations >= TOTAL_NUM_OPS) {
                    return;
                }
                if (runningOperations >= CONCURRENCY_LEVEL) {
                    setTimeout(innerOperation, 1);
                } else {
                    runningOperations++;
                    const op = TestUtil.getRandomInt(0, 100);
                    const key = TestUtil.getRandomInt(0, NUMBER_OF_ENTRIES);
                    if (op < PUT_PERCENT) {
                        map.put(key, TestUtil.getRandomInt(0, 10000)).then(completeOperation);
                    } else if (op < PUT_PERCENT + REMOVE_PERCENT) {
                        map.remove(key).then(completeOperation);
                    } else {
                        totalGetOperations++;
                        map.get(key).then(completeOperation);
                    }
                    process.nextTick(innerOperation);
                }
            })();
        });

        completedDeferred.promise.then(() => {
            const p = [];
            // Value correctness check
            for (let i = 0; i < NUMBER_OF_ENTRIES; i++) {
                (function () {
                    const key = i;
                    const promise = validatingClient.getMap(MAP_NAME).then((mp) => {
                        return mp.get(key);
                    }).then((expected) => {
                        return client1.getMap(MAP_NAME).then((mp) => {
                            return mp.get(key);
                        }).then((actual) => {
                            return expect(actual).to.be.equal(expected);
                        });
                    });
                    p.push(promise);
                })();
            }
            // Near cache usage check
            Promise.all(p).then(() => {
                let stats;
                client1.getMap(MAP_NAME).then((mp) => {
                    stats = mp.nearCache.getStatistics();
                    expect(stats.hitCount + stats.missCount).to.equal(totalGetOperations + NUMBER_OF_ENTRIES);
                    expect(stats.entryCount).to.be.greaterThan(NUMBER_OF_ENTRIES / 100 * GET_PERCENT);
                    expect(stats.missCount).to.be.greaterThan(100);
                    expect(stats.hitCount).to.be.greaterThan(100);
                    done();
                });
            }).catch((e) => {
                done(e);
            });
        });
    });
});
