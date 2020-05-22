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
const Config = require('../../.').Config;
const Controller = require('../RC');
const TestUtil = require('../Util');
const Errors = require('../../.').HazelcastErrors;
const Util = require('../../lib/Util');
const ReconnectMode = require('../../lib/config/ConnectionStrategyConfig').ReconnectMode;
const LifecycleState = require('../../lib/LifecycleService').LifecycleState;

describe('ConnectionStrategyTest', function () {

    this.timeout(32000);

    let cluster;
    let client;


    beforeEach(function () {
        client = null;
        cluster = null;
    });

    afterEach(function () {
        if (client != null) {
            client.shutdown();
        }

        if (cluster != null) {
            return Controller.terminateCluster(cluster.id);
        }
    });

    it('client with async start throws when there is no cluster', function () {
        const config = new Config.ClientConfig();
        config.connectionStrategyConfig.asyncStart = true;

        return Client.newHazelcastClient(config)
            .then((c) => {
                client = c;
                return expect(client.getMap(TestUtil.randomString())).to.be.rejectedWith(Errors.ClientOfflineError);
            });
    });

    it('client with async start throws after shutdown when there is no cluster', function () {
        const config = new Config.ClientConfig();
        config.connectionStrategyConfig.asyncStart = true;

        return Client.newHazelcastClient(config)
            .then((c) => {
                client = c;
                client.shutdown();
                return expect(client.getMap(TestUtil.randomString())).to.be.rejectedWith(Errors.ClientNotActiveError);
            })
    });

    it('client with async start connects to cluster', function () {
        const config = new Config.ClientConfig();

        config.networkConfig.addresses.push('localhost:5701');

        const connected = Util.DeferredPromise();
        config.listeners.addLifecycleListener((state) => {
            if (state === LifecycleState.CONNECTED) {
                connected.resolve();
            }
        });

        config.connectionStrategyConfig.asyncStart = true;

        return Controller.createCluster(null, null)
            .then((c) => {
               cluster = c;
               config.clusterName = cluster.id;

               return Client.newHazelcastClient(config);
            })
            .then((c) => {
               client = c;

                expect(client.getLifecycleService().isRunning()).to.be.true;
                return Controller.startMember(cluster.id);
            })
            .then(() => {
                return connected.promise;
            })
            .then(() => {
                return client.getMap(TestUtil.randomString());
            });
    });

    it('client with OFF reconnect mode does not reconnect when the member dies and another starts', function () {
        const config = new Config.ClientConfig();

        config.connectionStrategyConfig.reconnectMode = ReconnectMode.OFF;
        config.connectionStrategyConfig.connectionRetryConfig.clusterConnectTimeoutMillis = Number.MAX_SAFE_INTEGER;

        const shutdown = Util.DeferredPromise();
        config.listeners.addLifecycleListener((state) => {
            if (state === LifecycleState.SHUTDOWN) {
                shutdown.resolve();
            }
        });

        let map;
        let member;

        return Controller.createCluster(null, null)
            .then((c) => {
                cluster = c;
                config.clusterName = cluster.id;
                return Controller.startMember(cluster.id);
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
                return Controller.shutdownMember(cluster.id, member.uuid);
            })
            .then(() => {
                return Controller.startMember(cluster.id);
            })
            .then(() => {
                return shutdown.promise;
            })
            .then(() => {
                return expect(map.put(1, 5)).to.be.rejectedWith(Errors.ClientNotActiveError);
            })
    });

    it('client with ASYNC reconnect mode reconnects when the member dies and another starts ', function () {
        const config = new Config.ClientConfig();

        config.connectionStrategyConfig.reconnectMode = ReconnectMode.ASYNC;
        config.connectionStrategyConfig.connectionRetryConfig.clusterConnectTimeoutMillis = Number.MAX_SAFE_INTEGER;

        const disconnected = Util.DeferredPromise();
        const reconnected = Util.DeferredPromise();
        config.listeners.addLifecycleListener((state) => {
            if (state === LifecycleState.DISCONNECTED) {
                disconnected.resolve();
            }
        });

        let member;
        let map;

        return Controller.createCluster(null, null)
            .then((c) => {
                cluster = c;
                config.clusterName = cluster.id;
                return Controller.startMember(cluster.id);
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
                return Controller.shutdownMember(cluster.id, member.uuid);
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

                return Controller.startMember(cluster.id);
            })
            .then((m) => {
                return reconnected.promise;
            })
            .then(() => {
                expect(client.getLifecycleService().isRunning()).to.be.true;

                return map.put(1, 2);
            })
    });

});
