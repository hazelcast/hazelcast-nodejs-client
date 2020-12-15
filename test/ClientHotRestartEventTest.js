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
const RC = require('./RC');
const { Client } = require('../.');
const {
    markEnterprise,
    randomString,
    CountingMembershipListener
} = require('./Util');

/**
 * Verifies correct update of client member list in case when
 * all members of a Hot Restart cluster were restarted.
 * This test assumes cluster with a single member.
 */
describe('ClientHotRestartEventTest', function () {

    let client;
    let cluster;

    const hotRestartDir = `/tmp/hot-restart-test-${randomString()}`;

    function createClusterConfig(port) {
        return `<?xml version="1.0" encoding="UTF-8"?>
                <hazelcast xmlns="http://www.hazelcast.com/schema/config"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xsi:schemaLocation="http://www.hazelcast.com/schema/config
                    http://www.hazelcast.com/schema/config/hazelcast-config-4.0.xsd">
                    <cluster-name>hot-restart-test</cluster-name>
                    <network>
                        <port>${port}</port>
                    </network>
                    <hot-restart-persistence enabled="true">
                        <base-dir>${hotRestartDir}</base-dir>
                    </hot-restart-persistence>
                 </hazelcast>`;
    }

    before(function () {
        markEnterprise(this);
    });

    beforeEach(async function () {
        cluster = await RC.createClusterKeepClusterName(null, createClusterConfig(5701));
    });

    afterEach(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('should receive membership events when the member is restarted with another port and same uuid', async function () {
        const member = await RC.startMember(cluster.id);

        client = await Client.newHazelcastClient({
            clusterName: cluster.id
        });
        const listener = new CountingMembershipListener(1, 1);
        client.getCluster().addMembershipListener(listener);

        await RC.shutdownCluster(cluster.id);
        // now stop cluster, restart it with the same name and then start member with port 5702
        cluster = await RC.createClusterKeepClusterName(null, createClusterConfig(5702));
        await RC.startMember(cluster.id);

        await listener.expectedPromise;

        expect(client.getCluster().getMembers().length).to.be.equal(1);
        expect(client.getCluster().getMembers()[0].uuid.toString()).to.be.equal(member.uuid);
    });
});
