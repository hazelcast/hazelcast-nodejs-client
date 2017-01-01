var expect = require('chai').expect;
var HazelcastClient = require('../../lib/index.js').Client;
var Controller = require('./../RC');

describe("Semaphore Proxy", function () {

    var cluster;
    var client;

    var semaphore;

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
        semaphore = client.getSemaphore('test');
    });

    afterEach(function () {
        return semaphore.destroy();
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('inits semaphore with 10 permits', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.availablePermits()
                    .then(function (res) {
                        expect(res).to.equal(10);
                    });
            });
    });

    it('acquires 10 permits ', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.acquire(10)
                    .then(function () {
                        return semaphore.availablePermits()
                            .then(function (res) {
                                expect(res).to.equal(0);
                            });
                    });
            });
    });

    it('drain', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.drainPermits(10)
                    .then(function (res) {
                        expect(res).to.equal(10);
                        return semaphore.availablePermits()
                            .then(function (res) {
                                expect(res).to.equal(0);
                            });
                    });
            });
    });

    it('reduces permits', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.reducePermits(10)
                    .then(function () {
                        return semaphore.availablePermits()
                            .then(function (res) {
                                expect(res).to.equal(0);
                            });
                    });
            });
    });

    it('releases 5 permits', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.acquire(10)
                    .then(function () {
                        return semaphore.availablePermits()
                            .then(function (res) {
                                expect(res).to.equal(0);
                                return semaphore.release(5)
                                    .then(function () {
                                        return semaphore.availablePermits()
                                            .then(function (res) {
                                                expect(res).to.equal(5);
                                            });
                                    });
                            });
                    });
            });
    });

    it('try acquire', function () {
        return semaphore.init(10)
            .then(function (res) {
                expect(res).to.equal(true);
                return semaphore.tryAcquire(10)
                    .then(function (res) {
                        expect(res).to.equal(true);
                        return semaphore.availablePermits()
                            .then(function (res) {
                                expect(res).to.equal(0);
                            });
                    });
            });
    });
});
