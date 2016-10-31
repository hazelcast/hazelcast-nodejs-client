var Controller = require('./RC');
var expect = require('chai').expect;
var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;
var Address = require('../lib/Address');

describe('ClusterService', function() {
    this.timeout(15000);
    var cluster;
    var ownerMember;
    before(function(done) {
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

    after(function() {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('should know when a new member joins to cluster', function() {
        var member2;
        return Controller.startMember(cluster.id).then(function(res) {
            member2 = res;
            return expect(client.clusterService.getSize()).to.be.eq(2);
        }).then(function() {
            return Controller.shutdownMember(cluster.id, member2.uuid);
        });
    });

    it('should know when a member leaves cluster', function() {
        var member2;
        return Controller.startMember(cluster.id).then(function(res) {
            member2 = res;
            return Controller.shutdownMember(cluster.id, member2.uuid);
        }).then(function() {
            return expect(client.clusterService.getSize()).to.be.eq(1);
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
                configuredAddresses.map(Address.encodeToString).join(', '));
        }).catch(function (err) {
            return Promise.all(configuredAddresses.map((address) => {
                return expect(err.message).to.include(Address.encodeToString(address))
            }));
        });
    });

    it('should throw with wrong group name', function(done) {
        var cfg = new Config.ClientConfig();
        cfg.groupConfig.name = 'wrong';
        return HazelcastClient.newHazelcastClient(cfg).then(function(newClient) {
            newClient.shutdown();
            done(new Error('Client falsely started with wrong group name'));
        }).catch(function (err) {
            done();
        });
    });

    it('should throw with wrong group password', function(done) {
        var cfg = new Config.ClientConfig();
        cfg.groupConfig.password = 'wrong';
        return HazelcastClient.newHazelcastClient(cfg).then(function(newClient) {
            newClient.shutdown();
            done(new Error('Client falsely started with wrong group password'));
        }).catch(function (err) {
            done();
        });
    });
});
