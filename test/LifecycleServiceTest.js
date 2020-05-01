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

var RC = require('./RC');
var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;
var expect = require('chai').expect;

describe('LifecycleService', function () {
    var cluster;
    var client;

    before(function () {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
            return RC.startMember(cluster.id);
        });
    });

    after(function () {
        return RC.terminateCluster(cluster.id);
    });

    it('client should emit STARTING, STARTED, CLIENT_CONNECTED, SHUTTING_DOWN, CLIENT_DISCONNECTED and SHUTDOWN events in order', function (done) {
        var cfg = new Config.ClientConfig();
        cfg.clusterName = cluster.id;
        var expectedState = 'STARTING';
        cfg.listeners.addLifecycleListener(
            function (state) {
                if (state === 'STARTING' && expectedState === 'STARTING') {
                    expectedState = 'STARTED'
                } else if (state === 'STARTED' && expectedState === 'STARTED') {
                    expectedState = 'CLIENT_CONNECTED';
                } else if (state === 'CLIENT_CONNECTED' && expectedState === 'CLIENT_CONNECTED') {
                    expectedState = 'SHUTTING_DOWN';
                } else if (state === 'SHUTTING_DOWN' && expectedState === 'SHUTTING_DOWN') {
                    expectedState = 'CLIENT_DISCONNECTED';
                } else if (state === 'CLIENT_DISCONNECTED' && expectedState === 'CLIENT_DISCONNECTED') {
                    expectedState = 'SHUTDOWN';
                } else if (state === 'SHUTDOWN' && expectedState === 'SHUTDOWN') {
                    done();
                } else {
                    done('Got lifecycle event ' + state + ' instead of ' + expectedState);
                }
            }
        );
        HazelcastClient.newHazelcastClient(cfg).then(function (client) {
            client.shutdown();
        });
    });

    it('client should emit STARTING, STARTED, CLIENT_CONNECTED, SHUTTING_DOWN, CLIENT_DISCONNECTED and SHUTDOWN events in order (via import config)', function (done) {
        var cfg = new Config.ClientConfig();
        cfg.clusterName = cluster.id;
        var expectedState = 'STARTING';
        exports.lifecycleListener = function (state) {
            if (state === 'STARTING' && expectedState === 'STARTING') {
                expectedState = 'STARTED'
            } else if (state === 'STARTED' && expectedState === 'STARTED') {
                expectedState = 'CLIENT_CONNECTED';
            } else if (state === 'CLIENT_CONNECTED' && expectedState === 'CLIENT_CONNECTED') {
                expectedState = 'SHUTTING_DOWN';
            } else if (state === 'SHUTTING_DOWN' && expectedState === 'SHUTTING_DOWN') {
                expectedState = 'CLIENT_DISCONNECTED';
            } else if (state === 'CLIENT_DISCONNECTED' && expectedState === 'CLIENT_DISCONNECTED') {
                expectedState = 'SHUTDOWN';
            } else if (state === 'SHUTDOWN' && expectedState === 'SHUTDOWN') {
                done();
            } else {
                done('Got lifecycle event ' + state + ' instead of ' + expectedState);
            }
        };
        cfg.listenerConfigs.push({path: __filename, exportedName: 'lifecycleListener'});
        HazelcastClient.newHazelcastClient(cfg).then(function (client) {
            client.shutdown();
        });
    });

    it('event listener should get SHUTTING_DOWN, CLIENT_DISCONNECTED and SHUTDOWN events when added after startup', function (done) {
        var cfg = new Config.ClientConfig();
        cfg.clusterName = cluster.id;
        var expectedState = 'SHUTTING_DOWN';
        HazelcastClient.newHazelcastClient(cfg).then(function (client) {
            client.lifecycleService.on('lifecycleEvent', function (state) {
                if (state === 'SHUTTING_DOWN' && expectedState === 'SHUTTING_DOWN') {
                    expectedState = 'CLIENT_DISCONNECTED';
                } else if (state === 'CLIENT_DISCONNECTED' && expectedState === 'CLIENT_DISCONNECTED') {
                    expectedState = 'SHUTDOWN';
                } else if (state === 'SHUTDOWN' && expectedState === 'SHUTDOWN') {
                    done();
                } else {
                    done('Got lifecycle event ' + state + ' instead of ' + expectedState);
                }
            });
            client.shutdown();
        });
    });

    it('isRunning returns correct values at lifecycle stages', function (done) {
        var cfg = new Config.ClientConfig();
        cfg.clusterName = cluster.id;
        HazelcastClient.newHazelcastClient(cfg).then(function (client) {
            client.lifecycleService.on('lifecycleEvent',
                function (state) {
                    if (state === 'STARTING') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                    } else if (state === 'STARTED') {
                        expect(client.lifecycleService.isRunning()).to.be.true;
                    } else if (state === 'CLIENT_CONNECTED') {
                        expect(client.lifecycleService.isRunning()).to.be.true;
                    } else if (state === 'SHUTTING_DOWN') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                    } else if (state === 'CLIENT_DISCONNECTED') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                    } else if (state === 'SHUTDOWN') {
                        expect(client.lifecycleService.isRunning()).to.be.false;
                        done();
                    } else {
                        done('Got lifecycle event ' + state + ' instead of ' + expectedState);
                    }
                }
            );
            client.shutdown();
        });
    });
});
