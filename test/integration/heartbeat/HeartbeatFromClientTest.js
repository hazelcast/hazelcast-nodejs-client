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

const fs = require('fs');
const { expect } = require('chai');
const RC = require('../RC');
const { Client } = require('../../../');
const TestUtil = require('../../TestUtil');

describe('HeartbeatFromClientTest', function () {

    let cluster;

    beforeEach(async function () {
        const serverConfig = fs.readFileSync(__dirname + '/short-heartbeat.xml', 'utf8');
        cluster = await RC.createCluster(null, serverConfig);
    });

    afterEach(async function () {
        return RC.terminateCluster(cluster.id);
    });

    it('client sends heartbeat periodically even when server continuously pushes messages', async function () {
        const MAP_NAME = 'testmap';
        let connectionClosedEventCount = 0;

        const clientConfig = {
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.heartbeat.interval': 1000
            }
        };
        await RC.startMember(cluster.id);
        const client1 = await Client.newHazelcastClient(clientConfig);
        client1.getConnectionManager().on('connectionClosed', () => {
            connectionClosedEventCount++;
        });
        const client2 = await Client.newHazelcastClient(clientConfig);
        const mapFromClient1 = await client1.getMap(MAP_NAME);
        await mapFromClient1.addEntryListener({
            added: function () {
                // no-op
            },
            updated: function () {
                // no-op
            }
        });
        const mapFromClient2 = await client2.getMap(MAP_NAME);
        let counter = 0;
        const pushTask = setInterval(() => {
            mapFromClient2.put('testkey', counter++);
        }, 1000);
        await TestUtil.promiseLater(15000, () => { });
        clearInterval(pushTask);
        expect(connectionClosedEventCount).to.equal(0);
        await client1.shutdown();
        await client2.shutdown();
    });
});
