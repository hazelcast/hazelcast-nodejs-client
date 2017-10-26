var Controller = require('./RC');
var expect = require('chai').expect;
var HazelcastClient = require('../.').Client;
var Config = require('../.').Config;
describe.skip('Lost connection', function() {
    var cluster;
    var member1;
    var client;
    before(function(done) {
        Controller.createCluster(null, null).then(function(res) {
            cluster = res;
            Controller.startMember(cluster.id).then(function(res) {
                member1 = res;
                var cfg = new Config.ClientConfig();
                cfg.properties['hazelcast.client.heartbeat.interval'] = 500;
                cfg.properties['hazelcast.client.heartbeat.timeout'] = 2000;
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

    it('M2 starts, M1 goes down, client sets M2 as owner', function(done) {
        this.timeout(12000);
        var newMember;
        client.clusterService.on('memberAdded', function() {
            Controller.shutdownMember(cluster.id, member1.uuid).then(function() {
                setTimeout(function() {
                    try {
                        expect(client.clusterService.getOwnerConnection().address.host).to.be.eq(newMember.host);
                        expect(client.clusterService.getOwnerConnection().address.port).to.be.eq(newMember.port);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }, 2500)
            });
        });
        Controller.startMember(cluster.id).then(function(m) {
            newMember = m;
        });
    });
});
