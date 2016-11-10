var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;
var Config = require('../../.').Config;
var Controller = require('../RC');
var HazelcastClient = require('../../.').Client;
var DataRecord = require('../../lib/NearCache').DataRecord;
var NearCache = require('../../lib/NearCache').NearCache;
var EvictionPolicy = Config.EvictionPolicy;
var promiseLater = require('../Util').promiseLater;
var SerializationService = require('../../lib/serialization/SerializationService').SerializationServiceV1;
describe('NearCache', function() {
    var cluster;
    var client;

    var invalidateOnChange = [false, true];
    var ttls = [0, 1];
    var evictionPolicy = [EvictionPolicy.LFU, EvictionPolicy.LRU, EvictionPolicy.RANDOM, EvictionPolicy.NONE];

    var testConfigs = [];

    evictionPolicy.forEach(function (evictionPolicy) {
        invalidateOnChange.forEach(function (ioc) {
            ttls.forEach(function (ttl) {
                var ncc = new Config.NearCacheConfig();
                ncc.invalidateOnChange = ioc;
                ncc.timeToLiveSeconds = ttl;
                ncc.evictionMaxSize = 100;
                ncc.evictionPolicy = evictionPolicy;
                testConfigs.push(ncc);
            });
        });
    });

    before(function() {
        return Controller.createCluster(null, null).then(function(res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient();
        }).then(function (cl) {
            client = cl;
        });
    });

    after(function() {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    describe('CacheRecord', function () {

        it('does not expire if ttl is 0', function (done) {
            var rec = new DataRecord('key', 'value', undefined, 0);
            setTimeout(function () {
                if (rec.isExpired()) {
                    done('Unlimited ttl record expired');
                } else {
                    done();
                }
            }, 1000);
        });

        it('expires after ttl', function (done) {
            var rec = new DataRecord('key', 'value', undefined, 1);
            setTimeout(function () {
                if (rec.isExpired()) {
                    done();
                } else {
                    done('Record did not expire after ttl');
                }
            }, 1000);
        });

        it('does not expire before ttl', function (done) {
            var rec = new DataRecord('key', 'value', undefined, 10);
            setTimeout(function () {
                if (rec.isExpired()) {
                    done('Record expired before ttl');
                } else {
                    done();
                }
            }, 100);
        });

        it('expires after maxIdleSeconds', function(done) {
            this.timeout(4000);
            var rec = new DataRecord('key', 'value', undefined, 100);
            setTimeout(function () {
                if (rec.isExpired(1)) {
                    done();
                } else {
                    done('did not expire after maxIdleSeconds');
                }
            }, 2000);
        });

        it('does not expire while active', function(done) {
            var rec = new DataRecord('key', 'value', undefined, 100);
            setTimeout(function () {
                rec.setAccessTime();
                if (rec.isExpired(1)) {
                    done('expired');
                } else {
                    done();
                }
            }, 100);
        });
    });

    testConfigs.forEach(function (testConfig) {

        describe(testConfig.toString(), function () {

            var nearCache;

            beforeEach(function () {
                nearCache = new NearCache(testConfig, createSerializationService());
            });


            it('simple put/get', function () {
                nearCache.put('key', 'val');
                return expect(nearCache.get('key')).to.equal('val');
            });


            it('returns undefined for non existing value', function () {
                nearCache.get('random');
                return expect(nearCache.getStatistics().missCount).to.equal(1);
            });

            it('record does not expire if ttl is 0', function () {
                if (nearCache.timeToLiveSeconds != 0) {
                    this.skip();
                }
                nearCache.put('key', 'val');
                return expect(promiseAfter(testConfig.timeToLiveSeconds, nearCache.get.bind(nearCache, 'key'))).to.eventually.equal('val');
            });

            it('ttl expire', function () {
                if (nearCache.timeToLiveSeconds == 0) {
                    this.skip();
                }
                nearCache.put('key', 'val');
                return expect(promiseAfter(testConfig.timeToLiveSeconds, nearCache.get.bind(nearCache, 'key'))).to.eventually.be.undefined;
            });

            it('ttl does not expire early', function() {
                nearCache.put('key', 'val');
                return expect(promiseBefore(testConfig.timeToLiveSeconds, nearCache.get.bind(nearCache, 'key'))).to.eventually.equal('val');
            });

            it('evicted after maxIdleSeconds', function() {
                if (nearCache.maxIdleSeconds == 0) {
                    this.skip();
                }
                nearCache.put('key', 'val');
                return expect(promiseAfter(testConfig.maxIdleSeconds, nearCache.get.bind(nearCache, 'key'))).to.eventually.be.undefined;
            });

            it('not evicted after maxIdleSeconds if maxIdleSeconds is 0(unlimited)', function() {
                if (nearCache.maxIdleSeconds != 0) {
                    this.skip();
                }
                nearCache.put('key', 'val');
                return expect(promiseAfter(testConfig.maxIdleSeconds, nearCache.get.bind(nearCache, 'key'))).to.eventually.equal('val');
            });

            it('not evicted before maxIdleSeconds', function() {
                nearCache.put('key', 'val');
                return expect(promiseBefore(testConfig.maxIdleSeconds, nearCache.get.bind(nearCache, 'key'))).to.eventually.equal('val');
            });

            it('evicts entries after eviction max size is reached', function () {
                if (nearCache.evictionPolicy == EvictionPolicy.NONE){
                    this.skip();
                }
                var i;
                for (i = 0; i<nearCache.evictionMaxSize + 1; i++) {
                    nearCache.put('k' + i, 'v' + i);
                }
                expect(nearCache.getStatistics().evictedCount).to.equal(1);
                expect(nearCache.getStatistics().entryCount).to.equal(100);
            });

            it('no need for eviction when some entries are already expired', function (done) {
                if (nearCache.evictionPolicy === EvictionPolicy.NONE || nearCache.timeToLiveSeconds === 0){
                    this.skip();
                }
                var i;
                for (i = 0; i<nearCache.evictionMaxSize; i++) {
                    nearCache.put('k' + i, 'v' + i);
                }
                promiseAfter(nearCache.timeToLiveSeconds, function() {
                    try {
                        nearCache.put('laterentry', 'laterval');
                        expect(nearCache.getStatistics().evictedCount).to.equal(0);
                        expect(nearCache.getStatistics().expiredCount).to.greaterThan(0);
                        expect(nearCache.getStatistics().entryCount).to.lessThan(100);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    describe('InMemory format', function () {

        it('Object', function() {
            var nearCacheConfig = new Config.NearCacheConfig();
            nearCacheConfig.inMemoryFormat = Config.InMemoryFormat.OBJECT;
            var nearCache = new NearCache(nearCacheConfig, createSerializationService());
            nearCache.put('k', 'v');
            expect(nearCache.internalStore.get('k').value).to.be.a('string');
        });

        it('Binary', function() {
            var nearCacheConfig = new Config.NearCacheConfig();
            nearCacheConfig.inMemoryFormat = Config.InMemoryFormat.BINARY;
            var nearCache = new NearCache(nearCacheConfig, createSerializationService());
            nearCache.put('k', 'v');
            expect(nearCache.internalStore.get('k').value).to.not.be.a('string');
        });
    });

    function createSerializationService() {
        var cfg = new Config.ClientConfig().serializationConfig;
        return new SerializationService(cfg);
    }

    function promiseBefore(boundaryInSec, func) {
        return promiseLater(boundaryInSec * 250, func);
    }

    function promiseAfter(boundaryInSec, func) {
        return promiseLater(boundaryInSec * 1500, func);
    }

});
