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
const RC = require('../RC');
const { Client } = require('../../../');
const { markClientVersionAtLeast } = require('../../TestUtil');

/**
 * Basic tests for reconnection to cluster scenarios.
 */
describe('ClientReconnectTest', function () {

    let cluster;
    let client;

    beforeEach(function () {
       client = undefined;
       cluster = undefined;
    });

    afterEach(async function () {
        if (client) {
            await client.shutdown();
        }
        if (cluster) {
            await RC.terminateCluster(cluster.id);
        }
    });

    it('member restarts, while map.put in progress', async function () {
        cluster = await RC.createCluster(null, null);
        const member = await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.heartbeat.interval': 1000,
                'hazelcast.client.heartbeat.timeout': 3000
            }
        });
        const map = await client.getMap('test');

        await RC.terminateMember(cluster.id, member.uuid);
        await RC.startMember(cluster.id);

        await map.put('testkey', 'testvalue');
        const val = await map.get('testkey');
        expect(val).to.equal('testvalue');
    });

    it('member restarts, while map.put in progress 2', async function () {
        cluster = await RC.createCluster(null, null);
        const member = await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                connectionTimeout: 10000
            },
            properties: {
                'hazelcast.client.heartbeat.interval': 1000,
                'hazelcast.client.heartbeat.timeout': 3000
            }
        });
        const map = await client.getMap('test');
        await RC.terminateMember(cluster.id, member.uuid);

        const promise = map.put('testkey', 'testvalue').then(() => {
            return map.get('testkey');
        }).then((val) => {
            expect(val).to.equal('testvalue');
        });

        await RC.startMember(cluster.id);

        await promise;
    });

    it('create proxy while member is down, member comes back', async function () {
        // Before https://github.com/hazelcast/hazelcast-nodejs-client/pull/704, this test is flaky.
        // https://github.com/hazelcast/hazelcast-nodejs-client/issues/658#issuecomment-868970776
        markClientVersionAtLeast(this, '4.0.2');
        cluster = await RC.createCluster(null, null);
        const member = await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.heartbeat.interval': 1000,
                'hazelcast.client.heartbeat.timeout': 3000
            }
        });
        await RC.terminateMember(cluster.id, member.uuid);

        let map;

        const promise = client.getMap('test').then(mp => {
            map = mp;
            return map.put('testkey', 'testvalue');
        }).then(() => {
            return map.get('testkey');
        }).then((val) => {
            expect(val).to.equal('testvalue');
        });

        await RC.startMember(cluster.id);

        await promise;
    });
});
