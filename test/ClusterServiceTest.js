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
var Promise = require('bluebird');

describe('ClusterServiceTest', function () {
    this.timeout(25000);
    var cluster;
    var ownerMember;
    var client;

    beforeEach(function (done) {
        Controller.createCluster(null, null).then(function (res) {
            cluster = res;
            Controller.startMember(cluster.id).then(function (res) {
                ownerMember = res;
                var cfg = new Config.ClientConfig();
                cfg.properties['hazelcast.client.heartbeat.interval'] = 1000;
                cfg.properties['hazelcast.client.heartbeat.timeout'] = 5000;
                return HazelcastClient.newHazelcastClient(cfg);
            }).then(function (res) {
                client = res;
                done();
            }).catch(function (err) {
                done(err);
            });
        }).catch(function (err) {
            done(err);
        });
    });

    afterEach(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
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

    it('getMembers returns correct list after a member is removed', function (done) {
        this.timeout(40000);
        var member2;
        var member3;

        var membershipListener = {
            memberRemoved: function (membershipEvent) {
                var remainingMemberList = client.getClusterService().getMembers();
                expect(remainingMemberList).to.have.length(2);
                expect(remainingMemberList[0].address.port).to.equal(ownerMember.port);
                expect(remainingMemberList[1].address.port).to.equal(member3.port);
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

    it('should throw with message containing wrong host addresses in config', function () {
        var cfg = new Config.ClientConfig();
        cfg.networkConfig.addresses = [
            '0.0.0.0:5709',
            '0.0.0.1:5710'
        ];

        var falseStart = false;
        return HazelcastClient.newHazelcastClient(cfg).catch(function (err) {
            Promise.all(cfg.networkConfig.addresses.map(function (address) {
                return expect(err.message).to.include(address.toString());
            }));
        }).then(function (client) {
            if (client) {
                falseStart = true;
                return client.shutdown();
            } else {
                return;
            }
        }).then(function () {
            if (falseStart) {
                throw Error('Client falsely started with wrong addresses')
            }
        });
    });

    it('should throw with wrong group name', function (done) {
        var cfg = new Config.ClientConfig();
        cfg.groupConfig.name = 'wrong';
        HazelcastClient.newHazelcastClient(cfg).then(function (newClient) {
            newClient.shutdown();
            done(new Error('Client falsely started with wrong group name'));
        }).catch(function (err) {
            done();
        });
    });
});
