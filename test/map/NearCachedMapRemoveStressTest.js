var expect = require('chai').expect;
var Promise = require('bluebird');
var Config = require('../../.').Config;
var HazelcastClient = require('../../.').Client;
var Controller = require('../RC');
var fs = require('fs');

describe('NearCachedMapRemoveStress', function () {

    var cluster;
    var client1;
    var mapName = 'stressncmap';

    before(function () {
        var cfg = new Config.ClientConfig();
        var ncc = new Config.NearCacheConfig();
        ncc.name = 'nc-map';
        ncc.invalidateOnChange = true;
        cfg.nearCacheConfigs['ncc-map'] = ncc;
        return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8')).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function (member) {
            return HazelcastClient.newHazelcastClient(cfg).then(function (hazelcastClient) {
                client1 = hazelcastClient;
            });
        });
    });

    after(function () {
        client1.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    function getRandomInt(lowerLim, upperLim) {
        return Math.floor(Math.random() * (upperLim - lowerLim)) + lowerLim;
    }

    function fireGet(numFires, lowerKeyLim, upperKeyLim) {
        var promises = [];
        for (var i = 0; i < numFires; i++) {
            promises.push(client1.getMap(mapName).get(''+getRandomInt(lowerKeyLim, upperKeyLim)));
        }
        return Promise.all(promises);
    }

    function fireRemoveAndGet(numFires, lowerKeyLim, upperKeyLim) {
        var promises = [];
        for (var i = 0; i < numFires; i++) {
            (function () {
                var key = '' + getRandomInt(lowerKeyLim, upperKeyLim);
                var p = client1.getMap(mapName).remove(key).then(function () {
                    return client1.getMap(mapName).get(key);
                }).then(function (value) {
                    return expect(value).to.be.null;
                });
                promises.push(p);
            })();
        }
        return Promise.all(promises);
    }

    var totalNumKeys = 50000;

    function step() {
        var interval = 300;
        var lowerKey = getRandomInt(0, totalNumKeys - interval);
        var gets = fireGet(getRandomInt(0, 300), lowerKey, lowerKey + interval);
        var removes = fireRemoveAndGet(getRandomInt(0, 300), lowerKey, lowerKey + interval);
        return Promise.all([gets, removes]);
    }

    it('get does not read removed item', function (done) {
        this.timeout(50000);
        var rounds = 1000;
        var map = client1.getMap(mapName);
        var putPromises = [];
        for (var i = 0; i < totalNumKeys; i++) {
            putPromises.push(map.put('' + i, 'val'));
        }
        Promise.all(putPromises).then(function () {
            var prevStep = Promise.resolve();
            for (var i = 0; i < rounds; i++) {
                prevStep = prevStep.then(step);
            }
            prevStep.then(function () {
                done();
            }).catch(function (reason) {
                done(reason);
            });
        });
    });
});
