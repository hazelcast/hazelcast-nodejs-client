var HazelcastClient = require('../.').Client;
var Controller = require('./RC');
var assert = require('chai').assert;
var sinon = require('sinon');
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
        var memberAddedSpy = sinon.spy();
        var newMember;
        client.clusterService.on('memberAdded', memberAddedSpy);
        Controller.startMember(cluster.id).then(function(res) {
            newMember = res;
            assert.isTrue(memberAddedSpy.calledOnce);
            assert.equal(memberAddedSpy.getCall(0).args[0].address.host, newMember.host);
            assert.equal(memberAddedSpy.getCall(0).args[0].address.port, newMember.port);
        }).catch(function(err) {
            done(err);
        }).finally(function() {
            Controller.shutdownMember(cluster.id, newMember.uuid).then(function() {
                done();
            });
        });
    });

    it('sees member removed event', function(done) {
        var memberRemovedSpy = sinon.spy();
        var newMember;
        client.clusterService.on('memberRemoved', memberRemovedSpy);
        Controller.startMember(cluster.id).then(function(res) {
            newMember = res;
            return Controller.shutdownMember(cluster.id, newMember.uuid);
        }).then(function() {
            assert.isTrue(memberRemovedSpy.calledOnce);
            assert.equal(memberRemovedSpy.getCall(0).args[0].address.host, newMember.host);
            assert.equal(memberRemovedSpy.getCall(0).args[0].address.port, newMember.port);
            done();
        }).catch(function(err) {
            done(err);
        });
    });

    it('sees member attribute change put event', function(done) {
        client.clusterService.on('memberAttributeChange', function(uuid, key, op, value) {
            if(op === 'put') {
                assert.equal(uuid, member.uuid);
                assert.equal(key, 'test');
                assert.equal(op, 'put');
                assert.equal(value, '123');
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
                assert.equal(uuid, member.uuid);
                assert.equal(key, 'test');
                assert.equal(op, 'remove');
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
