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

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = require('chai').expect;
const Client = require('../../.').Client;
const RC = require('../RC');
const TestUtil = require('../Util');
const Errors = require('../../.').HazelcastErrors;
const Util = require('../../lib/Util');
const ReconnectMode = require('../../lib/config/ConnectionStrategyConfig').ReconnectMode;
const LifecycleState = require('../../lib/LifecycleService').LifecycleState;

describe('ConnectionStrategyTest', function () {

    this.timeout(32000);
    let cluster, client;

    beforeEach(() => {
        client = null;
        cluster = null;
    });

    afterEach(() => {
        if (client != null) {
            client.shutdown();
        }
        if (cluster != null) {
            return RC.terminateCluster(cluster.id);
        }
    });

    it('client with async start throws when there is no cluster', function () {
        return Client.newHazelcastClient({
            connectionStrategy: {
                asyncStart: true
            }
        }).then((c) => {
            client = c;
            return expect(client.getMap(TestUtil.randomString())).to.be.rejectedWith(Errors.ClientOfflineError);
        });
    });

    it('client with async start throws after shutdown when there is no cluster', function () {
        return Client.newHazelcastClient({
            connectionStrategy: {
                asyncStart: true
            }
        }).then((c) => {
            client = c;
            client.shutdown();
            return expect(client.getMap(TestUtil.randomString())).to.be.rejectedWith(Errors.ClientNotActiveError);
        })
    });

    it('client with async start connects to cluster', function () {
        const config = {
            network: {
                clusterMembers: ['localhost:5701']
            },
            lifecycleListeners: [],
            connectionStrategy: {
                asyncStart: true
            }
        };
        const connected = Util.DeferredPromise();
        config.lifecycleListeners.push((state) => {
            if (state === LifecycleState.CONNECTED) {
                connected.resolve();
            }
        });

        return RC.createCluster(null, null)
            .then((c) => {
                cluster = c;
                config.clusterName = cluster.id;
                return Client.newHazelcastClient(config);
            })
            .then((c) => {
                client = c;
                expect(client.getLifecycleService().isRunning()).to.be.true;
                return RC.startMember(cluster.id);
            })
            .then(() => {
                return connected.promise;
            })
            .then(() => {
                return client.getMap(TestUtil.randomString());
            });
    });

    it('client with OFF reconnect mode does not reconnect when the member dies and another starts', function () {
        const config = {
            lifecycleListeners: [],
            connectionStrategy: {
                reconnectMode: ReconnectMode.OFF,
                connectionRetry: {
                    clusterConnectTimeoutMillis: Number.MAX_SAFE_INTEGER
                }
            }
        };
        const shutdown = Util.DeferredPromise();
        config.lifecycleListeners.push((state) => {
            if (state === LifecycleState.SHUTDOWN) {
                shutdown.resolve();
            }
        });

        let map, member;
        return RC.createCluster(null, null)
            .then((c) => {
                cluster = c;
                config.clusterName = cluster.id;
                return RC.startMember(cluster.id);
            })
            .then((m) => {
                member = m;
                return Client.newHazelcastClient(config);
            })
            .then((c) => {
                client = c;
                return client.getMap(TestUtil.randomString());
            })
            .then((m) => {
                map = m;
                // No exception at this point
                return map.put(1, 5);
            })
            .then(() => {
                return RC.shutdownMember(cluster.id, member.uuid);
            })
            .then(() => {
                return RC.startMember(cluster.id);
            })
            .then(() => {
                return shutdown.promise;
            })
            .then(() => {
                return expect(map.put(1, 5)).to.be.rejectedWith(Errors.ClientNotActiveError);
            });
    });

    it('client with ASYNC reconnect mode reconnects when the member dies and another starts ', function () {
        const config = {
            lifecycleListeners: [],
            connectionStrategy: {
                reconnectMode: ReconnectMode.ASYNC,
                connectionRetry: {
                    clusterConnectTimeoutMillis: Number.MAX_SAFE_INTEGER
                }
            }
        };
        const disconnected = Util.DeferredPromise();
        const reconnected = Util.DeferredPromise();
        config.lifecycleListeners.push((state) => {
            if (state === LifecycleState.DISCONNECTED) {
                disconnected.resolve();
            }
        });

        let member, map;
        return RC.createCluster(null, null)
            .then((c) => {
                cluster = c;
                config.clusterName = cluster.id;
                return RC.startMember(cluster.id);
            })
            .then((m) => {
                member = m;
                return Client.newHazelcastClient(config);
            })
            .then((c) => {
                client = c;
                return client.getMap(TestUtil.randomString());
            })
            .then((m) => {
                map = m;
                // No exception at this point
                return map.put(1, 5);
            })
            .then(() => {
                return RC.shutdownMember(cluster.id, member.uuid);
            })
            .then(() => {
                return disconnected.promise;
            })
            .then(() => {
                return expect(map.put(1, 5)).to.be.rejectedWith(Errors.ClientOfflineError);
            })
            .then(() => {
                client.getLifecycleService().on('lifecycleEvent', (state) => {
                    if (state === LifecycleState.CONNECTED) {
                        reconnected.resolve();
                    }
                });
                return RC.startMember(cluster.id);
            })
            .then((m) => {
                return reconnected.promise;
            })
            .then(() => {
                expect(client.getLifecycleService().isRunning()).to.be.true;
                return map.put(1, 2);
            })
    });

    it('client with async start should should reject get partition specific proxy calls when there is no cluster', function () {
        return Client.newHazelcastClient({
            connectionStrategy: {
                asyncStart: true
            }
        }).then((c) => {
            client = c;
            return expect(client.getList(TestUtil.randomString())).to.be.rejectedWith(Errors.ClientOfflineError);
        });
    });

});
