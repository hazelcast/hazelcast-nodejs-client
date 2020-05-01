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

var RC = require('../RC');
var HazelcastClient = require('../../').Client;
var Config = require('../../').Config;
var Util = require('../Util');
var DeferredPromise = require('../../lib/Util').DeferredPromise;
var Address = require('../../').Address;
var TargetDisconnectedError = require('../../lib/HazelcastError').TargetDisconnectedError;

describe('Heartbeat', function () {
    this.timeout(50000);

    var cluster;

    beforeEach(function () {
        return RC.createCluster(null, null).then(function (resp) {
            cluster = resp;
        });
    });

    afterEach(function () {
        return RC.shutdownCluster(cluster.id);
    });

    it('connectionRemoved fired when second member stops heartbeating', function (done) {
        var client;
        var memberAddedPromise = new DeferredPromise();
        RC.startMember(cluster.id).then(function () {
            var cfg = new Config.ClientConfig();
            cfg.clusterName = cluster.id;
            cfg.properties['hazelcast.client.heartbeat.interval'] = 500;
            cfg.properties['hazelcast.client.heartbeat.timeout'] = 2000;
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function (resp) {
            client = resp;
        }).then(function () {
            var membershipListener = {
                memberAdded: function (membershipEvent) {
                    var address = new Address(membershipEvent.member.address.host, membershipEvent.member.address.port);
                    warmUpConnectionToAddressWithRetry(client, address);
                    memberAddedPromise.resolve();
                }
            };

            client.clusterService.addMembershipListener(membershipListener);
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function (member2) {
            client.getConnectionManager().once('connectionRemoved', function (connection) {
                var remoteAddress = connection.getRemoteAddress();
                if (remoteAddress.host === member2.host && remoteAddress.port === member2.port) {
                    if (connection.closedReason === 'Heartbeat timed out'
                        && connection.closedCause instanceof TargetDisconnectedError) {
                        done();
                        client.shutdown();
                    } else {
                        done(new Error('Connection does not closed due to heartbeat timeout. Reason: '
                            + connection.closedReason + ', cause: ' + connection.closedCause));
                    }
                } else {
                    done(new Error(remoteAddress.host + ':' + remoteAddress.port + ' is removed instead of '
                        + member2.host + ':' + member2.port))
                }
            });


            return memberAddedPromise.promise.then(function () {
                simulateHeartbeatLost(client, new Address(member2.host, member2.port), 2000);
            })
        }).catch(done);
    });

    it('connectionAdded fired when second member comes back', function (done) {
        var client;
        var member1;
        var member2;
        var memberAddedPromise = new DeferredPromise();
        RC.startMember(cluster.id).then(function (m) {
            member1 = m;
            var cfg = new Config.ClientConfig();
            cfg.clusterName = cluster.id;
            cfg.properties['hazelcast.client.heartbeat.interval'] = 500;
            cfg.properties['hazelcast.client.heartbeat.timeout'] = 2000;
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function (resp) {
            client = resp;
            var membershipListener = {
                memberAdded: function (membershipEvent) {
                    memberAddedPromise.resolve();
                }
            };

            client.clusterService.addMembershipListener(membershipListener);
            return RC.startMember(cluster.id);
        }).then(function (resp) {
            member2 = resp;
            return memberAddedPromise.promise;
        }).then(function () {
            return warmUpConnectionToAddressWithRetry(client, new Address(member2.host, member2.port), 3);
        }).then(() => {
            client.getConnectionManager().once('connectionRemoved', function (connection) {
                var remoteAddress = connection.getRemoteAddress();
                if (remoteAddress.host === member2.host && remoteAddress.port === member2.port) {
                    if (!(connection.closedReason === 'Heartbeat timed out'
                        || connection.closedCause instanceof TargetDisconnectedError)) {
                        done(new Error('Connection does not closed due to heartbeat timeout. Reason: '
                            + connection.closedReason + ', cause: ' + connection.closedCause));
                    }
                } else {
                    done(new Error(remoteAddress.host + ':' + remoteAddress.port + ' is removed instead of '
                        + member2.host + ':' + member2.port))
                }
            });
            client.getConnectionManager().once('connectionAdded', function (connection) {
                var remoteAddress = connection.getRemoteAddress();
                if (remoteAddress.host === member2.host && remoteAddress.port === member2.port) {
                    done();
                    client.shutdown();
                } else {
                    done(new Error(remoteAddress.host + ':' + remoteAddress.port + ' is added instead of '
                        + member2.host + ':' + member2.port))
                }
            });
            simulateHeartbeatLost(client, new Address(member2.host, member2.port), 2000);
        }).catch(done);
    });

    function simulateHeartbeatLost(client, address, timeout) {
        var connection = client.connectionManager.getConnectionFromAddress(address);
        connection.lastReadTimeMillis = connection.getLastReadTimeMillis() - timeout;
    }

    function warmUpConnectionToAddressWithRetry(client, address, retryCount) {
        return client.connectionManager.getOrConnect(address).then(function (conn) {
            if (conn != null) {
                return conn;
            } else if (conn == null && retryCount > 0) {
                return Util.promiseWaitMilliseconds(300).then(function () {
                    return warmUpConnectionToAddressWithRetry(client, address, retryCount - 1);
                });
            } else {
                throw new Error('Could not warm up connection to ' + address);
            }
        });
    }
});
