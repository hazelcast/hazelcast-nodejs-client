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

const { expect } = require('chai');
const fs = require('fs');
const RC = require('../../RC');
const { Client } = require('../../../../');
const { deferredPromise } = require('../../../../lib/util/Util');
const TestUtil = require('../../../TestUtil');

describe('MigratedDataTest', function () {

    const mapName = 'ncmap';

    let cluster;
    let member1;
    let member2;
    let client;

    async function waitForPartitionTableEvent(partitionService) {
        const deferred = deferredPromise();

        function checkPartitionTable(remainingTries) {
            if (partitionService.getPartitionOwner(0) != null) {
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

    async function waitUntilPartitionMovesTo(partitionService, partitionId, uuid) {
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

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_eventual_nearcache.xml', 'utf8'));
        member1 = await RC.startMember(cluster.id);
        member2 = await RC.startMember(cluster.id);
    });

    beforeEach(async function () {
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            nearCaches: {
                [mapName]: {}
            },
            properties: {
                'hazelcast.invalidation.reconciliation.interval.seconds': 1,
                'hazelcast.invalidation.min.reconciliation.interval.seconds': 1
            }
        });
    });

    afterEach(async function () {
        await client.shutdown();
    });

    after(async function () {
        await RC.terminateCluster(cluster.id);
    });

    it('killing a server migrates data to the other node, migrated data has new uuid, '
          + 'near cache discards data with old uuid', async function () {
        let survivingMember;
        const key = 1;
        const partitionService = client.getPartitionService();
        const map = await client.getMap(mapName);

        await map.put(key, 1);
        await map.get(key);
        await map.get(key);
        await waitForPartitionTableEvent(partitionService);

        let partitionIdForKey = partitionService.getPartitionId(key);
        const keyOwner = partitionService.getPartitionOwner(partitionIdForKey).toString();
        if (keyOwner === member1.uuid) {
            survivingMember = member2;
            await RC.terminateMember(cluster.id, member1.uuid);
        } else {
            survivingMember = member1;
            await RC.terminateMember(cluster.id, member2.uuid);
        }

        partitionIdForKey = partitionService.getPartitionId(key);
        await waitUntilPartitionMovesTo(partitionService, partitionIdForKey, survivingMember.uuid);
        await TestUtil.promiseWaitMilliseconds(1500);

        await map.get(key);

        const stats = map.nearCache.getStatistics();
        expect(stats.hitCount).to.equal(1);
        expect(stats.missCount).to.equal(2);
        expect(stats.entryCount).to.equal(1);
    });
});
