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

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const RC = require('../RC');
const {
    Client,
    ClientOfflineError,
    ClientNotActiveError
} = require('../../../');
const { deferredPromise } = require('../../../lib/util/Util');
const { ReconnectMode } = require('../../../lib/config/ConnectionStrategyConfig');
const { LifecycleState } = require('../../../lib/LifecycleService');
const TestUtil = require('../../TestUtil');

describe('ConnectionStrategyTest', function () {

    let cluster;
    let client;

    beforeEach(function () {
        client = null;
        cluster = null;
    });

    afterEach(async function () {
        if (client != null) {
            await client.shutdown();
        }
        if (cluster != null) {
            await RC.terminateCluster(cluster.id);
        }
    });

    it('client with async start should throw when there is no cluster', async function () {
        client = await Client.newHazelcastClient({
            connectionStrategy: {
                asyncStart: true
            }
        });
        await expect(client.getMap(TestUtil.randomString())).to.be.rejectedWith(ClientOfflineError);
    });

    it('client with async start should throw after shutdown when there is no cluster', async function () {
        client = await Client.newHazelcastClient({
            connectionStrategy: {
                asyncStart: true
            }
        });
        await client.shutdown();
        await expect(client.getMap(TestUtil.randomString())).to.be.rejectedWith(ClientNotActiveError);
    });

    it('client with async start should connect to cluster', async function () {
        const config = {
            network: {
                clusterMembers: ['localhost:5701']
            },
            lifecycleListeners: [],
            connectionStrategy: {
                asyncStart: true
            }
        };
        const connected = deferredPromise();
        config.lifecycleListeners.push((state) => {
            if (state === LifecycleState.CONNECTED) {
                connected.resolve();
            }
        });

        cluster = await RC.createCluster(null, null);
        config.clusterName = cluster.id;
        client = await Client.newHazelcastClient(config);

        expect(client.getLifecycleService().isRunning()).to.be.true;
        await RC.startMember(cluster.id);
        await connected.promise;
        await client.getMap(TestUtil.randomString());
    });

    it('client with OFF reconnect mode should not reconnect when member dies and another starts', async function () {
        const config = {
            lifecycleListeners: [],
            connectionStrategy: {
                reconnectMode: ReconnectMode.OFF,
                connectionRetry: {
                    clusterConnectTimeoutMillis: Number.MAX_SAFE_INTEGER
                }
            }
        };
        const shutdown = deferredPromise();
        config.lifecycleListeners.push((state) => {
            if (state === LifecycleState.SHUTDOWN) {
                shutdown.resolve();
            }
        });

        cluster = await RC.createCluster(null, null);
        config.clusterName = cluster.id;
        const member = await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient(config);
        const map = await client.getMap(TestUtil.randomString());

        // no exception at this point
        await map.put(1, 5);

        await RC.shutdownMember(cluster.id, member.uuid);
        await RC.startMember(cluster.id);
        await shutdown.promise;
        await expect(map.put(1, 5)).to.be.rejectedWith(ClientNotActiveError);
    });

    it('client with ASYNC reconnect mode reconnects when the member dies and another starts ', async function () {
        const config = {
            lifecycleListeners: [],
            connectionStrategy: {
                reconnectMode: ReconnectMode.ASYNC,
                connectionRetry: {
                    clusterConnectTimeoutMillis: Number.MAX_SAFE_INTEGER
                }
            }
        };
        const disconnected = deferredPromise();
        const reconnected = deferredPromise();
        config.lifecycleListeners.push((state) => {
            if (state === LifecycleState.DISCONNECTED) {
                disconnected.resolve();
            }
        });

        cluster = await RC.createCluster(null, null);
        config.clusterName = cluster.id;
        const member = await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient(config);
        const map = await client.getMap(TestUtil.randomString());

        // no exception at this point
        await map.put(1, 5);

        await RC.shutdownMember(cluster.id, member.uuid);
        await disconnected.promise;
        await expect(map.put(1, 5)).to.be.rejectedWith(ClientOfflineError);

        client.getLifecycleService().on('lifecycleEvent', (state) => {
            if (state === LifecycleState.CONNECTED) {
                reconnected.resolve();
            }
        });
        await RC.startMember(cluster.id);
        await reconnected.promise;

        expect(client.getLifecycleService().isRunning()).to.be.true;
        await map.put(1, 2);
    });

    it('client with async start should throw on get partition specific proxy calls when no cluster', async function () {
        client = await Client.newHazelcastClient({
            connectionStrategy: {
                asyncStart: true
            }
        });
        await expect(client.getList(TestUtil.randomString())).to.be.rejectedWith(ClientOfflineError);
    });
});
