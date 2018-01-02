/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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

describe('ClusterService', function() {
    this.timeout(15000);
    var cluster;
    var ownerMember;

    beforeEach(function(done) {
        Controller.createCluster(null, null).then(function(res) {
            cluster = res;
            Controller.startMember(cluster.id).then(function(res) {
                ownerMember = res;
                var cfg = new Config.ClientConfig();
                cfg.properties['hazelcast.client.heartbeat.interval'] = 1000;
                cfg.properties['hazelcast.client.heartbeat.timeout'] = 5000;
                return HazelcastClient.newHazelcastClient(cfg);
            }).then(function(res) {
                client = res;
                done();
            }).catch(function(err) {
                done(err);
            });
        }).catch(function(err) {
            done(err);
        });
    });

    afterEach(function() {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('should know when a new member joins to cluster', function(done) {
        var member2;

        client.getClusterService().once('memberAdded', function () {
            expect(client.clusterService.getSize()).to.be.eq(2);
            done();
        });

        Controller.startMember(cluster.id).then(function(res) {
            member2 = res;
        });
    });

    it('should know when a member leaves cluster', function(done) {
        var member2;

        client.getClusterService().once('memberRemoved', function () {
            expect(client.getClusterService().getSize()).to.be.eq(1);
            done();
        });

        Controller.startMember(cluster.id).then(function(res) {
            member2 = res;
            Controller.shutdownMember(cluster.id, member2.uuid);
        });
    });

    it('getMembers returns correct list after a member is removed', function (done) {
        this.timeout(20000);
        var member2;
        var member3;
        client.getClusterService().once('memberRemoved', function () {
            var remainingMemberList = client.getClusterService().getMembers();
            try {
                expect(remainingMemberList).to.have.length(2);
                expect(remainingMemberList[0].address.port).to.equal(ownerMember.port);
                expect(remainingMemberList[1].address.port).to.equal(member3.port);
                done();
            } catch (e) {
                done(e);
            }
        });
        Controller.startMember(cluster.id).then(function (res) {
            member2 = res;
            return Controller.startMember(cluster.id);
        }).then(function (res) {
            member3 = res;
            Controller.shutdownMember(cluster.id, member2.uuid);
        });
    });

    it('should throw with message containing wrong host addresses in config', function() {
        var configuredAddresses = [
            {host: '0.0.0.0', port: '5709'},
            {host: '0.0.0.1', port: '5710'}
        ];

        var cfg = new Config.ClientConfig();
        cfg.networkConfig.addresses = configuredAddresses;

        return HazelcastClient.newHazelcastClient(cfg).then(function(newClient) {
            newClient.shutdown();
            throw new Error('Client falsely started with target addresses: ' +
                configuredAddresses.map(function(element) {
                    return element.toString();
                }).join(', '));
        }).catch(function (err) {
            return Promise.all(configuredAddresses.map(function(address) {
                return expect(err.message).to.include(address.toString());
            }));
        });
    });

    it('should throw with wrong group name', function(done) {
        var cfg = new Config.ClientConfig();
        cfg.groupConfig.name = 'wrong';
        HazelcastClient.newHazelcastClient(cfg).then(function(newClient) {
            newClient.shutdown();
            done(new Error('Client falsely started with wrong group name'));
        }).catch(function (err) {
            done();
        });
    });

    it('should throw with wrong group password', function(done) {
        var cfg = new Config.ClientConfig();
        cfg.groupConfig.password = 'wrong';
        HazelcastClient.newHazelcastClient(cfg).then(function(newClient) {
            newClient.shutdown();
            done(new Error('Client falsely started with wrong group password'));
        }).catch(function (err) {
            done();
        });
    });
});
