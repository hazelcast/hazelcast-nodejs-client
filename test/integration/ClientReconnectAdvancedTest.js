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
const RC = require('./RC');
const { Client } = require('../../');
const { deferredPromise } = require('../../lib/util/Util');
const {
    assertTrueEventually,
    promiseWaitMilliseconds
} = require('../TestUtil');

/**
 * Advanced tests for reconnection to cluster scenarios.
 */
describe('ClientReconnectAdvancedTest', function () {

    let cluster;
    let client;

    function createClusterConfig(publicAddress, heartbeatSecs) {
        heartbeatSecs = heartbeatSecs || 300;
        return `<?xml version="1.0" encoding="UTF-8"?>
                <hazelcast xmlns="http://www.hazelcast.com/schema/config"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xsi:schemaLocation="http://www.hazelcast.com/schema/config
                    http://www.hazelcast.com/schema/config/hazelcast-config-4.0.xsd">
                    <cluster-name>hot-restart-test</cluster-name>
                    <network>
                        <public-address>${publicAddress}</public-address>
                    </network>
                    <properties>
                        <property name="hazelcast.client.max.no.heartbeat.seconds">${heartbeatSecs}</property>
                    </properties>
                </hazelcast>`;
    }

    async function testConnectionCountAfterClientReconnect(memberAddress, clientAddress) {
        cluster = await RC.createCluster(null, createClusterConfig(memberAddress));
        const member = await RC.startMember(cluster.id);

        let disconnected = false;
        const disconnectedDeferred = deferredPromise();
        const reconnectedDeferred = deferredPromise();
        const lifecycleListener = (state) => {
            if (state === 'DISCONNECTED') {
                disconnectedDeferred.resolve();
                disconnected = true;
            }
            if (state === 'CONNECTED' && disconnected) {
                reconnectedDeferred.resolve();
            }
        };
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                clusterMembers: [clientAddress]
            },
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: Number.MAX_SAFE_INTEGER
                }
            },
            lifecycleListeners: [ lifecycleListener ]
        });
        const connectionManager = client.getConnectionManager();

        await assertTrueEventually(async () => {
            expect(connectionManager.connectionRegistry.activeConnections).to.have.lengthOf(1);
        });

        await RC.shutdownMember(cluster.id, member.uuid);
        await disconnectedDeferred.promise;

        await RC.startMember(cluster.id);
        await reconnectedDeferred.promise;

        expect(connectionManager.connectionRegistry.activeConnections).to.have.lengthOf(1);
    }

    async function testListenersAfterClientDisconnected(memberAddress, clientAddress) {
        const heartbeatSecs = 6;
        cluster = await RC.createCluster(null, createClusterConfig(memberAddress, heartbeatSecs));
        const member = await RC.startMember(cluster.id);

        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                clusterMembers: [clientAddress]
            },
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: Number.MAX_SAFE_INTEGER
                }
            }
        });
        const connectionManager = client.getConnectionManager();

        const map = await client.getMap('test');
        let eventCount = 0;
        const eventHandler = () => eventCount++;
        await map.addEntryListener({
            added: eventHandler,
            removed: eventHandler,
            updated: eventHandler,
            merged: eventHandler,
            evicted: eventHandler,
            expired: eventHandler,
            loaded: eventHandler,
            mapEvicted: eventHandler,
            mapCleared: eventHandler
        }, false);

        await assertTrueEventually(async () => {
            expect(connectionManager.connectionRegistry.activeConnections).to.have.lengthOf(1);
        });

        await RC.shutdownMember(cluster.id, member.uuid);
        await promiseWaitMilliseconds(2 * heartbeatSecs * 1000);

        await RC.startMember(cluster.id);

        await assertTrueEventually(async () => {
            await map.remove(1);
            await map.put(1, 2);
            expect(eventCount).to.be.greaterThan(0);
        });
    }

    afterEach(async function () {
        await client.shutdown();
        await RC.terminateCluster(cluster.id);
    });

    it('connections should be restored after client reconnect - member hostname, client IP', async function () {
        await testConnectionCountAfterClientReconnect('localhost', '127.0.0.1');
    });

    it('connections should be restored after client reconnect - member hostname, client hostname', async function () {
        await testConnectionCountAfterClientReconnect('localhost', 'localhost');
    });

    it('connections should be restored after client reconnect - member IP, client IP', async function () {
        await testConnectionCountAfterClientReconnect('127.0.0.1', '127.0.0.1');
    });

    it('connections should be restored after client reconnect - member IP, client hostname', async function () {
        await testConnectionCountAfterClientReconnect('127.0.0.1', 'localhost');
    });

    it('listeners should be restored after client reconnect - member hostname, client IP', async function () {
        await testListenersAfterClientDisconnected('localhost', '127.0.0.1');
    });

    it('listeners should be restored after client reconnect - member hostname, client hostname', async function () {
        await testListenersAfterClientDisconnected('localhost', 'localhost');
    });

    it('listeners should be restored after client reconnect - member IP, client IP', async function () {
        await testListenersAfterClientDisconnected('127.0.0.1', '127.0.0.1');
    });

    it('listeners should be restored after client reconnect - member IP, client hostname', async function () {
        await testListenersAfterClientDisconnected('127.0.0.1', 'localhost');
    });
});
