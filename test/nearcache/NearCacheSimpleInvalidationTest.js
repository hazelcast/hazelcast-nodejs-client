/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var fs = require('fs');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var Config = require('../../.').Config;
var Controller = require('../RC');
var HazelcastClient = require('../../.').Client;

describe('NearCacheSimpleInvalidation', function () {
    var cluster;
    var client;
    var updaterClient;
    var mapName = 'nccmap';

    function createClientConfig() {
        var cfg = new Config.ClientConfig();
        var ncConfig = new Config.NearCacheConfig();
        ncConfig.name = mapName;
        cfg.nearCacheConfigs[mapName] = ncConfig;
        return cfg;
    }

    [false, true].forEach(function (batchInvalidationEnabled) {
        describe('batch invalidations enabled=' + batchInvalidationEnabled, function () {
            before(function () {
                if (batchInvalidationEnabled) {
                    var clusterConfig = null;
                } else {
                    var clusterConfig = fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8');
                }
                return Controller.createCluster(null, clusterConfig).then(function (res) {
                    cluster = res;
                    return Controller.startMember(cluster.id);
                }).then(function () {
                    return HazelcastClient.newHazelcastClient(createClientConfig());
                }).then(function (cl) {
                    client = cl;
                    return HazelcastClient.newHazelcastClient();
                }).then(function (cl) {
                    updaterClient = cl;
                });
            });

            after(function () {
                client.shutdown();
                updaterClient.shutdown();
                return Controller.shutdownCluster(cluster.id);
            });

            it('client observes outside invalidations', function () {
                this.timeout(4000);
                var entryCount = 1000;
                var map;
                return client.getMap(mapName).then(function (mp) {
                    map = mp;
                    var getPromise = Promise.resolve();
                    for (var i = 0; i < entryCount; i++) {
                        getPromise = getPromise.then(map.get.bind(map, '' + i));
                    }
                    return getPromise;
                }).then(function () {
                    var stats = map.nearCache.getStatistics();
                    expect(stats.missCount).to.equal(entryCount);
                    expect(stats.entryCount).to.equal(entryCount);
                    var putPromise = Promise.resolve();
                    for (var i = 0; i < entryCount; i++) {
                        putPromise = putPromise.then(map.put.bind(map, '' + i, 'changedvalue', undefined));
                    }
                    return putPromise;
                }).then(function () {
                    var getPromise = Promise.resolve();
                    for (var i = 0; i < entryCount; i++) {
                        getPromise = getPromise.then(map.get.bind(map, '' + i));
                    }
                    return getPromise;
                }).then(function () {
                    var stats = map.nearCache.getStatistics();
                    expect(stats.entryCount).to.equal(entryCount);
                    expect(stats.hitCount).to.equal(0);
                    expect(stats.missCount).to.equal(entryCount * 2);
                });
            });
        });
    });
});
