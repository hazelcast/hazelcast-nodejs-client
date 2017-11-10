var HazelcastClient = require('../.').Client;
var Controller = require('./RC');
var expect = require('chai').expect;
var Promise = require('bluebird');
describe('MembershipListener', function() {
    this.timeout(10000);
    var cluster;
    var member;
    var client;
    before(function(done) {
        Controller.createCluster(null, null).then(function(res) {
            cluster = res;
            return Controller.startMember(cluster.id).then(function(res) {
                member = res;
                return HazelcastClient.newHazelcastClient();
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

    it('sees member added event', function(done) {
        var newMember;
        var err = undefined;
        var listenerCalledResolver = Promise.defer();

        client.clusterService.on('memberAdded', function (member) {
            listenerCalledResolver.resolve(member);
        });

        Controller.startMember(cluster.id).then(function(res) {
            newMember = res;
            return listenerCalledResolver.promise;
        }).then(function (addedMember) {
            expect(addedMember.address.host).to.equal(newMember.host);
            expect(addedMember.address.port).to.equal(newMember.port);
        }).catch(function (e) {
            err = e;
        }).finally(function(e) {
            Controller.shutdownMember(cluster.id, newMember.uuid).then(function() {
                done(err);
            });
        });

    });

    it('sees member removed event', function(done) {
        var newMember;
        var listenerCalledResolver = Promise.defer();

        client.clusterService.on('memberRemoved', function (member) {
            listenerCalledResolver.resolve(member);
        });

        Controller.startMember(cluster.id).then(function(res) {
            newMember = res;
            return Controller.shutdownMember(cluster.id, newMember.uuid);
        }).then(function() {
            return listenerCalledResolver.promise;
        }).then(function(removedMember) {
            try {
                expect(removedMember.address.host).to.equal(newMember.host);
                expect(removedMember.address.port).to.equal(newMember.port);
                done();
            } catch (e) {
                done(e);
            }
        });
    });

    it('sees member attribute change put event', function(done) {
        client.clusterService.on('memberAttributeChange', function(uuid, key, op, value) {
            if(op === 'put') {
                expect(uuid).to.equal(member.uuid);
                expect(key).to.equal('test');
                expect(value).to.equal('123');
                done();
            }
        });
        var script = 'function attrs() { ' +
            'return instance_0.getCluster().getLocalMember().setIntAttribute("test", 123); }; result=attrs();';
        Controller.executeOnController(cluster.id, script, 1);
    });

    it('sees member attribute change remove event', function(done) {
        client.clusterService.on('memberAttributeChange', function(uuid, key, op, value) {
            if (op === 'remove') {
                expect(uuid).to.equal(member.uuid);
                expect(key, 'test');
                done();
            }
        });
        var addScript = 'function attrs() { ' +
            'return instance_0.getCluster().getLocalMember().setIntAttribute("test", 123); }; result=attrs();';
        var removeScript = 'function attrs() { ' +
            'return instance_0.getCluster().getLocalMember().removeAttribute("test"); }; result=attrs();';
        Controller.executeOnController(cluster.id, addScript, 1)
            .then(Controller.executeOnController.bind(this, cluster.id, removeScript, 1));
    });
});
