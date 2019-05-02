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

var RC = require('../RC');
var HazelcastClient = require('../../').Client;
var expect = require('chai').expect;
var Config = require('../../').Config;
var fs = require('fs');
var Long = require('long');
var Util = require('../Util');
var DeferredPromise = require('../../lib/Util').DeferredPromise;
var Address = require('../../.').Address;

describe('MigratedData', function () {
    this.timeout(20000);

    var cluster;
    var member1;
    var member2;
    var client;

    var mapName = 'ncmap';

    function createConfig() {
        var cfg = new Config.ClientConfig();
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
        return RC.shutdownCluster(cluster.id);
    });

    it('killing a server migrates data to the other node, migrated data has new uuid, near cache discards data with old uuid', function () {
        Util.markServerVersionAtLeast(this, client, '3.8');
        var map;
        var survivingMember;
        var key = 1;
        return client.getMap(mapName).then(function (mp) {
            map = mp;
            return map.put(key, 1);
        }).then(function () {
            return map.get(key);
        }).then(function () {
            return map.get(key);
        }).then(function () {
            var partitionService = client.getPartitionService();
            var partitionIdForKey = partitionService.getPartitionId(key);
            var addressForKey = partitionService.getAddressForPartition(partitionIdForKey);
            if (addressForKey.equals(new Address(member1.host, member1.port))) {
                survivingMember = member2;
                return RC.terminateMember(cluster.id, member1.uuid);
            } else {
                survivingMember = member1;
                return RC.terminateMember(cluster.id, member2.uuid);
            }
        }).then(function () {
            var partitionService = client.getPartitionService();
            var partitionIdForKey = partitionService.getPartitionId(key);
            return waitUntilPartitionMovesTo(partitionService, partitionIdForKey, new Address(survivingMember.host, survivingMember.port));
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

    function waitUntilPartitionMovesTo(partitionService, partitionId, address) {
        var deferred = DeferredPromise();
        (function resolveOrTimeout(remainingTries) {
            if (partitionService.getAddressForPartition(partitionId).equals(address)) {
                deferred.resolve();
            } else if (remainingTries > 0) {
                setTimeout(resolveOrTimeout, 1000, remainingTries - 1);
            } else {
                deferred.reject(new Error('Partition ' + partitionId + ' was not moved to ' + address.toString()));
            }
        })(20);
        return deferred.promise;
    }
});
