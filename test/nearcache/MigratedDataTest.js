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
const { Client } = require('../../');
const Util = require('../Util');
const { deferredPromise } = require('../../lib/util/Util');

describe('MigratedDataTest', function () {

    let cluster;
    let member1;
    let member2;
    let client;

    const mapName = 'ncmap';

    function waitForPartitionTableEvent(partitionService) {
        const deferred = deferredPromise();
        const expectedPartitionCount = partitionService.partitionCount;

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
        const deferred = deferredPromise();
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
        return Client.newHazelcastClient({
            clusterName: cluster.id,
            nearCaches: {
                [mapName]: {}
            },
            properties: {
                'hazelcast.invalidation.reconciliation.interval.seconds': 1,
                'hazelcast.invalidation.min.reconciliation.interval.seconds': 1
            }
        }).then(function (resp) {
            client = resp;
        });
    });

    afterEach(function () {
        return client.shutdown();
    });

    after(function () {
        return RC.terminateCluster(cluster.id);
    });

    it('killing a server migrates data to the other node, migrated data has new uuid, near cache discards data with old uuid', () => {
        let map;
        let survivingMember;
        const key = 1;
        const partitionService = client.getPartitionService();

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
            const partitionIdForKey = partitionService.getPartitionId(key);
            const keyOwner = partitionService.getPartitionOwner(partitionIdForKey).toString();
            if (keyOwner === member1.uuid) {
                survivingMember = member2;
                return RC.terminateMember(cluster.id, member1.uuid);
            } else {
                survivingMember = member1;
                return RC.terminateMember(cluster.id, member2.uuid);
            }
        }).then(function () {
            const partitionIdForKey = partitionService.getPartitionId(key);
            return waitUntilPartitionMovesTo(partitionService, partitionIdForKey, survivingMember.uuid);
        }).then(function () {
            return Util.promiseWaitMilliseconds(1500);
        }).then(function () {
            return map.get(key);
        }).then(function () {
            const stats = map.nearCache.getStatistics();
            expect(stats.hitCount).to.equal(1);
            expect(stats.missCount).to.equal(2);
            expect(stats.entryCount).to.equal(1);
        })
    });
});
