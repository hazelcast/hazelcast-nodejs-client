var expect = require("chai").expect;
var HazelcastClient = require("../lib/client")


describe("Atomic Long", function() {
    var atomicLong;

    before(function() {
        return HazelcastClient.create({
            "username": "dev",
            "password": "dev-pass",
            "port": 5701,
            "host": "localhost"
        }).then(function (client) {
            atomicLong = client.getAtomicLong("short");
        })
    });

    it("Set and Get Separate", function () {
        return atomicLong.set(10).then(function (result) {
            return atomicLong.get()
        }).then(function (result) {
            expect(result.toNumber()).to.equal(10);
        });
    });

    it("Add And Get", function () {
        return atomicLong.addAndGet(10).then(function (result) {
            expect(result.toNumber()).to.equal(20);
        })
    });

    it("Compare And Set Valid", function () {
        return atomicLong.compareAndSet(20, 10).then(function (result) {
            expect(result).to.be.true;
        })
    });

    it("Compare And Set Not Valid", function () {
        return atomicLong.compareAndSet(15, 10).then(function (result) {
            expect(result).not.to.be.true;
        })
    });

    it("Decrement And Get", function () {
        return atomicLong.decrementAndGet().then(function (result) {
            expect(result.toNumber()).to.equal(9);
        })
    });

    it("Get And Add", function () {
        return atomicLong.getAndAdd(6).then(function (result) {
            expect(result.toNumber()).to.equal(9);
            return atomicLong.get();
        }).then(function (result) {
            expect(result.toNumber()).to.equal(15)
        })
    });

    it("Get And Set", function () {
        return atomicLong.getAndSet(10).then(function (result) {
            expect(result.toNumber()).to.equal(15);
            return atomicLong.get();
        }).then(function (result) {
            expect(result.toNumber()).to.equal(10)
        })
    });

    it("Increment And Get", function () {
        return atomicLong.incrementAndGet().then(function (result) {
            expect(result.toNumber()).to.equal(11);
        })
    });

    it("Get And Increment", function () {
        return atomicLong.getAndIncrement(10).then(function (result) {
            expect(result.toNumber()).to.equal(11);
            return atomicLong.get();
        }).then(function (result) {
            expect(result.toNumber()).to.equal(12)
        })
    });
});


