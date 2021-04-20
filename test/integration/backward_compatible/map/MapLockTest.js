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

const RC = require('../../RC');
const { Client } = require('../../../../');
const TestUtil = require('../../../TestUtil');

/**
 * Verifies lock operations behavior in advanced scenarios,
 * like member restart.
 */
describe('MapLockTest', function () {

    const INVOCATION_TIMEOUT_FOR_TWO = 1000;

    function generateKeyOwnedBy(client, member) {
        const partitionService = client.getPartitionService();
        const MAX_ATTEMPTS = 10000;
        let attempt = 0;
        while (attempt ++ < MAX_ATTEMPTS) {
            const key = TestUtil.getRandomInt(0, 1000);
            const partition = partitionService.getPartitionId(key);
            const uuid = partitionService.getPartitionOwner(partition);
            if (uuid.toString() === member.uuid) {
                return key;
            }
        }
        throw new Error('Could not generate key in ' + MAX_ATTEMPTS + ' attempts');
    }

    let cluster;
    let client;
    let map;
    let skipped;

    before(async function () {
        skipped = true;
        TestUtil.markClientVersionAtLeast(this, '4.1');
        skipped = false;
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        map = await client.getMap('test');
        await TestUtil.fillMap(map);
    });

    afterEach(async function () {
        return map.destroy();
    });

    after(async function () {
        if (skipped) {
            return;
        }
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('should acquire the lock when key owner terminates', function (done) {
        let clientTwo;
        let keyOwner;
        let key;

        const clientTwoCfg = {
            clusterName: cluster.id,
            properties: {
                ['hazelcast.client.invocation.timeout.millis']: INVOCATION_TIMEOUT_FOR_TWO
            }
        };
        RC.startMember(cluster.id).then((m) => {
            keyOwner = m;
            return Client.newHazelcastClient(clientTwoCfg);
        }).then((c) => {
            clientTwo = c;
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
