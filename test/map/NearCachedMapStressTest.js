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

var expect = require('chai').expect;
var fs = require('fs');

var DeferredPromise = require('../../lib/Util').DeferredPromise;
var getRandomInt = require('../Util').getRandomInt;
var Controller = require('../RC');

var Config = require('../../.').Config;
var HazelcastClient = require('../../.').Client;

describe('NearCachedMapStress', function () {

    var cluster;
    var client1;
    var validatingClient;
    var numberOfEntries = 1000;
    var mapName = 'stressncmap';
    var runningOperations = 0;
    var completedOperations = 0;
    var concurrencyLevel = 32;
    var totalNumOperations = 100000;
    var completedDeferred = DeferredPromise();
    var putPercent = 15;
    var removePercent = 20;
    var getPercent = 100 - putPercent - removePercent;
    var totalGetOperations = 0;

    before(function () {
        var cfg = new Config.ClientConfig();
        var ncc = new Config.NearCacheConfig();
        ncc.name = mapName;
        ncc.invalidateOnChange = true;
        cfg.nearCacheConfigs[mapName] = ncc;
        return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8')).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function (member) {
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function (cl) {
            client1 = cl;
            return HazelcastClient.newHazelcastClient();
        }).then(function (cl) {
            validatingClient = cl;
        });
    });

    after(function () {
        client1.shutdown();
        validatingClient.shutdown();
        return Controller.shutdownCluster(cluster.id);
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
        var map;
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
                    var op = getRandomInt(0, 100);
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
            var p = [];
            //Value correctness check
            for (var i = 0; i < numberOfEntries; i++) {
                (function () {
                    var key = i;
                    var promise = validatingClient.getMap(mapName).then(function (mp) {
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
            //Near cache usage check
            Promise.all(p).then(function () {
                var stats;
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
