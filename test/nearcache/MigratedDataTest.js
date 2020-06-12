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

var RC = require('../RC');
var HazelcastClient = require('../../').Client;
var expect = require('chai').expect;
var Config = require('../../').Config;
var fs = require('fs');
var Util = require('../Util');
var DeferredPromise = require('../../lib/Util').DeferredPromise;

describe('MigratedData', function () {
    this.timeout(20000);

    var cluster;
    var member1;
    var member2;
    var client;

    var mapName = 'ncmap';

    function createConfig() {
        var cfg = new Config.ClientConfig();
        cfg.clusterName = cluster.id;
        var ncConfig = new Config.NearCacheConfig();
        ncConfig.name = mapName;
        cfg.nearCacheConfigs[mapName] = ncConfig;
        cfg.properties['hazelcast.invalidation.reconciliation.interval.seconds'] = 1;
        cfg.properties['hazelcast.invalidation.min.reconciliation.interval.seconds'] = 1;
        return cfg;
    }

    before(function () {
        return RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_eventual_nearcache.xml', 'utf8')).then(function (resp) {
            cluster = resp;
            return RC.startMember(cluster.id);
        }).then(function (m) {
            member1 = m;
            return RC.startMember(cluster.id);
        }).then(function (m) {
            member2 = m;
        });
    });

    beforeEach(function () {
        return HazelcastClient.newHazelcastClient(createConfig()).then(function (resp) {
            client = resp;
        });
    });

    afterEach(function () {
        client.shutdown();
    });

    after(function () {
        return RC.terminateCluster(cluster.id);
    });

    it('killing a server migrates data to the other node, migrated data has new uuid, near cache discards data with old uuid', function () {
        var map;
        var survivingMember;
        var key = 1;
        var partitionService = client.getPartitionService();
        return client.getMap(mapName).then(function (mp) {
            map = mp;
            return map.put(key, 1);
        }).then(function () {
            return map.get(key);
        }).then(function () {
            return map.get(key);
        }).then(function () {
            return waitForPartitionTableEvent(partitionService);
        }).then(function () {
            var partitionIdForKey = partitionService.getPartitionId(key);
            var keyOwner = partitionService.getPartitionOwner(partitionIdForKey).toString();
            if (keyOwner === member1.uuid) {
                survivingMember = member2;
                return RC.terminateMember(cluster.id, member1.uuid);
            } else {
                survivingMember = member1;
                return RC.terminateMember(cluster.id, member2.uuid);
            }
        }).then(function () {
            var partitionIdForKey = partitionService.getPartitionId(key);
            return waitUntilPartitionMovesTo(partitionService, partitionIdForKey, survivingMember.uuid);
        }).then(function () {
            return Util.promiseWaitMilliseconds(1500);
        }).then(function () {
            return map.get(key);
        }).then(function () {
            var stats = map.nearCache.getStatistics();
            expect(stats.hitCount).to.equal(1);
            expect(stats.missCount).to.equal(2);
            expect(stats.entryCount).to.equal(1);
        })
    });

    function waitForPartitionTableEvent(partitionService) {
        var deferred = DeferredPromise();
        var expectedPartitionCount = partitionService.partitionCount;

        function checkPartitionTable(remainingTries) {
            if (partitionService.partitionTable.partitions.size === expectedPartitionCount) {
                deferred.resolve();
            } else if (remainingTries > 0) {
                setTimeout(checkPartitionTable, 1000, remainingTries - 1);
            } else {
                deferred.reject(new Error('Partition table is not received!'));
            }
        }
        checkPartitionTable(10);
        return deferred.promise;

    }

    function waitUntilPartitionMovesTo(partitionService, partitionId, uuid) {
        var deferred = DeferredPromise();
        (function resolveOrTimeout(remainingTries) {
            if (partitionService.getPartitionOwner(partitionId).toString() === uuid) {
                deferred.resolve();
            } else if (remainingTries > 0) {
                setTimeout(resolveOrTimeout, 1000, remainingTries - 1);
            } else {
                deferred.reject(new Error('Partition ' + partitionId + ' was not moved to ' + uuid));
            }
        })(20);
        return deferred.promise;
    }
});
