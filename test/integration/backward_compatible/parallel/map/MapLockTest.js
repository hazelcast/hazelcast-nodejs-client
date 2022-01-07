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

const RC = require('../../../RC');
const TestUtil = require('../../../../TestUtil');

/**
 * Verifies lock operations behavior in advanced scenarios,
 * like member restart.
 */
describe('MapLockTest', function () {
    const INVOCATION_TIMEOUT_FOR_TWO = 1000;
    const testFactory = new TestUtil.TestFactory();
    const DEFAULT_PARTITION_COUNT = 271;

    function generateKeyOwnedBy(client, member) {
        const partitionService = client.getPartitionService();
        const MAX_ATTEMPTS = 10000;
        let attempt = 0;
        while (attempt++ < MAX_ATTEMPTS) {
            const key = TestUtil.getRandomInt(0, 1000);
            const partition = partitionService.getPartitionId(key);
            const uuid = partitionService.getPartitionOwner(partition);
            if (uuid.toString() === member.uuid) {
                return key;
            }
        }
        throw new Error('Could not generate key in ' + MAX_ATTEMPTS + ' attempts');
    }

    async function waitForNewPartitionTable(client, member) {
        const partitionService = client.getPartitionService();
        const MAX_ATTEMPTS = 20;
        let attempt = 0;
        while (attempt++ < MAX_ATTEMPTS) {
            for (let i = 0; i < DEFAULT_PARTITION_COUNT; i++) {
                const uuid = partitionService.getPartitionOwner(i);
                if (uuid.toString() === member.uuid) {
                    return;
                }
            }
            await TestUtil.promiseWaitMilliseconds(1000);
        }
        throw new Error('Could not get new partition table in ' + MAX_ATTEMPTS + ' seconds');
    }

    let cluster;
    let client;
    let map;
    let member;

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '4.1');
        cluster = await testFactory.createClusterForParallelTests();
        member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id
        }, member);
    });

    beforeEach(async function () {
        map = await client.getMap('test');
        await TestUtil.fillMap(map);
    });

    afterEach(async function () {
        return map.destroy();
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('should acquire the lock when key owner terminates', function (done) {
        let clientTwo;
        let keyOwner;
        let key;

        RC.startMember(cluster.id).then((m) => {
            keyOwner = m;
            return testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                properties: {
                    ['hazelcast.client.invocation.timeout.millis']: INVOCATION_TIMEOUT_FOR_TWO
                }
            }, [member, m]);
        }).then((c) => {
            clientTwo = c;
            return waitForNewPartitionTable(client, keyOwner);
        }).then(() => {
            key = generateKeyOwnedBy(client, keyOwner);
            return map.lock(key);
        }).then(() => {
            return clientTwo.getMap('test');
        }).then((mapOnTwo) => {
            // try to lock concurrently
            mapOnTwo.lock(key)
                .then(() => {
                    return mapOnTwo.unlock(key);
                })
                .then(() => clientTwo.shutdown())
                .then(done)
                .catch(done);
            return TestUtil.promiseWaitMilliseconds(2 * INVOCATION_TIMEOUT_FOR_TWO);
        }).then(() => {
            return map.isLocked(key);
        }).then((locked) => {
            expect(locked).to.be.true;
            return RC.terminateMember(cluster.id, keyOwner.uuid);
        }).then(() => {
            return map.unlock(key);
        }).catch(done);
    });
});
