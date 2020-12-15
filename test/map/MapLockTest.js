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

const { expect } = require('chai');

const RC = require('./../RC');
const { Client } = require('../../');
const Util = require('./../Util');
const { fillMap } = require('../Util');

/**
 * Verifies lock operations behavior in advanced scenarios,
 * like member restart.
 */
describe('MapLockTest', function () {

    const INVOCATION_TIMEOUT_FOR_TWO = 1000;

    function generateKeyOwnedBy(client, member) {
        const partitionService = client.getPartitionService();
        while (true) {
            const key = Util.getRandomInt(0, 1000);
            const partition = partitionService.getPartitionId(key);
            const uuid = partitionService.getPartitionOwner(partition);
            if (uuid.toString() === member.uuid) {
                return key;
            }
        }
    }

    let cluster;
    let client;
    let map;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        map = await client.getMap('test');
        await fillMap(map);
    });

    afterEach(async function () {
        return map.destroy();
    });

    after(async function () {
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

        RC.startMember(cluster.id).then(function (m) {
                keyOwner = m;
                return Client.newHazelcastClient(clientTwoCfg);
            }).then(function (c) {
                clientTwo = c;
                key = generateKeyOwnedBy(client, keyOwner);
                return map.lock(key);
            }).then(function () {
                return clientTwo.getMap('test');
            }).then(function (mapOnTwo) {
                // try to lock concurrently
                mapOnTwo.lock(key)
                    .then(function () {
                        return mapOnTwo.unlock(key);
                    })
                    .then(() => clientTwo.shutdown())
                    .then(done)
                    .catch(done);
                return Util.promiseWaitMilliseconds(2 * INVOCATION_TIMEOUT_FOR_TWO);
            }).then(function () {
                return map.isLocked(key);
            }).then(function (locked) {
                expect(locked).to.be.true;
                return RC.terminateMember(cluster.id, keyOwner.uuid);
            }).then(function () {
                return map.unlock(key);
            }).catch(done);
    });
});
