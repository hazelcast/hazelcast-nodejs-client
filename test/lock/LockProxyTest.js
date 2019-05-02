/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var expect = require("chai").expect;
var HazelcastClient = require("../../lib/index.js").Client;
var Controller = require('./../RC');
var Util = require('./../Util');
var Promise = require('bluebird');

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
        return clientOne.getLock('test').then(function (lock) {
            lockOne = lock;
            return clientTwo.getLock('test');
        }).then(function (lock) {
            lockTwo = lock;
        });
    });

    afterEach(function () {
        return Promise.all([lockOne.destroy(), lockTwo.destroy()]);
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
        return lockOne.lock(1000).then(function () {
            return lockTwo.tryLock(2000);
        }).then(function (acquired) {
            var elasped = Date.now() - startTime;
            expect(acquired).to.be.true;
            expect(elasped).to.be.greaterThan(995);
        })
    });

    it("acquires the lock before timeout and unlocks after lease expired", function () {
        this.timeout(10000);
        var startTime = Date.now();
        return lockOne.lock(1000).then(function () {
            return lockTwo.tryLock(2000, 1000);
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.at.least(1000);
            return lockOne.lock(2000);
        }).then(function () {
            var elapsed = Date.now() - startTime;
            expect(elapsed).to.be.at.least(1000);
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
            return Util.promiseWaitMilliseconds(30)
        }).then(function (remaining) {
            return lockOne.getRemainingLeaseTime();
        }).then(function (remaining) {
            expect(remaining).to.be.lessThan(971);
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
