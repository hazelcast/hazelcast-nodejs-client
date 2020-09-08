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

const expect = require('chai').expect;
const fs = require('fs');

const RC = require('../RC');
const Client = require('../../.').Client;
const { deferredPromise } = require('../../lib/util/Util');
const { getRandomInt } = require('../Util');

describe('NearCachedMapStress', function () {

    let cluster, client1;
    let validatingClient;
    let runningOperations = 0;
    let completedOperations = 0;
    let totalGetOperations = 0;
    const numberOfEntries = 1000;
    const mapName = 'stressncmap';
    const concurrencyLevel = 32;
    const totalNumOperations = 100000;
    const completedDeferred = deferredPromise();
    const putPercent = 15;
    const removePercent = 20;
    const getPercent = 100 - putPercent - removePercent;

    before(function () {
        const cfg = {
            nearCaches: {
                [mapName]: {
                    invalidateOnChange: true
                }
            }
        };

        return RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8'))
            .then(function (res) {
                cluster = res;
                return RC.startMember(cluster.id);
            })
            .then(function (member) {
                cfg.clusterName = cluster.id;
                return Client.newHazelcastClient(cfg);
            })
            .then(function (cl) {
                client1 = cl;
                return Client.newHazelcastClient({ clusterName: cluster.id });
            })
            .then(function (cl) {
                validatingClient = cl;
            });
    });

    after(function () {
        return client1.shutdown()
            .then(() => validatingClient.shutdown())
            .then(() => RC.terminateCluster(cluster.id));
    });

    function completeOperation() {
        runningOperations--;
        completedOperations++;
        if (completedOperations >= totalNumOperations && runningOperations === 0) {
            completedDeferred.resolve();
        }
    }

    it('stress test with put, get and remove', function (done) {
        this.timeout(120000);
        let map;
        client1.getMap(mapName).then(function (mp) {
            map = mp;
            (function innerOperation() {
                if (completedOperations >= totalNumOperations) {
                    return;
                }
                if (runningOperations >= concurrencyLevel) {
                    setTimeout(innerOperation, 1);
                } else {
                    runningOperations++;
                    const op = getRandomInt(0, 100);
                    if (op < putPercent) {
                        map.put(getRandomInt(0, numberOfEntries), getRandomInt(0, 10000)).then(completeOperation);
                    } else if (op < putPercent + removePercent) {
                        map.remove(getRandomInt(0, numberOfEntries)).then(completeOperation);
                    } else {
                        totalGetOperations++;
                        map.get(getRandomInt(0, numberOfEntries)).then(completeOperation);
                    }
                    process.nextTick(innerOperation);
                }
            })();
        });

        completedDeferred.promise.then(function () {
            const p = [];
            // Value correctness check
            for (let i = 0; i < numberOfEntries; i++) {
                (function () {
                    const key = i;
                    const promise = validatingClient.getMap(mapName).then(function (mp) {
                        return mp.get(key);
                    }).then(function (expected) {
                        return client1.getMap(mapName).then(function (mp) {
                            return mp.get(key);
                        }).then(function (actual) {
                            return expect(actual).to.be.equal(expected);
                        })
                    });
                    p.push(promise);
                })();
            }
            // Near cache usage check
            Promise.all(p).then(function () {
                let stats;
                client1.getMap(mapName).then(function (mp) {
                    stats = mp.nearCache.getStatistics();
                    expect(stats.hitCount + stats.missCount).to.equal(totalGetOperations + numberOfEntries);
                    expect(stats.entryCount).to.be.greaterThan(numberOfEntries / 100 * getPercent);
                    expect(stats.missCount).to.be.greaterThan(100);
                    expect(stats.hitCount).to.be.greaterThan(100);
                    done();
                });
            }).catch(function (e) {
                done(e);
            });
        });
    })
});
