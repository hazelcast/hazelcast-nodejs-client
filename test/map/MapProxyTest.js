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
var HazelcastClient = require("../../").Client;
var Predicates = require("../../").Predicates;
var Config = require('../../').Config;
var Promise = require("bluebird");
var Controller = require('./../RC');
var Util = require('./../Util');
var fs = require('fs');
var _fillMap = require('../Util').fillMap;


function createController(nearCacheEnabled) {
    if (nearCacheEnabled) {
        return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8'))
    } else {
        return Controller.createCluster(null, null);
    }
}

function createClient(nearCacheEnabled) {
    if (nearCacheEnabled) {
        var cfg = new Config.ClientConfig();
        var ncc = new Config.NearCacheConfig();
        ncc.name = 'test';
        ncc.timeToLiveSeconds = 1;
        cfg.nearCacheConfigs['test'] = ncc;
        return HazelcastClient.newHazelcastClient(cfg);
    } else {
        return HazelcastClient.newHazelcastClient()
    }
}

describe('MapProxy', function () {
    [false, true].forEach(function (nearCacheEnabled) {

        describe("Near Cache: " + nearCacheEnabled, function () {

            var cluster;
            var client;
            var map;

            before(function () {
                this.timeout(32000);
                return createController(nearCacheEnabled).then(function (res) {
                    cluster = res;
                    return Controller.startMember(cluster.id);
                }).then(function (m) {
                    return createClient(nearCacheEnabled).then(function (hazelcastClient) {
                        client = hazelcastClient;
                    });
                });
            });

            beforeEach(function () {
                return client.getMap('test').then(function (mp) {
                    map = mp;
                    return _fillMap(map);
                });
            });

            afterEach(function () {
                return map.destroy();
            });

            after(function () {
                client.shutdown();
                return Controller.shutdownCluster(cluster.id);
            });

            function _generateLockScript(mapName, keyName) {
                return 'function lockByServer() {' +
                    '   var map = instance_0.getMap("' + mapName + '");' +
                    '   map.lock(' + keyName + ');' +
                    '   return map.isLocked(' + keyName + ');' +
                    '}' +
                    'result=""+lockByServer();';
            }

            function _generateUnlockScript(mapName, keyName) {
                return 'function lockByServer() {' +
                    '   var map = instance_0.getMap("' + mapName + '");' +
                    '   map.unlock(' + keyName + ');' +
                    '   return map.isLocked(' + keyName + ');' +
                    '}' +
                    'result=""+lockByServer();';
            }

            it('get_basic', function () {
                return map.get('key0').then(function (v) {
                    return expect(v).to.equal('val0');
                })
            });

            it('get_return_null_on_non_existent', function () {
                return map.get('non-existent').then(function (val) {
                    return expect(val).to.be.null;
                });
            });

            it('put_return_value_not_null', function () {
                return map.put('key0', 'new-val').then(function (val) {
                    return expect(val).to.equal('val0');
                });
            });

            it('put with ttl puts value to map', function () {
                return map.put('key-with-ttl', 'val-with-ttl', 3000).then(function () {
                    return map.get('key-with-ttl').then(function (val) {
                        return expect(val).to.equal('val-with-ttl');
                    });
                });
            });

            it('put with ttl removes value after ttl', function () {
                return map.put('key10', 'val10', 1000).then(function () {
                    return map.get('key10');
                }).then(function (val) {
                    return expect(val).to.equal('val10');
                }).then(function () {
                    return Util.promiseLater(1100, map.get.bind(map, 'key10'));
                }).then(function (val) {
                    return expect(val).to.be.null;
                });
            });

            it('clear', function () {
                return map.clear().then(function () {
                    return map.isEmpty();
                }).then(function (val) {
                    return expect(val).to.be.true;
                });
            });

            it('size', function () {
                return map.size().then(function (size) {
                    expect(size).to.equal(10);
                })
            });

            it('basic_remove_return_value', function () {
                return map.remove('key9').then(function (val) {
                    return expect(val).to.equal('val9');
                });
            });

            it('basic_remove', function () {
                return map.remove('key1').then(function () {
                    return map.get('key1');
                }).then(function (val) {
                    return expect(val).to.be.null;
                });
            });

            it('remove_if_equal_false', function () {
                return map.remove('key1', 'wrong').then(function (val) {
                    return expect(val).to.be.false;
                });
            });

            it('remove_if_equal_true', function () {
                return map.remove('key1', 'val1').then(function (val) {
                    return expect(val).to.be.true;
                });
            });

            it('containsKey_true', function () {
                return map.containsKey('key1').then(function (val) {
                    return expect(val).to.be.true;
                });
            });

            it('containsKey_false', function () {
                return map.containsKey('non-existent').then(function (val) {
                    return expect(val).to.be.false;
                });
            });

            it('containsValue_true', function () {
                return map.containsValue('val1').then(function (val) {
                    return expect(val).to.be.true;
                });
            });

            it('containsValue_false', function () {
                return map.containsValue('non-existent').then(function (val) {
                    return expect(val).to.be.false;
                });
            });

            it('putAll', function (done) {
                var arr = [
                    ['pa_k0', 'pa_v0'],
                    ['pa_k1', 'pa_v1'],
                    ['pa_k2', 'pa_v2'],
                    ['pa_k3', 'pa_v3'],
                    ['pa_k4', 'pa_v4']
                ];
                var returnedCorrectly = 0;
                var verify = function (expected) {
                    return function (val) {
                        try {
                            expect(val).to.equal(expected);
                            returnedCorrectly++;
                            if (returnedCorrectly === 5) {
                                done();

                            }
                        } catch (e) {
                            done(e);
                        }
                    };
                };
                map.putAll(arr).then(function () {
                    map.get(arr[0][0]).then(verify(arr[0][1]));
                    map.get(arr[1][0]).then(verify(arr[1][1]));
                    map.get(arr[2][0]).then(verify(arr[2][1]));
                    map.get(arr[3][0]).then(verify(arr[3][1]));
                    map.get(arr[4][0]).then(verify(arr[4][1]));
                })
            });

            it('getAll', function () {
                return map.getAll([
                    'key0', 'key1', 'key2', 'key3', 'key4',
                    'key5', 'key6', 'key7', 'key8', 'key9'
                ]).then(function (values) {
                    return expect(values).to.deep.have.members([
                        ['key0', 'val0'], ['key1', 'val1'],
                        ['key2', 'val2'], ['key3', 'val3'],
                        ['key4', 'val4'], ['key5', 'val5'],
                        ['key6', 'val6'], ['key7', 'val7'],
                        ['key8', 'val8'], ['key9', 'val9']
                    ]);
                })
            });

            it('delete', function () {
                return map.put('key-to-delete', 'value').then(function () {
                    return map.delete('key-to-delete');
                }).then(function () {
                    return map.get('key-to-delete');
                }).then(function (val) {
                    return expect(val).to.be.null;
                })
            });

            it('entrySet_notNull', function () {
                var entryMap;

                var samples = [
                    ['k1', 'v1'],
                    ['k2', 'v2'],
                    ['k3', 'v3']
                ];

                return client.getMap('entry-map').then(function (mp) {
                    entryMap = mp;
                    return Promise.all([
                        entryMap.put(samples[0][0], samples[0][1]),
                        entryMap.put(samples[1][0], samples[1][1]),
                        entryMap.put(samples[2][0], samples[2][1])
                    ]);
                }).then(function () {
                    return entryMap.entrySet();
                }).then(function (entrySet) {
                    return expect(entrySet).to.deep.have.members(samples);
                });
            });

            it('entrySet_null', function () {
                var entryMap;
                return client.getMap('null-entry-map').then(function (mp) {
                    entryMap = mp;
                    return entryMap.entrySet();
                }).then(function (entrySet) {
                    return expect(entrySet).to.be.empty;
                });
            });

            it('flush', function () {
                return map.flush();
            });

            it('lock', function () {
                return map.lock('key0').then(function () {
                    return map.isLocked('key0');
                }).then(function (isLocked) {
                    return expect(isLocked).to.be.true;
                }).finally(function () {
                    return map.unlock('key0');
                });
            });

            it('unlock', function () {
                return map.lock('key0').then(function () {
                    return map.unlock('key0');
                }).then(function () {
                    return map.isLocked('key0');
                }).then(function (isLocked) {
                    return expect(isLocked).to.be.false;
                });
            });

            it('forceUnlock', function () {
                var script =
                    'function lockByServer() {' +
                    '   var map = instance_0.getMap("' + map.getName() + '");' +
                    '   map.lock("key0");' +
                    '   return map.isLocked("key0")' +
                    '}' +
                    'result=""+lockByServer();';
                return Controller.executeOnController(cluster.id, script, 1).then(function (s) {
                    return map.forceUnlock('key0');
                }).then(function () {
                    return map.isLocked('key0');
                }).then(function (isLocked) {
                    return expect(isLocked).to.be.false;
                });
            });

            it('keySet', function () {
                return map.keySet().then(function (keySet) {
                    return expect(keySet).to.deep.have.members([
                        'key0', 'key1', 'key2', 'key3', 'key4',
                        'key5', 'key6', 'key7', 'key8', 'key9'
                    ]);
                });
            });

            it('putIfAbsent_success', function () {
                return map.putIfAbsent('key10', 'new-val').then(function (oldVal) {
                    return expect(oldVal).to.be.null;
                }).then(function () {
                    return map.get('key10');
                }).then(function (val) {
                    return expect(val).to.equal('new-val');
                });
            });

            it('putIfAbsent_fail', function () {
                return map.putIfAbsent('key9', 'new-val').then(function () {
                    return map.get('key9');
                }).then(function (val) {
                    return expect(val).to.equal('val9');
                });
            });

            it('putIfAbsent_with_ttl', function () {
                return map.putIfAbsent('key10', 'new-val', 1000).then(function () {
                    return map.get('key10');
                }).then(function (val) {
                    return expect(val).to.equal('new-val');
                }).then(function () {
                    return Util.promiseLater(1050, map.get.bind(map, 'key10'));
                }).then(function (val) {
                    return expect(val).to.be.null;
                });

            });

            it('putTransient', function () {
                return map.putTransient('key10', 'val10').then(function () {
                    return map.get('key10');
                }).then(function (val) {
                    return expect(val).to.equal('val10');
                });
            });

            it('putTransient_withTTL', function () {
                return map.putTransient('key10', 'val10', 1000).then(function () {
                    return map.get('key10');
                }).then(function (val) {
                    return expect(val).to.equal('val10');
                }).then(function () {
                    return Util.promiseLater(1050, map.get.bind(map, 'key10'));
                }).then(function (val) {
                    return expect(val).to.be.null;
                });
            });

            it('replace', function () {
                return map.replace('key9', 'new-val').then(function (oldVal) {
                    return expect(oldVal).to.equal('val9');
                }).then(function () {
                    return map.get('key9');
                }).then(function (val) {
                    return expect(val).to.equal('new-val');
                });
            });

            it('replaceIfSame_success', function () {
                return map.replaceIfSame('key9', 'val9', 'new-val').then(function (success) {
                    return expect(success).to.be.true;
                }).then(function () {
                    return map.get('key9');
                }).then(function (val) {
                    return expect(val).to.equal('new-val');
                });
            });

            it('replaceIfSame_fail', function () {
                return map.replaceIfSame('key9', 'wrong', 'new-val', function (success) {
                    return expect(success).to.be.false;
                }).then(function () {
                    return map.get('key9');
                }).then(function (val) {
                    return expect(val).to.equal('val9');
                });
            });

            it('set', function () {
                return map.set('key10', 'val10').then(function () {
                    return map.get('key10');
                }).then(function (val) {
                    return expect(val).to.equal('val10');
                })
            });

            it('set_withTTL', function () {
                return map.set('key10', 'val10', 1000).then(function () {
                    return map.get('key10');
                }).then(function (val) {
                    return expect(val).to.equal('val10');
                }).then(function () {
                    return Util.promiseLater(1050, map.get.bind(map, 'key10'));
                }).then(function (val) {
                    return expect(val).to.be.null;
                })
            });

            it('values', function () {
                return map.values().then(function (vals) {
                    return expect(vals.toArray()).to.deep.have.members([
                        'val0', 'val1', 'val2', 'val3', 'val4',
                        'val5', 'val6', 'val7', 'val8', 'val9'
                    ]);
                });
            });

            it('values_null', function () {
                return map.clear().then(function () {
                    return map.values();
                }).then(function (vals) {
                    return expect(vals.toArray()).to.have.lengthOf(0);
                })
            });

            it('getEntryView', function (done) {
                map.get('key0').then(function () {
                    return map.getEntryView('key0');
                }).then(function (entry) {
                    try {
                        expect(entry.key).to.equal('key0');
                        expect(entry.value).to.equal('val0');
                        expect(entry.cost.greaterThan(0)).to.be.true;
                        expect(entry.creationTime.isZero()).to.be.false;
                        expect(entry.expirationTime.isZero()).to.be.false;
                        expect(entry.hits.isZero()).to.be.false;
                        expect(entry.lastAccessTime.isZero()).to.be.false;
                        expect(entry.lastStoreTime.isZero()).to.be.true;
                        expect(entry.lastUpdateTime.isZero()).to.be.false;
                        expect(entry.version.isZero()).to.be.true;
                        expect(entry.ttl.isZero()).to.be.false;
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('getEntryView_null', function () {
                return map.getEntryView('non-exist').then(function (entry) {
                    return expect(entry).to.be.null;
                });
            });

            it('addIndex', function () {
                return Promise.all([
                    map.addIndex('length', false),
                    map.addIndex('length', true)
                ]);
            });

            it('tryLock_success', function () {
                return map.tryLock('key0').then(function (success) {
                    return expect(success).to.be.true;
                });
            });

            it('tryLock_fail', function () {
                return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function (s) {
                    return map.tryLock('key0');
                }).then(function (success) {
                    return expect(success).to.be.false;
                });
            });

            it('tryLock_success with timeout', function () {
                return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function () {
                    var promise = map.tryLock('key0', 1000);
                    Controller.executeOnController(cluster.id, _generateUnlockScript(map.getName(), '"key0"'), 1);
                    return promise;
                }).then(function (success) {
                    return expect(success).to.be.true;
                });
            });

            it('tryLock_fail with timeout', function () {
                return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function () {
                    return map.tryLock('key0', 1000);
                }).then(function (success) {
                    return expect(success).to.be.false;
                });
            });

            it('tryPut success', function () {
                return map.tryPut('key0', 'val0', 1000).then(function (success) {
                    return expect(success).to.be.true;
                })
            });

            it('tryPut fail', function () {
                return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function () {
                    return map.tryPut('key0', 'val0', 200);
                }).then(function (success) {
                    return expect(success).to.be.false;
                })
            });

            it('tryRemove success', function () {
                return map.tryRemove('key0', 1000).then(function (success) {
                    return expect(success).to.be.true;
                })
            });

            it('tryRemove fail', function () {
                return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function () {
                    return map.tryRemove('key0', 200);
                }).then(function (success) {
                    return expect(success).to.be.false;
                })
            });

            it('addEntryListener on map, entryAdded fires because predicate returns true for that entry', function (done) {
                var listenerObject = {
                    added: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key10');
                            expect(entryEvent.value).to.be.undefined;
                            expect(entryEvent.oldValue).to.be.undefined;
                            expect(entryEvent.mergingValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListenerWithPredicate(listenerObject, Predicates.sql('this == val10')).then(function () {
                    map.put('key10', 'val10');
                });
            });

            it('addEntryListener on key, entryAdded fires because predicate returns true for that entry', function (done) {
                var listenerObject = {
                    added: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key10');
                            expect(entryEvent.value).to.be.undefined;
                            expect(entryEvent.oldValue).to.be.undefined;
                            expect(entryEvent.mergingValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListenerWithPredicate(listenerObject, Predicates.sql('this == val10'), 'key10').then(function () {
                    map.put('key10', 'val10');
                });
            });

            it('addEntryListener on key, entryAdded fires because predicate returns true for that entry, inlVal=yes', function (done) {
                var listenerObject = {
                    added: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key10');
                            expect(entryEvent.value).to.equal('val10');
                            expect(entryEvent.mergingValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListenerWithPredicate(listenerObject, Predicates.sql('this == val10'), 'key10', true).then(function () {
                    map.put('key10', 'val10');
                });
            });

            it('addEntryListener with predicate on map entryAdded', function (done) {
                var listenerObject = {
                    added: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key10');
                            expect(entryEvent.mergingValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            expect(entryEvent.oldValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListenerWithPredicate(listenerObject, Predicates.sql('this == val10'), 'key10', true).then(function () {
                    map.put('key10', 'val10');
                });
            });

            it('addEntryListener on map entryAdded', function (done) {
                var listenerObject = {
                    added: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key10');
                            expect(entryEvent.value).to.equal('val10');
                            expect(entryEvent.oldValue).to.be.undefined;
                            expect(entryEvent.mergingValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject, undefined, true).then(function () {
                    map.put('key10', 'val10');
                });
            });

            it('addEntryListener on map entryUpdated', function (done) {
                var listenerObject = {
                    updated: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key0');
                            expect(entryEvent.value).to.be.undefined;
                            expect(entryEvent.oldValue).to.be.undefined;
                            expect(entryEvent.mergingValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject).then(function () {
                    map.put('key0', 'new-val');
                });
            });

            it('addEntryListener on key entryRemoved', function (done) {
                var listenerObject = {
                    removed: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key1');
                            expect(entryEvent.value).to.be.undefined;
                            expect(entryEvent.oldValue).to.be.undefined;
                            expect(entryEvent.mergingValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject, 'key1', false).then(function () {
                    map.remove('key1');
                });
            });

            it('addEntryListener on key entryRemoved includeValue=true', function (done) {
                var listenerObject = {
                    removed: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key1');
                            expect(entryEvent.value).to.be.undefined;
                            expect(entryEvent.oldValue).to.equal('val1');
                            expect(entryEvent.mergingValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject, 'key1', true).then(function () {
                    map.remove('key1');
                });
            });

            it('addEntryListener on key evicted includeValue=true', function (done) {
                var listenerObject = {
                    evicted: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key1');
                            expect(entryEvent.value).to.be.undefined;
                            expect(entryEvent.oldValue).to.equal('val1');
                            expect(entryEvent.mergingValue).to.be.undefined;
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject, 'key1', true).then(function () {
                    map.evict('key1')
                });
            });

            it('addEntryListener on map evictAll', function (done) {
                var listenerObject = {
                    mapEvicted: function (mapEvent) {
                        try {
                            expect(mapEvent.name).to.equal('test');
                            expect(mapEvent.numberOfAffectedEntries).to.equal(10);
                            expect(mapEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject).then(function () {
                    map.evictAll();
                });
            });

            it('addEntryListener on map clearAll', function (done) {
                var listenerObject = {
                    mapCleared: function (mapEvent) {
                        try {
                            expect(mapEvent.name).to.equal('test');
                            expect(mapEvent.numberOfAffectedEntries).to.equal(10);
                            expect(mapEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject).then(function () {
                    map.clear();
                });
            });

            it('addEntryListener on map entryExpired includeValue=true', function (done) {
                var listenerObj = {
                  expired: function (entryEvent) {
                      try {
                          expect(entryEvent.name).to.equal('test');
                          expect(entryEvent.key).to.equal('expiringKey');
                          expect(entryEvent.value).to.be.undefined;
                          expect(entryEvent.oldValue).to.equal('expiringValue');
                          expect(entryEvent.mergingValue).to.be.undefined;
                          expect(entryEvent.member).to.not.be.equal(null);
                          done();
                      } catch (err) {
                          done(err);
                      }
                  }
                };

                map.addEntryListener(listenerObj, undefined, true)
                    .then(function () {
                        return map.put('expiringKey', 'expiringValue', 1000);
                    });
            });

            it('removeEntryListener with correct id', function () {
                return map.addEntryListener({}).then(function (listenerId) {
                    return map.removeEntryListener(listenerId);
                }).then(function (success) {
                    return expect(success).to.be.true;
                });
            });

            it('removeEntryListener with wrong id', function () {
                return map.removeEntryListener('aaa').then(function (success) {
                    return expect(success).to.be.false;
                });
            });

            it('entrySetWithPredicate', function () {
                return map.entrySetWithPredicate(Predicates.sql('this == val3')).then(function (entrySet) {
                    expect(entrySet.length).to.equal(1);
                    expect(entrySet[0][0]).to.equal('key3');
                    expect(entrySet[0][1]).to.equal('val3');
                });
            });

            it('keySetWithPredicate', function () {
                return map.keySetWithPredicate(Predicates.sql('this == val3')).then(function (keySet) {
                    expect(keySet.length).to.equal(1);
                    expect(keySet[0]).to.equal('key3');
                });
            });

            it('keySetWithPredicate null response', function () {
                return map.keySetWithPredicate(Predicates.sql('this == nonexisting')).then(function (keySet) {
                    expect(keySet.length).to.equal(0);
                });
            });

            it('valuesWithPredicate', function () {
                return map.valuesWithPredicate(Predicates.sql('this == val3')).then(function (valueList) {
                    expect(valueList.toArray().length).to.equal(1);
                    expect(valueList.toArray()[0]).to.equal('val3');
                });
            });

            it('entrySetWithPredicate paging', function () {
                return map.entrySetWithPredicate(Predicates.paging(Predicates.greaterEqual('this', 'val3'), 1)).then(function (entrySet) {
                    expect(entrySet.length).to.equal(1);
                    expect(entrySet[0]).to.deep.equal(['key3', 'val3']);
                });
            });

            it('keySetWithPredicate paging', function () {
                return map.keySetWithPredicate(Predicates.paging(Predicates.greaterEqual('this', 'val3'), 1)).then(function (keySet) {
                    expect(keySet.length).to.equal(1);
                    expect(keySet[0]).to.equal('key3');
                });
            });

            it('valuesWithPredicate paging', function () {
                return map.valuesWithPredicate(Predicates.paging(Predicates.greaterEqual('this', 'val3'), 1)).then(function (values) {
                    expect(values.toArray().length).to.equal(1);
                    expect(values.toArray()[0]).to.equal('val3');
                });
            });

            it('destroy', function () {
                var dmap;
                var newMap;
                return client.getMap('map-to-be-destroyed').then(function (mp) {
                    dmap = mp;
                    return dmap.put('key', 'val');
                }).then(function () {
                    return dmap.destroy();
                }).then(function () {
                    return client.getMap('map-to-be-destroyed');
                }).then(function (mp) {
                    newMap = mp;
                    return newMap.size();
                }).then(function (s) {
                    expect(s).to.equal(0);
                });
            });
        });
    });
});

