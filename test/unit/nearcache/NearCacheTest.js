/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const { DataRecord } = require('../../../lib/nearcache/DataRecord');
const { NearCacheImpl } = require('../../../lib/nearcache/NearCache');
const { EvictionPolicy, InMemoryFormat } = require('../../../');
const { SerializationServiceV1 } = require('../../../lib/serialization/SerializationService');
const { NearCacheConfigImpl } = require('../../../lib/config/NearCacheConfig');
const { SerializationConfigImpl } = require('../../../lib/config/SerializationConfig');
const { promiseLater } = require('../../TestUtil');

describe('NearCacheTest', function () {

    const invalidateOnChange = [false, true];
    const ttls = [0, 1];
    const evictionPolicy = [EvictionPolicy.LFU, EvictionPolicy.LRU, EvictionPolicy.RANDOM, EvictionPolicy.NONE];
    const testConfigs = [];
    evictionPolicy.forEach(function (evictionPolicy) {
        invalidateOnChange.forEach(function (ioc) {
            ttls.forEach(function (ttl) {
                const testConfig = new NearCacheConfigImpl();
                testConfig.invalidateOnChange = ioc;
                testConfig.timeToLiveSeconds = ttl;
                testConfig.evictionMaxSize = 100;
                testConfig.evictionPolicy = evictionPolicy;
                testConfigs.push(testConfig);
            });
        });
    });

    function ds(str) {
        return {
            val: str,
            hashCode: function () {
                return str[0] - 'a';
            },
            equals(other) {
                return this.val === other.val;
            }
        };
    }

    function createSerializationService() {
        const cfg = new SerializationConfigImpl();
        return new SerializationServiceV1(cfg);
    }

    async function promiseBefore(boundaryInSec, func) {
        return promiseLater(boundaryInSec * 250, func);
    }

    async function promiseAfter(boundaryInSec, func) {
        return promiseLater(boundaryInSec * 1500, func);
    }

    describe('CacheRecord', function () {

        it('does not expire if ttl is 0', function (done) {
            const rec = new DataRecord(ds('key'), 'value', undefined, 0);
            setTimeout(function () {
                if (rec.isExpired()) {
                    done(new Error('Unlimited ttl record expired'));
                } else {
                    done();
                }
            }, 1000);
        });

        it('expires after ttl', function (done) {
            const rec = new DataRecord(ds('key'), 'value', undefined, 1);
            setTimeout(function () {
                if (rec.isExpired()) {
                    done();
                } else {
                    done(new Error('Record did not expire after ttl'));
                }
            }, 1100);
        });

        it('does not expire before ttl', function (done) {
            const rec = new DataRecord(ds('key'), 'value', undefined, 10);
            setTimeout(function () {
                if (rec.isExpired()) {
                    done(new Error('Record expired before ttl'));
                } else {
                    done();
                }
            }, 100);
        });

        it('expires after maxIdleSeconds', function (done) {
            const rec = new DataRecord(ds('key'), 'value', undefined, 100);
            setTimeout(function () {
                if (rec.isExpired(1)) {
                    done();
                } else {
                    done(new Error('did not expire after maxIdleSeconds'));
                }
            }, 2000);
        });

        it('does not expire while active', function (done) {
            const rec = new DataRecord(ds('key'), 'value', undefined, 100);
            setTimeout(function () {
                rec.setAccessTime();
                if (rec.isExpired(1)) {
                    done(new Error('expired'));
                } else {
                    done();
                }
            }, 100);
        });
    });

    testConfigs.forEach(function (testConfig) {

        describe(testConfig.toString(), function () {
            let nearCache;

            beforeEach(function () {
                nearCache = new NearCacheImpl(testConfig, createSerializationService());
                nearCache.setReady();
            });

            it('simple put/get', async function () {
                nearCache.put(ds('key'), 'val');
                const res = await nearCache.get(ds('key'));
                expect(res).to.equal('val');
            });

            it('returns undefined for non existing value', async function () {
                await nearCache.get(ds('random'));
                expect(nearCache.getStatistics().missCount).to.equal(1);
            });

            it('record does not expire if ttl is 0', async function () {
                if (nearCache.timeToLiveSeconds !== 0) {
                    this.skip();
                }
                nearCache.put(ds('key'), 'val');
                return expect(promiseAfter(testConfig.timeToLiveSeconds, nearCache.get.bind(nearCache, ds('key'))))
                    .to.eventually.equal('val');
            });

            it('ttl expire', async function () {
                if (nearCache.timeToLiveSeconds === 0) {
                    this.skip();
                }
                nearCache.put(ds('key'), 'val');
                return expect(promiseAfter(testConfig.timeToLiveSeconds, nearCache.get.bind(nearCache, ds('key'))))
                    .to.eventually.be.undefined;
            });

            it('ttl does not expire early', async function () {
                nearCache.put(ds('key'), 'val');
                return expect(promiseBefore(testConfig.timeToLiveSeconds, nearCache.get.bind(nearCache, ds('key'))))
                    .to.eventually.equal('val');
            });

            it('evicted after maxIdleSeconds', async function () {
                if (nearCache.maxIdleSeconds === 0) {
                    this.skip();
                }
                nearCache.put(ds('key'), 'val');
                return expect(promiseAfter(testConfig.maxIdleSeconds, nearCache.get.bind(nearCache, ds('key'))))
                    .to.eventually.be.undefined;
            });

            it('not evicted after maxIdleSeconds if maxIdleSeconds is 0(unlimited)', async function () {
                if (nearCache.maxIdleSeconds !== 0) {
                    this.skip();
                }
                nearCache.put(ds('key'), 'val');
                return expect(promiseAfter(testConfig.maxIdleSeconds, nearCache.get.bind(nearCache, ds('key'))))
                    .to.eventually.equal('val');
            });

            it('not evicted before maxIdleSeconds', async function () {
                nearCache.put(ds('key'), 'val');
                return expect(promiseBefore(testConfig.maxIdleSeconds, nearCache.get.bind(nearCache, ds('key'))))
                    .to.eventually.equal('val');
            });

            it('evicts entries after eviction max size is reached', function () {
                if (nearCache.evictionPolicy === EvictionPolicy.NONE) {
                    this.skip();
                }
                for (let i = 0; i < nearCache.evictionMaxSize + 1; i++) {
                    nearCache.put(ds('k' + i), 'v' + i);
                }
                expect(nearCache.getStatistics().evictedCount).to.equal(1);
                expect(nearCache.getStatistics().entryCount).to.equal(100);
            });

            it('no need for eviction when some entries are already expired', function (done) {
                if (nearCache.evictionPolicy === EvictionPolicy.NONE || nearCache.timeToLiveSeconds === 0) {
                    this.skip();
                }
                for (let i = 0; i < nearCache.evictionMaxSize; i++) {
                    nearCache.put(ds('k' + i), 'v' + i);
                }
                promiseAfter(nearCache.timeToLiveSeconds, function () {
                    try {
                        nearCache.put(ds('laterentry'), 'laterval');
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

        it('Object', function () {
            const nearCacheConfig = new NearCacheConfigImpl();
            nearCacheConfig.inMemoryFormat = InMemoryFormat.OBJECT;
            const nearCache = new NearCacheImpl(nearCacheConfig, createSerializationService());
            nearCache.put(ds('k'), 'v');
            expect(nearCache.internalStore.get(ds('k')).value).to.be.a('string');
        });

        it('Binary', function () {
            const nearCacheConfig = new NearCacheConfigImpl();
            nearCacheConfig.inMemoryFormat = InMemoryFormat.BINARY;
            const nearCache = new NearCacheImpl(nearCacheConfig, createSerializationService());
            nearCache.put(ds('k'), 'v');
            expect(nearCache.internalStore.get(ds('k')).value).to.not.be.a('string');
        });
    });
});
