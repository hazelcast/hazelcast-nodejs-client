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

var expect = require('chai').expect;
var HazelcastClient = require('../../lib/index.js').Client;
var Controller = require('./../RC');

describe("Semaphore Proxy", function () {

    var cluster;
    var client1;
    var client2;

    var semaphore;

    before(function () {
        this.timeout(10000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient();
        }).then(function (cli) {
            client1 = cli;
            return HazelcastClient.newHazelcastClient();
        }).then(function (clie) {
            client2 = clie;
        });
    });

    beforeEach(function () {
        return client1.getSemaphore('test').then(function (s) {
            semaphore = s;
        });
    });

    afterEach(function () {
        return semaphore.destroy();
    });

    after(function () {
        client1.shutdown();
        client2.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('inits semaphore with 10 permits', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.availablePermits()
            })
            .then(function (res) {
                expect(res).to.equal(10);
            });
    });

    it('acquires 10 permits ', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.acquire(10);
            })
            .then(function () {
                return semaphore.availablePermits();
            })
            .then(function (res) {
                expect(res).to.equal(0);
            });
    });

    it('drain', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.drainPermits(10);
            })
            .then(function (res) {
                expect(res).to.equal(10);
                return semaphore.availablePermits();
            })
            .then(function (res) {
                expect(res).to.equal(0);
            });
    });

    it('reduces permits', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.reducePermits(10);
            })
            .then(function () {
                return semaphore.availablePermits();
            })
            .then(function (res) {
                expect(res).to.equal(0);
            });
    });

    it('releases 5 permits', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.acquire(10);
            })
            .then(function () {
                return semaphore.availablePermits();
            })
            .then(function (res) {
                expect(res).to.equal(0);
                return semaphore.release(5)
            })
            .then(function () {
                return semaphore.availablePermits();
            })
            .then(function (res) {
                expect(res).to.equal(5);
            });
    });

    it('try acquire', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.tryAcquire(10);
            })
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.availablePermits();
            })
            .then(function (res) {
                expect(res).to.equal(0);
            });
    });

    it('only one client proceeds when two clients race for 1 permit', function (done) {
        var sem1;
        var sem2;
        client1.getSemaphore("race").then(function (s) {
            sem1 = s;
            return client2.getSemaphore("race");
        }).then(function (s) {
            sem2 = s;
            return sem1.init(1);
        }).then(function () {
            return sem2.acquire();
        }).then(function () {
            sem1.acquire().then(function () {
                done(new Error("first client should not be able to acquire the semaphore"));
            });
            setTimeout(done, 1000);
        });
    });

    it('client is able to proceed after sufficient number of permits is available', function (done) {
        var sem1;
        var sem2;
        client1.getSemaphore("proceed").then(function (s) {
            sem1 = s;
            return client2.getSemaphore("proceed");
        }).then(function (s) {
            sem2 = s;
            return sem1.init(1);
        }).then(function () {
            return sem1.acquire();
        }).then(function () {
            sem2.acquire().then(done);
            sem1.release();
        });
    });

    it('tryAcquire returns false after timeout', function () {
        return semaphore.init(1).then(function () {
            return semaphore.acquire(1);
        }).then(function () {
            return semaphore.tryAcquire(1, 1000);
        }).then(function (res) {
            return expect(res).to.be.false;
        });
    });
});
