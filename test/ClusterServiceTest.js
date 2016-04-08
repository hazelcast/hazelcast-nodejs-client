var Controller = require('./RC');
var expect = require('chai').expect;
var HazelcastClient = require('../.');
var Config = require('../lib/Config');
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

    it('should throw with wrong host address in config', function(done) {
        var cfg = new Config.ClientConfig();
        cfg.networkConfig.addresses = [{host: '0.0.0.0', port: '5709'}];
        return HazelcastClient.newHazelcastClient(cfg).then(function(newClient) {
            newClient.shutdown();
            done('Client falsely started with 0.0.0.0 target host');
        }).catch(function (err) {
            done();
        });
    });
});
