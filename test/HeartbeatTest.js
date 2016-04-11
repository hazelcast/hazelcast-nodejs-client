var RC = require('./RC');
var HazelcastClient = require('../.').Client;
var expect = require('chai').expect;
var Config = require('../.').Config;

describe('Hearbeat', function() {
    this.timeout(30000);

    var cluster;

    beforeEach(function() {
        return RC.createCluster(null, null).then(function(resp) {
            cluster = resp;
        });
    });

    afterEach(function() {
        return RC.shutdownCluster(cluster.id);
    });

    it('Heartbeat stopped fired when second member stops heartbeating', function(done) {
        var client;
        RC.startMember(cluster.id).then(function() {
            var cfg = new Config.ClientConfig();
            cfg.properties['hazelcast.client.heartbeat.interval'] = 500;
            cfg.properties['hazelcast.client.heartbeat.timeout'] = 2000;
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function(resp) {
            client = resp;
        }).then(function() {
            client.clusterService.on('memberAdded', function(member) {
                var address = {
                    host: member.address.host,
                    port: member.address.port,
                    toString: function() {
                        return member.address.host + ':' + member.address.port;
                    }
                };
                warmUpConnectionToAddress(client, address);
            });
            client.heartbeat.addListener({onHeartbeatStopped: function(connection) {
                client.shutdown();
                done();
            }})
        }).then(function() {
            return RC.startMember(cluster.id);
        }).then(function(member2) {
            RC.terminateMember(cluster.id, member2.uuid);
        }).catch(done);
    });

    it('Heartbeat restored fired when second member comes back', function(done) {
        var client;
        var member1;
        var member2;
        RC.startMember(cluster.id).then(function(m) {
            member1 = m;
            var cfg = new Config.ClientConfig();
            cfg.properties['hazelcast.client.heartbeat.interval'] = 500;
            cfg.properties['hazelcast.client.heartbeat.timeout'] = 2000;
            return HazelcastClient.newHazelcastClient(cfg);
        }).then(function(resp) {
            client = resp;
            client.clusterService.on('memberAdded', function(member) {
                var address = {
                    host: member.address.host,
                    port: member.address.port,
                    toString: function() {
                        return member.address.host + ':' + member.address.port;
                    }
                };
                warmUpConnectionToAddress(client, address).then(function() {
                    simulateHeartbeatLost(client, address, 2000);
                });
            });
            client.heartbeat.addListener({onHeartbeatRestored: function(connection) {
                client.shutdown();
                done();
            }});
            return RC.startMember(cluster.id);
        }).then(function(resp) {
            member2 = resp;
        }).catch(done);
    });

    function simulateHeartbeatLost(client, address, timeout) {
        client.connectionManager.establishedConnections[address].lastRead = client.connectionManager.establishedConnections[address].lastRead - timeout;
    }

    function warmUpConnectionToAddress(client, address) {
        return client.connectionManager.getOrConnect(address);
    }
});
