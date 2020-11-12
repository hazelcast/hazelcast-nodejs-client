/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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
var HazelcastClient = require("../../.").Client;
var Controller = require('./../RC');
var Util = require('./../Util');
var Config = require('../../.').Config;
var fs = require('fs');
var _fillMap = require('../Util').fillMap;


describe('NearCachedMapTest', function () {

    [true, false].forEach(function (invalidateOnChange) {
        describe('invalidate on change=' + invalidateOnChange, function () {
            var cluster;
            var client1;
            var client2;
            var map1;
            var map2;

            before(function () {
                this.timeout(32000);
                var cfg = new Config.ClientConfig();
                var ncc = new Config.NearCacheConfig();
                ncc.name = 'nc-map';
                ncc.invalidateOnChange = invalidateOnChange;
                cfg.nearCacheConfigs['ncc-map'] = ncc;
                return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8')).then(function (res) {
                    cluster = res;
                    return Controller.startMember(cluster.id);
                }).then(function (member) {
                    return HazelcastClient.newHazelcastClient(cfg).then(function (hazelcastClient) {
                        client1 = hazelcastClient;
                    });
                }).then(function () {
                    return HazelcastClient.newHazelcastClient(cfg).then(function (hazelcastClient) {
                        client2 = hazelcastClient;
                    });
                });
            });

            beforeEach(function () {
                this.timeout(10000);
                return client1.getMap('ncc-map').then(function (mp) {
                    map1 = mp
                    return client2.getMap('ncc-map');
                }).then(function (mp) {
                    map2 = mp;
                    return _fillMap(map1);
                });
            });

            afterEach(function () {
                return map1.destroy();
            });

            after(function () {
                client1.shutdown();
                client2.shutdown();
                return Controller.shutdownCluster(cluster.id);
            });

            function getNearCacheStats(map) {
                return map.nearCache.getStatistics();
            }

            function expectStats(map, hit, miss, entryCount) {
                var stats = getNearCacheStats(map);
                expect(stats.hitCount).to.equal(hit);
                expect(stats.missCount).to.equal(miss);
                return expect(stats.entryCount).to.equal(entryCount);
            }

            it('second get should hit', function () {
                return map1.get('key0').then(function () {
                    return map1.get('key0');
                }).then(function (val) {
                    var stats = getNearCacheStats(map1);
                    expect(val).to.equal('val0');
                    expect(stats.missCount).to.equal(1);
                    expect(stats.entryCount).to.equal(1);
                    expect(stats.hitCount).to.equal(1);
                })
            });

            it('remove operation removes entry from near cache', function () {
                return map1.get('key1').then(function () {
                    return map1.remove('key1');
                }).then(function () {
                    return map1.get('key1');
                }).then(function (val) {
                    var stats = getNearCacheStats(map1);
                    expect(val).to.be.null;
                    expect(stats.hitCount).to.equal(0);
                    expect(stats.missCount).to.equal(2);
                    expect(stats.entryCount).to.equal(1);
                });
            });

            it('update invalidates the near cache', function () {
                return map1.get('key1').then(function () {
                    return map1.put('key1', 'something else');
                }).then(function () {
                    return map1.get('key1');
                }).then(function (val) {
                    var stats = getNearCacheStats(map1);
                    expect(val).to.be.equal('something else');
                    expect(stats.hitCount).to.equal(0);
                    expect(stats.missCount).to.equal(2);
                    expect(stats.entryCount).to.equal(1);
                });
            });

            it('get returns null if the entry was removed by another client', function () {
                if (!invalidateOnChange) {
                    this.skip();
                }
                return map1.get('key1').then(function () {
                    return map2.remove('key1');
                }).then(function () {
                    return Util.promiseLater(1000, map1.get.bind(map1, 'key1'));
                }).then(function (val) {
                    expectStats(map1, 0, 2, 1);
                    return expect(val).to.be.null;
                });
            });

            it('clear clears nearcache', function () {
                return map1.get('key1').then(function () {
                    return map1.clear();
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });

            it('containsKey true(in near cache)', function () {
                return map1.get('key1').then(function () {
                    return map1.containsKey('key1');
                }).then(function (c) {
                    expectStats(map1, 1, 1, 1);
                    return expect(c).to.be.true;
                });
            });

            it('containsKey false(in near cache)', function () {
                return map1.get('exx').then(function () {
                    return map1.containsKey('exx');
                }).then(function (c) {
                    expectStats(map1, 1, 1, 1);
                    return expect(c).to.be.false;
                });
            });

            it('containsKey true', function () {
                return map1.containsKey('key1').then(function (c) {
                    expectStats(map1, 0, 1, 0);
                    return expect(c).to.be.true;
                });
            });

            it('containsKey false', function () {
                return map1.containsKey('exx').then(function (c) {
                    expectStats(map1, 0, 1, 0);
                    return expect(c).to.be.false;
                });
            });

            it('delete invalidates the cache', function () {
                return map1.get('key1').then(function () {
                    return map1.delete('key1');
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });

            it('evictAll evicts near cache', function () {
                return map1.get('key1').then(function () {
                    return map1.evictAll();
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });

            it('evict evicts the entry', function () {
                return map1.getAll(['key1', 'key2']).then(function () {
                    return map1.evict('key1');
                }).then(function () {
                    return expectStats(map1, 0, 2, 1);
                });
            });

            it('getAll', function () {
                return map1.getAll(['key1', 'key2']).then(function (vals) {
                    expect(vals).to.deep.have.members([
                        ['key1', 'val1'],
                        ['key2', 'val2']
                    ]);
                    return expectStats(map1, 0, 2, 2);
                });
            });

            it('getAll second call should hit', function () {
                return map1.getAll(['key1', 'key2']).then(function (vals) {
                    return map1.getAll(['key1', 'key2', 'key3']);
                }).then(function (vals) {
                    expect(vals).to.deep.have.members([
                        ['key1', 'val1'],
                        ['key2', 'val2'],
                        ['key3', 'val3']
                    ]);
                    return expectStats(map1, 2, 3, 3);
                });
            });

            it('executeOnKey invalidates the entry');

            it('executeOnKeys invalidates entries');

            it('loadAll invalidates the cache');

            it('putAll invalidates entries', function () {
                return map1.getAll(['key1', 'key2']).then(function () {
                    return map1.putAll([
                        ['key1', 'newVal1'],
                        ['key2', 'newVal2']
                    ]);
                }).then(function () {
                    return expectStats(map1, 0, 2, 0);
                });
            });

            it('putIfAbsent (existing key) invalidates the entry', function () {
                return map1.get('key1').then(function () {
                    return map1.putIfAbsent('key1', 'valnew');
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });

            it('putTransient invalidates the entry', function () {
                return map1.get('key1').then(function () {
                    return map1.putTransient('key1', 'vald');
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });

            it('replace invalidates the entry', function () {
                return map1.get('key1').then(function () {
                    return map1.replace('key1', 'newVal');
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });

            it('replaceIfSame invalidates the entry', function () {
                return map1.get('key1').then(function () {
                    return map1.replaceIfSame('key1', 'val1', 'newVal');
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });

            it('set invalidates the entry', function () {
                return map1.get('key1').then(function () {
                    return map1.set('key1', 'newVal');
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });

            it('tryPut invalidates the entry', function () {
                return map1.get('key1').then(function () {
                    return map1.tryPut('key1', 'newVal', 1000);
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });

            it('tryRemove invalidates the entry', function () {
                return map1.get('key1').then(function () {
                    return map1.tryRemove('key1', 1000);
                }).then(function () {
                    return expectStats(map1, 0, 1, 0);
                });
            });
        });
    });
});
