var expect = require("chai").expect;
var HazelcastClient = require("../../lib/index.js").Client;
var Controller = require('./../RC');
var Util = require('./../Util');
var Promise = require('bluebird');

describe("MultiMap Proxy Lock", function () {

    var cluster;
    var clientOne;
    var clientTwo;

    var mapOne;
    var mapTwo;

    before(function () {
        this.timeout(10000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return Promise.all([
                HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                    clientOne = hazelcastClient;
                }),
                HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                    clientTwo = hazelcastClient;
                })
            ]);
        });
    });

    beforeEach(function () {
        mapOne = clientOne.getMultiMap('test');
        mapTwo = clientTwo.getMultiMap('test');
    });

    afterEach(function () {
        return Promise.all([mapOne.destroy(), mapTwo.destroy()]);
    });

    after(function () {
        clientOne.shutdown();
        clientTwo.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });


    it("locks and unlocks", function () {
        this.timeout(10000);
        var startTime = Date.now();
        return mapOne.put(1, 2).then(function () {
            return mapOne.lock(1);
        }).then(function () {
            setTimeout(function () {
                mapOne.unlock(1);
            }, 1000);
            return mapTwo.lock(1)
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
        });
    });

    it("unlocks after lease expired", function () {
        this.timeout(10000);
        var startTime = Date.now();
        return mapOne.lock(1, 1000).then(function () {
            return mapTwo.lock(1);
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
        });
    });

    it("gives up attempt to lock after timeout is exceeded", function () {
        this.timeout(10000);
        return mapOne.lock(1).then(function () {
            return mapTwo.tryLock(1, 1000);
        }).then(function (acquired) {
            expect(acquired).to.be.false;
        });
    });

    it("acquires lock before timeout is exceeded", function () {
        this.timeout(10000);
        var startTime = Date.now();
        return mapOne.lock(1, 1000).then(function() {
            return mapTwo.tryLock(1, 2000);
        }).then(function (acquired) {
            var elapsed = Date.now() - startTime;
            expect(acquired).to.be.true;
            expect(elapsed).to.be.greaterThan(1000);
        })
    });

    it("acquires the lock before timeout and unlocks after lease expired", function () {
        this.timeout(10000);
        var startTime = Date.now();
        return mapOne.lock(1, 1000).then(function () {
            return mapTwo.tryLock(1, 2000, 1000);
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
            return mapOne.lock(1, 2000);
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
        });

    });

    it("correctly reports lock status when unlocked", function () {
        return mapOne.isLocked(1).then(function (locked) {
            expect(locked).to.be.false;
        });
    });


    it("correctly reports lock status when locked", function () {
        return mapOne.lock(1).then(function () {
            return mapOne.isLocked(1);
        }).then(function (locked) {
            expect(locked).to.be.true;
            return mapTwo.isLocked(1);
        }).then(function (locked) {
            expect(locked).to.be.true;
        });
    });

    it("force unlocks", function () {
        return mapOne.lock(1).then(function () {
            return mapOne.lock(1);
        }).then(function () {
            return mapOne.lock(1);
        }).then(function () {
            return mapOne.unlock(1)
        }).then(function () {
            return mapOne.isLocked(1);
        }).then(function (locked) {
            expect(locked).to.be.true;
            return mapOne.forceUnlock(1);
        }).then(function () {
            return mapOne.isLocked(1);
        }).then(function (locked) {
            expect(locked).to.be.false;
        });
    });


});
