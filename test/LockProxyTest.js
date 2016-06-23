var expect = require("chai").expect;
var HazelcastClient = require("../.").Client;
var Controller = require('./RC');
var Util = require('./Util');
var Q = require('q');

describe("Lock Proxy", function () {

    var cluster;
    var clientOne;
    var clientTwo;

    var lockOne;
    var lockTwo;

    before(function () {
        this.timeout(10000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return Q.all([
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
        lockOne = clientOne.getLock('test');
        lockTwo = clientTwo.getLock('test');
    });

    afterEach(function () {
        return Q.all([lockOne.destroy(), lockTwo.destroy()]);
    });

    after(function () {
        clientOne.shutdown();
        clientTwo.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it("locks and unlocks", function () {
        this.timeout(10000);
        var startTime = Date.now();
        return lockOne.lock().then(function () {
            setTimeout(function () {
                lockOne.unlock();
            }, 1000);
            return lockTwo.lock()
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
        });
    });

    it("unlocks after lease expired", function () {
        this.timeout(10000);
        var startTime = Date.now();
        return lockOne.lock(1000).then(function () {
            return lockTwo.lock();
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
        });
    });

    it("gives up attempt to lock after timeout is exceeded", function () {
        this.timeout(10000);
        return lockOne.lock().then(function () {
            return lockTwo.tryLock(1000);
        }).then(function (acquired) {
            expect(acquired).to.be.false;
        });
    });

    it("acquires lock before timeout is exceeded", function () {
        this.timeout(10000);
        var startTime = Date.now();
        return lockOne.lock(1000).then(function() {
            return lockTwo.tryLock(2000);
        }).then(function (acquired) {
            var elasped = Date.now() - startTime;
            expect(acquired).to.be.true;
            expect(elasped).to.be.greaterThan(1000);
        })
    });

    it("acquires the lock before timeout and unlocks after lease expired", function () {
        this.timeout(10000);
        var startTime = Date.now();
        return lockOne.lock(1000).then(function () {
            return lockTwo.tryLock(2000, 1000);
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
            return lockOne.lock(2000);
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
        });

    });

    it("correctly reports lock status when unlocked", function () {
        return lockOne.isLocked().then(function (locked) {
            expect(locked).to.be.false;
        });
    });


    it("correctly reports lock status when locked", function () {
        return lockOne.lock().then(function () {
            return lockOne.isLocked();
        }).then(function (locked) {
            expect(locked).to.be.true;
            return lockTwo.isLocked();
        }).then(function (locked) {
            expect(locked).to.be.true;
        });
    });

    it("correctly reports remaining lease time", function () {
        return lockOne.lock(1000).then(function () {
            return lockOne.getRemainingLeaseTime();
        }).then(function (remaining) {
            return lockOne.getRemainingLeaseTime();
        }).then(function (remaining) {
            expect(remaining).to.be.lessThan(1000);
        })
    });


    it("correctly reports that lock is being held by a specific client", function () {
        return lockOne.lock().then(function () {
            return lockOne.isLockedByThisClient();
        }).then(function (locked) {
            expect(locked).to.be.true;
            return lockTwo.isLockedByThisClient();
        }).then(function (locked) {
            expect(locked).to.be.false;
        });
    });

    it("correctly reports lock acquire count", function () {
        return lockOne.lock().then(function () {
            return lockOne.getLockCount();
        }).then(function (count) {
            expect(count).to.equal(1);
            return lockOne.lock();
        }).then(function () {
            return lockOne.getLockCount();
        }).then(function (count) {
            expect(count).to.equal(2);
        });
    });

    it("force unlocks", function () {
        return lockOne.lock().then(function () {
            return lockOne.lock();
        }).then(function () {
            return lockOne.lock();
        }).then(function () {
            return lockOne.unlock()
        }).then(function () {
            return lockOne.isLocked();
        }).then(function (locked) {
            expect(locked).to.be.true;
            return lockOne.forceUnlock();
        }).then(function () {
            return lockOne.isLocked();
        }).then(function (locked) {
            expect(locked).to.be.false;
        });
    });


});
