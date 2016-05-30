var expect = require("chai").expect;
var HazelcastClient = require("../.").Client;
var Controller = require('./RC');
var Util = require('./Util');
var Q = require('q');

describe("Queue Proxy", function () {

    var cluster;
    var client;
    var queue;

    before(function () {
        this.timeout(10000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function () {
        queue = client.getQueue('test');
        return _offerToQueue(10);
    });

    afterEach(function () {
        return queue.destroy();
    });

    function _offerToQueue(size) {
        var promises = [];
        for (var i = 0; i < size; i++) {
            promises.push(queue.offer('item' + i));
        }
        return Q.all(promises);
    }

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('size', function() {
        return queue.size().then(function(s) {
            return expect(s).to.equal(10);
        })
    });

    it('peek', function() {
        return queue.peek().then(function(head) {
            return expect(head).to.equal('item0');
        })
    });

    it('add return true', function() {
        return queue.add('item_new').then(function (retVal) {
            return expect(retVal).to.be.true;
        });
    });

    it('add increases queue size', function () {
        return queue.add('item_new').then(function () {
            return queue.size();
        }).then(function(s) {
            return expect(s).to.equal(11);
        });
    });

    it('poll decreases queue size', function() {
        return queue.poll().then(function() {
            return queue.size();
        }).then(function(s) {
            return expect(s).to.equal(9);
        });
    });

    it('poll returns the head of the queue', function() {
        return queue.poll().then(function(ret) {
            return expect(ret).to.equal('item0');
        });
    });

    it('remaining capacity', function() {
        return queue.remainingCapacity().then(function(c) {
            return expect(c).to.be.above(0);
        });
    });

    it('contains returns false for absent', function() {
        return queue.contains('item_absent').then(function(ret) {
            return expect(ret).to.be.false;
        });
    });

    it('contains returns true for present', function() {
        return queue.contains('item0').then(function(ret) {
            return expect(ret).to.be.true;
        });
    });

    it('remove', function() {
        return queue.remove('item5').then(function(ret) {
            return expect(ret).to.be.true;
        });
    });

    it('remove decreases size', function() {
        return queue.remove('item5').then(function () {
            return queue.size();
        }).then(function(s) {
            return expect(s).to.equal(9);
        });
    });

    it('toArray', function() {
        return queue.toArray().then(function(arr) {
            expect(arr).to.be.instanceof(Array);
            expect(arr).to.have.lengthOf(10);
            expect(arr).to.include.members(['item0', 'item2', 'item9']);
        });
    });

    it('clear', function() {
        return queue.clear().then(function() {
            return queue.size();
        }).then(function(s) {
            return expect(s).to.equal(0);
        });
    });

    it('drainTo', function() {
        var dummyArr = ['dummy_item'];
        return queue.drainTo(dummyArr).then(function() {
            expect(dummyArr).to.have.lengthOf(11);
            expect(dummyArr).to.include.members(['item0', 'dummy_item', 'item3', 'item9']);
        });
    });

    it('drainTo with max elements', function() {
        var dummyArr = ['dummy_item'];
        return queue.drainTo(dummyArr, 2).then(function() {
            expect(dummyArr).to.have.lengthOf(3);
            expect(dummyArr).to.include.members(['item0', 'dummy_item', 'item1']);
            expect(dummyArr).to.not.include.members(['item2', 'item9']);
        });
    });

    it('isEmpty false', function() {
        return queue.isEmpty().then(function (ret) {
            return expect(ret).to.be.false;
        });
    });

    it('isEmpty true', function() {
        return queue.clear().then(function (ret) {
            return queue.isEmpty();
        }).then(function (ret) {
            return expect(ret).to.be.true;
        })
    });

    it('take waits', function(done) {
        queue.clear().then(function () {
            queue.take().then(function(val) {
                expect(val).to.equal('item_new');
                done();
            }).catch(done);
            queue.add('item_new').catch(done);
        }).catch(done);
    });

    it('take immediately returns', function() {
        return queue.take().then(function(ret) {
            return expect(ret).to.equal('item0');
        });
    });
});
