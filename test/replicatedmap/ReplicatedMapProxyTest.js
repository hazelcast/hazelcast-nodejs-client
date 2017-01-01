var expect = require('chai').expect;
var HazelcastClient = require('../../lib/index.js').Client;
var Controller = require('./../RC');
var Util = require('./../Util');
var fs = require('fs');

describe('ReplicatedMap Proxy', function () {

    var cluster;
    var client;
    var rm;
    var ONE_HOUR = 3600000;

    before(function () {
        this.timeout(10000);
        var config = fs.readFileSync(__dirname + '/hazelcast_replicatedmap.xml', 'utf8');
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
        rm = client.getReplicatedMap('test')
    });

    afterEach(function () {
        return rm.destroy();
    });

    after(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('puts one entry and gets one entry', function () {
        return rm.put('key', 'value', ONE_HOUR)
            .then(function () {
                return rm.get('key')
            })
            .then(function (val) {
                expect(val).to.equal('value');
            });
    });

    it('should contain the key', function () {
        return rm.put('key', 'value', ONE_HOUR)
            .then(function (val) {
                return rm.containsKey('key')
            })
            .then(function (res) {
                expect(res).to.equal(true);
            });
    });

    // TODO(zemd): need to be verified separately due to strange NullPointerException from the server
    // it('should not contain the key', function () {
    //     return rm.containsKey('key')
    //         .then(function (res) {
    //             expect(res).to.equal(false);
    //         });
    // });

    it('should contain the value', function () {
        return rm.put('key', 'value', ONE_HOUR)
            .then(function () {
                return rm.containsValue('value')
            })
            .then(function (res) {
                expect(res).to.equal(true);
            });
    });

    it('should not contain the value', function () {
        return rm.containsValue('value')
            .then(function (res) {
                expect(res).to.equal(false);
            });
    });

    it('putting items into the map should increase it\'s size', function () {
        return rm.put('key', 'value', ONE_HOUR)
            .then(function () {
                return rm.size()
            })
            .then(function (size) {
                expect(size).to.equal(1);
            });
    });

    it('returns isEmpty true if map is empty', function () {
        return rm.isEmpty()
            .then(function (res) {
                expect(res).to.equal(true);
            });
    });

    it('returns isEmpty false if map is not empty', function () {
        return rm.put('key', 'value', ONE_HOUR)
            .then(function () {
                return rm.isEmpty()
            })
            .then(function (res) {
                expect(res).to.equal(false);
            });
    });

    it('removes entry from map', function () {
        return rm.put('key', 'value', ONE_HOUR)
            .then(function () {
                return rm.containsKey('key')
            })
            .then(function (contains) {
                expect(contains).to.equal(true);
                return rm.remove('key')
            })
            .then(function () {
                return rm.containsKey('key')
            })
            .then(function (contains) {
                expect(contains).to.equal(false);
            });
    });
});
