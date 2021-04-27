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

/**
 * Basic tests for reconnection to cluster scenarios.
 */
describe('ClientReconnectTest', function () {

    let cluster;
    let client;

    afterEach(async function () {
        await client.shutdown();
        await RC.terminateCluster(cluster.id);
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

    it('member restarts, while map.put in progress 2', function (done) {
        let member, map;
        RC.createCluster(null, null).then((cl) => {
            cluster = cl;
            return RC.startMember(cluster.id);
        }).then((m) => {
            member = m;
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    connectionTimeout: 10000
                },
                properties: {
                    'hazelcast.client.heartbeat.interval': 1000,
                    'hazelcast.client.heartbeat.timeout': 3000
                }
            });
        }).then((cl) => {
            client = cl;
            return client.getMap('test');
        }).then((mp) => {
            map = mp;
            return RC.terminateMember(cluster.id, member.uuid);
        }).then(() => {
            map.put('testkey', 'testvalue').then(() => {
                return map.get('testkey');
            }).then((val) => {
                try {
                    expect(val).to.equal('testvalue');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        }).then(() => {
            return RC.startMember(cluster.id);
        });
    });

    it('create proxy while member is down, member comes back', function (done) {
        let member, map;
        RC.createCluster(null, null).then((cl) => {
            cluster = cl;
            return RC.startMember(cluster.id);
        }).then((m) => {
            member = m;
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                properties: {
                    'hazelcast.client.heartbeat.interval': 1000,
                    'hazelcast.client.heartbeat.timeout': 3000
                }
            });
        }).then((cl) => {
            client = cl;
            return RC.terminateMember(cluster.id, member.uuid);
        }).then(() => {
            client.getMap('test').then((mp) => {
                map = mp;
            }).then(() => {
                return map.put('testkey', 'testvalue');
            }).then(() => {
                return map.get('testkey');
            }).then((val) => {
                expect(val).to.equal('testvalue');
                done();
            });
            RC.startMember(cluster.id);
        });
    });
});
