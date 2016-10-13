var expect = require("chai").expect;
var HazelcastClient = require("../../lib/index.js").Client;
var Controller = require('./../RC');
var Util = require('./../Util');
var fs = require('fs');

var Promise = require('bluebird');

describe("Ringbuffer Proxy", function () {

    var cluster;
    var client;
    var rb;

    before(function () {
        this.timeout(10000);
        var config = fs.readFileSync(__dirname + '/hazelcast_ringbuffer.xml', 'utf8');
        return Controller.createCluster(null, config).then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function () {
        rb = client.getRingbuffer('test')
    });

    afterEach(function () {
        return rb.destroy();
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });


    it("adds one item and reads back", function () {
        return rb.add(1).then(function (sequence) {
            return rb.readOne(sequence).then(function (item) {
                expect(item).to.equal(1);
            });
        })
    });

    it("adds multiple items and reads them back one by one", function () {
        return rb.addAll([1, 2, 3]).then(function () {
            return Promise.all([
                rb.readOne(0), rb.readOne(1), rb.readOne(2)
            ]).then(function (items) {
                expect(items).to.deep.equal([1, 2, 3]);
            });
        })
    });


    it("reads all items at once", function () {
        return rb.addAll([1, 2, 3]).then(function () {
            return rb.readMany(0, 1, 3).then(function (items) {
                expect(items).to.deep.equal([1, 2, 3]);
            });
        })
    });

    it("correctly reports tail sequence", function () {
        return rb.addAll([1, 2, 3]).then(function () {
            return rb.tailSequence().then(function (sequence) {
                expect(sequence.toNumber()).to.equal(2);
            });
        })
    });

    it("correctly reports head sequence", function () {
        var limitedCapacity = client.getRingbuffer("capacity");
        return limitedCapacity.addAll([1, 2, 3, 4, 5]).then(function () {
            return limitedCapacity.headSequence().then(function (sequence) {
                expect(sequence.toNumber()).to.equal(2);
            });
        })
    });

    it("correctly reports remaining capacity", function () {
        var ttl = client.getRingbuffer("ttl-cap");
        return ttl.addAll([1, 2]).then(function () {
            return ttl.remainingCapacity().then(function (rc) {
                expect(rc.toNumber()).to.equal(3);
            });
        })
    });

    it("correctly reports total capacity", function () {
        var ttl = client.getRingbuffer("ttl-cap");
        return ttl.capacity().then(function (capacity) {
            expect(capacity.toNumber()).to.equal(5);
        });
    });


    it("correctly reports size", function () {
        return rb.addAll([1, 2]).then(function () {
            return rb.size().then(function (size) {
                expect(size.toNumber()).to.equal(2);
            });
        })
    });



});
