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

var Controller = require('./RC');
var expect = require('chai').expect;
var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;

describe('ClusterService', function () {
    this.timeout(25000);
    var cluster;
    var member1;
    var client;

    beforeEach(function () {
        return Controller.createCluster(null, null).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function (res) {
            member1 = res;
            var cfg = new Config.ClientConfig();
            cfg.clusterName = cluster.id;
            cfg.properties['hazelcast.client.heartbeat.interval'] = 1000;
            cfg.properties['hazelcast.client.heartbeat.timeout'] = 5000;
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function (res) {
            client = res;
        });
    });

    afterEach(function () {
        client.shutdown();
        return Controller.terminateCluster(cluster.id);
    });

    it('should know when a new member joins to cluster', function (done) {
        var member2;

        var membershipListener = {
            memberAdded: function (membershipEvent) {
                expect(client.clusterService.getSize()).to.be.eq(2);
                done();
            }
        };

        client.clusterService.addMembershipListener(membershipListener);

        Controller.startMember(cluster.id).then(function (res) {
            member2 = res;
        });
    });

    it('should know when a member leaves cluster', function (done) {
        var member2;

        var membershipListener = {
            memberRemoved: function (membershipEvent) {
                expect(client.getClusterService().getSize()).to.be.eq(1);
                done();
            }
        };

        client.clusterService.addMembershipListener(membershipListener);

        Controller.startMember(cluster.id).then(function (res) {
            member2 = res;
            Controller.shutdownMember(cluster.id, member2.uuid);
        });
    });

    it('getMemberList returns correct list after a member is removed', function (done) {
        var member2;
        var member3;

        var membershipListener = {
            memberRemoved: function (membershipEvent) {
                var remainingMemberList = client.getClusterService().getMemberList();
                expect(remainingMemberList).to.have.length(2);
                var portList = remainingMemberList.map(function (member) {
                    return member.address.port;
                });
                expect(portList).to.have.members([member1.port, member3.port]);
                done();
            }
        };

        client.clusterService.addMembershipListener(membershipListener);

        Controller.startMember(cluster.id).then(function (res) {
            member2 = res;
            return Controller.startMember(cluster.id);
        }).then(function (res) {
            member3 = res;
            Controller.shutdownMember(cluster.id, member2.uuid);
        });
    });

    it('should throw when wrong host addresses given in config', function (done) {
        var cfg = new Config.ClientConfig();
        cfg.clusterName = cluster.id;
        cfg.connectionStrategyConfig.connectionRetryConfig.clusterConnectTimeoutMillis = 2000;
        cfg.networkConfig.addresses = [
            '0.0.0.0:5709',
            '0.0.0.1:5710'
        ];

        var falseStart = false;
        HazelcastClient.newHazelcastClient(cfg).catch(function (err) {
            done();
        }).then(function (client) {
            if (client) {
                falseStart = true;
                return client.shutdown();
            }
        }).then(function () {
            if (falseStart) {
                done(Error('Client falsely started with wrong addresses'));
            }
        });
    });

    it('should throw with wrong cluster name', function (done) {
        var cfg = new Config.ClientConfig();
        cfg.clusterName = 'wrong';
        cfg.connectionStrategyConfig.connectionRetryConfig.clusterConnectTimeoutMillis = 2000;

        HazelcastClient.newHazelcastClient(cfg).then(function (newClient) {
            newClient.shutdown();
            done(new Error('Client falsely started with wrong cluster name'));
        }).catch(function (err) {
            done();
        });
    });
})
;
