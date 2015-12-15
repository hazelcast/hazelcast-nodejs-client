var expect = require("chai").expect;
var connectionProperties = require("./TestProperties").connectionProperties;
var HazelcastClient = require("../lib/client");


describe("Atomic Long", function() {
    var atomicLong;

    before(function() {
        return HazelcastClient.create(connectionProperties).then(function (client) {
            atomicLong = client.getAtomicLong("short");
        })
    });

    beforeEach(function () {
       return atomicLong.set(10);
    });

    it("Set and Get Separate", function () {
        return atomicLong.get().then(function (result) {
            expect(result.toNumber()).to.equal(10);
        });
    });

    it("Add And Get", function () {
        return atomicLong.addAndGet(10).then(function (result) {
            expect(result.toNumber()).to.equal(20);
        })
    });

    it("Compare And Set Valid", function () {
        return atomicLong.compareAndSet(10, 20).then(function (result) {
            expect(result).to.be.true;
            return atomicLong.get();
        }).then(function (result) {
            expect(result.toNumber()).to.equal(20);
        });
    });

    it("Compare And Set Not Valid", function () {
        return atomicLong.compareAndSet(15, 20).then(function (result) {
            expect(result).not.to.be.true;
        })
    });

    it("Decrement And Get", function () {
        return atomicLong.decrementAndGet().then(function (result) {
            expect(result.toNumber()).to.equal(9);
        })
    });

    it("Get And Add", function () {
        return atomicLong.getAndAdd(5).then(function (result) {
            expect(result.toNumber()).to.equal(10);
            return atomicLong.get();
        }).then(function (result) {
            expect(result.toNumber()).to.equal(15)
        })
    });

    it("Get And Set", function () {
        return atomicLong.getAndSet(20).then(function (result) {
            expect(result.toNumber()).to.equal(10);
            return atomicLong.get();
        }).then(function (result) {
            expect(result.toNumber()).to.equal(20)
        })
    });

    it("Increment And Get", function () {
        return atomicLong.incrementAndGet().then(function (result) {
            expect(result.toNumber()).to.equal(11);
        })
    });

    it("Get And Increment", function () {
        return atomicLong.getAndIncrement().then(function (result) {
            expect(result.toNumber()).to.equal(10);
            return atomicLong.get();
        }).then(function (result) {
            expect(result.toNumber()).to.equal(11)
        })
    });
});


