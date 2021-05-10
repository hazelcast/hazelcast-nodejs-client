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

const { expect } = require('chai');
const fs = require('fs');

const RC = require('../../RC');
const { Client, Predicates } = require('../../../../');
const TestUtil = require('../../../TestUtil');

async function createController(nearCacheEnabled) {
    if (nearCacheEnabled) {
        return RC.createCluster(null,
            fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8'));
    } else {
        return RC.createCluster(null, null);
    }
}

async function createClient(nearCacheEnabled, clusterName) {
    const cfg = {
        clusterName,
        nearCaches: {}
    };
    if (nearCacheEnabled) {
        cfg.nearCaches['test'] = { timeToLiveSeconds: 1 };
    }
    return Client.newHazelcastClient(cfg);
}

describe('MapProxyTest', function () {
    [false, true].forEach((nearCacheEnabled) => {
        describe(' - Near Cache enabled: ' + nearCacheEnabled, function () {

            let cluster;
            let client;
            let map;

            before(async function () {
                cluster = await createController(nearCacheEnabled);
                await RC.startMember(cluster.id);
                client = await createClient(nearCacheEnabled, cluster.id);
            });

            beforeEach(async function () {
                map = await client.getMap('test');
                return TestUtil.fillMap(map);
            });

            afterEach(async function () {
                return map.destroy();
            });

            after(async function () {
                await client.shutdown();
                return RC.terminateCluster(cluster.id);
            });

            function generateLockScript(mapName, keyName) {
                return 'function lockByServer() {' +
                    '   var map = instance_0.getMap("' + mapName + '");' +
                    '   map.lock(' + keyName + ');' +
                    '   return map.isLocked(' + keyName + ');' +
                    '}' +
                    'result=""+lockByServer();';
            }

            function generateUnlockScript(mapName, keyName) {
                return 'function lockByServer() {' +
                    '   var map = instance_0.getMap("' + mapName + '");' +
                    '   map.unlock(' + keyName + ');' +
                    '   return map.isLocked(' + keyName + ');' +
                    '}' +
                    'result=""+lockByServer();';
            }

            it('get_basic', async function () {
                const val = await map.get('key0');
                expect(val).to.equal('val0');
            });

            it('get_return_null_on_non_existent', async function () {
                const val = await map.get('non-existent');
                expect(val).to.be.null;
            });

            it('put_return_value_not_null', async function () {
                const val = await map.put('key0', 'new-val');
                expect(val).to.equal('val0');
            });

            it('put with ttl puts value to map', async function () {
                await map.put('key-with-ttl', 'val-with-ttl', 3000);
                const val = await map.get('key-with-ttl');
                expect(val).to.equal('val-with-ttl');
            });

            it('put with ttl removes value after ttl', async function () {
                await map.put('key10', 'val10', 1000);
                let val = await map.get('key10');
                expect(val).to.equal('val10');
                val = await TestUtil.promiseLater(1100, map.get.bind(map, 'key10'));
                expect(val).to.be.null;
            });

            it('put with maxIdle removes value after maxIdle', async function () {
                TestUtil.markClientVersionAtLeast(this, '4.1');
                await map.put('key10', 'val10', undefined, 1000);
                let val = await map.get('key10');
                expect(val).to.equal('val10');
                val = await TestUtil.promiseLater(1100, map.get.bind(map, 'key10'));
                expect(val).to.be.null;
            });

            it('setTtl updates ttl for entry', async function () {
                TestUtil.markClientVersionAtLeast(this, '4.1');
                await map.put('key10', 'val10', 1000);
                let val = await map.get('key10');
                expect(val).to.equal('val10');

                await map.setTtl('key10', 60000);

                val = await TestUtil.promiseLater(1100, map.get.bind(map, 'key10'));
                expect(val).to.equal('val10');
            });

            it('clear', async function () {
                await map.clear();
                const val = await map.isEmpty();
                expect(val).to.be.true;
            });

            it('size', async function () {
                const size = await map.size();
                expect(size).to.equal(10);
            });

            it('basic_remove_return_value', async function () {
                const val = await map.remove('key9');
                expect(val).to.equal('val9');
            });

            it('basic_remove', async function () {
                await map.remove('key1');
                const val = await map.get('key1');
                expect(val).to.be.null;
            });

            it('remove_if_equal_false', async function () {
                const val = await map.remove('key1', 'wrong');
                expect(val).to.be.false;
            });

            it('remove_if_equal_true', async function () {
                const val = await map.remove('key1', 'val1');
                expect(val).to.be.true;
            });

            it('containsKey_true', async function () {
                const val = await map.containsKey('key1');
                expect(val).to.be.true;
            });

            it('containsKey_false', async function () {
                const val = await map.containsKey('non-existent');
                expect(val).to.be.false;
            });

            it('containsValue_true', async function () {
                const val = await map.containsValue('val1');
                expect(val).to.be.true;
            });

            it('containsValue_false', async function () {
                const val = await map.containsValue('non-existent');
                expect(val).to.be.false;
            });

            [true, false].forEach((shouldUsePutAll) => {
                it(shouldUsePutAll ? 'putAll' : 'setAll', function (done) {
                    const arr = [
                        ['pa_k0', 'pa_v0'],
                        ['pa_k1', 'pa_v1'],
                        ['pa_k2', 'pa_v2'],
                        ['pa_k3', 'pa_v3'],
                        ['pa_k4', 'pa_v4']
                    ];
                    let returnedCorrectly = 0;
                    const verify = function (expected) {
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
                    let promise;
                    if (shouldUsePutAll) {
                        promise = map.putAll(arr);
                    } else {
                        promise = map.setAll(arr);
                    }
                    promise.then(() => {
                        map.get(arr[0][0]).then(verify(arr[0][1]));
                        map.get(arr[1][0]).then(verify(arr[1][1]));
                        map.get(arr[2][0]).then(verify(arr[2][1]));
                        map.get(arr[3][0]).then(verify(arr[3][1]));
                        map.get(arr[4][0]).then(verify(arr[4][1]));
                    });
                });
            });

            it('getAll', async function () {
                const values = await map.getAll([
                    'key0', 'key1', 'key2', 'key3', 'key4',
                    'key5', 'key6', 'key7', 'key8', 'key9'
                ]);
                expect(values).to.deep.have.members([
                    ['key0', 'val0'], ['key1', 'val1'],
                    ['key2', 'val2'], ['key3', 'val3'],
                    ['key4', 'val4'], ['key5', 'val5'],
                    ['key6', 'val6'], ['key7', 'val7'],
                    ['key8', 'val8'], ['key9', 'val9']
                ]);
            });

            it('delete', async function () {
                await map.put('key-to-delete', 'value');
                await map.delete('key-to-delete');
                const val = await map.get('key-to-delete');
                expect(val).to.be.null;
            });

            it('entrySet_notNull', async function () {
                const samples = [
                    ['k1', 'v1'],
                    ['k2', 'v2'],
                    ['k3', 'v3']
                ];

                const entryMap = await client.getMap('entry-map');
                await Promise.all([
                    entryMap.put(samples[0][0], samples[0][1]),
                    entryMap.put(samples[1][0], samples[1][1]),
                    entryMap.put(samples[2][0], samples[2][1])
                ]);
                const entrySet = await entryMap.entrySet();
                expect(entrySet).to.deep.have.members(samples);
            });

            it('entrySet_null', async function () {
                const entryMap = await client.getMap('null-entry-map');
                const entrySet = await entryMap.entrySet();
                expect(entrySet).to.be.empty;
            });

            it('flush', async function () {
                return map.flush();
            });

            it('lock', async function () {
                await map.lock('key0');
                const isLocked = await map.isLocked('key0');
                expect(isLocked).to.be.true;
                return map.unlock('key0');
            });

            it('unlock', async function () {
                await map.lock('key0');
                await map.unlock('key0');
                const isLocked = await map.isLocked('key0');
                expect(isLocked).to.be.false;
            });

            it('forceUnlock', async function () {
                const script =
                    'function lockByServer() {' +
                    '   var map = instance_0.getMap("' + map.getName() + '");' +
                    '   map.lock("key0");' +
                    '   return map.isLocked("key0")' +
                    '}' +
                    'result=""+lockByServer();';
                await RC.executeOnController(cluster.id, script, 1);
                await map.forceUnlock('key0');
                const isLocked = await map.isLocked('key0');
                expect(isLocked).to.be.false;
            });

            it('keySet', async function () {
                const keySet = await map.keySet();
                expect(keySet).to.deep.have.members([
                    'key0', 'key1', 'key2', 'key3', 'key4',
                    'key5', 'key6', 'key7', 'key8', 'key9'
                ]);
            });

            it('putIfAbsent_success', async function () {
                const oldVal = await map.putIfAbsent('key10', 'new-val');
                expect(oldVal).to.be.null;
                const val = await map.get('key10');
                expect(val).to.equal('new-val');
            });

            it('putIfAbsent_fail', async function () {
                await map.putIfAbsent('key9', 'new-val');
                const val = await map.get('key9');
                expect(val).to.equal('val9');
            });

            it('putIfAbsent_with_ttl', async function () {
                await map.putIfAbsent('key10', 'new-val', 1000);
                let val = await map.get('key10');
                expect(val).to.equal('new-val');
                val = await TestUtil.promiseLater(1100, map.get.bind(map, 'key10'));
                expect(val).to.be.null;
            });

            it('putIfAbsent_with_maxIdle', async function () {
                TestUtil.markClientVersionAtLeast(this, '4.1');
                await map.putIfAbsent('key10', 'new-val', undefined, 1000);
                let val = await map.get('key10');
                expect(val).to.equal('new-val');
                val = await TestUtil.promiseLater(1100, map.get.bind(map, 'key10'));
                expect(val).to.be.null;
            });

            it('putTransient', async function () {
                await map.putTransient('key10', 'val10');
                const val = await map.get('key10');
                expect(val).to.equal('val10');
            });

            it('putTransient_with_ttl', async function () {
                await map.putTransient('key10', 'val10', 1000);
                let val = await map.get('key10');
                expect(val).to.equal('val10');
                val = await TestUtil.promiseLater(1100, map.get.bind(map, 'key10'));
                expect(val).to.be.null;
            });

            it('putTransient_with_maxIdle', async function () {
                TestUtil.markClientVersionAtLeast(this, '4.1');
                await map.putTransient('key10', 'val10', undefined, 1000);
                let val = await map.get('key10');
                expect(val).to.equal('val10');
                val = await TestUtil.promiseLater(1100, map.get.bind(map, 'key10'));
                expect(val).to.be.null;
            });

            it('replace', async function () {
                const oldVal = await map.replace('key9', 'new-val');
                expect(oldVal).to.equal('val9');
                const val = await map.get('key9');
                expect(val).to.equal('new-val');
            });

            it('replaceIfSame_success', async function () {
                const success = await map.replaceIfSame('key9', 'val9', 'new-val');
                expect(success).to.be.true;
                const val = await map.get('key9');
                expect(val).to.equal('new-val');
            });

            it('replaceIfSame_fail', async function () {
                const success = await map.replaceIfSame('key9', 'wrong', 'new-val');
                expect(success).to.be.false;
                const val = await map.get('key9');
                expect(val).to.equal('val9');
            });

            it('set', async function () {
                await map.set('key10', 'val10');
                const val = await map.get('key10');
                expect(val).to.equal('val10');
            });

            it('set_with_ttl', async function () {
                await map.set('key10', 'val10', 1000);
                let val = await map.get('key10');
                expect(val).to.equal('val10');
                val = await TestUtil.promiseLater(1100, map.get.bind(map, 'key10'));
                expect(val).to.be.null;
            });

            it('set_with_maxIdle', async function () {
                TestUtil.markClientVersionAtLeast(this, '4.1');
                await map.set('key10', 'val10', undefined, 1000);
                let val = await map.get('key10');
                expect(val).to.equal('val10');
                val = await TestUtil.promiseLater(1100, map.get.bind(map, 'key10'));
                expect(val).to.be.null;
            });

            it('values', async function () {
                const vals = await map.values();
                expect(vals.toArray()).to.deep.have.members([
                    'val0', 'val1', 'val2', 'val3', 'val4',
                    'val5', 'val6', 'val7', 'val8', 'val9'
                ]);
            });

            it('values_null', async function () {
                await map.clear();
                const vals = await map.values();
                expect(vals.toArray()).to.have.lengthOf(0);
            });

            it('getEntryView', function (done) {
                map.get('key0').then(() => {
                    return map.getEntryView('key0');
                }).then((entry) => {
                    try {
                        expect(entry.key).to.equal('key0');
                        expect(entry.value).to.equal('val0');
                        expect(entry.cost.greaterThan(0)).to.be.true;
                        expect(entry.creationTime.isZero()).to.be.false;
                        expect(entry.expirationTime.isZero()).to.be.false;
                        expect(entry.hits.isZero()).to.be.false;
                        expect(entry.lastAccessTime.isZero()).to.be.false;
                        expect(entry.lastStoredTime.isZero()).to.be.equal(!TestUtil.isServerVersionAtLeast(client, '4.2'));
                        expect(entry.lastUpdateTime.isZero()).to.be.false;
                        expect(entry.version.isZero()).to.be.true;
                        expect(entry.ttl.isZero()).to.be.false;
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            it('getEntryView_null', async function () {
                const entry = await map.getEntryView('non-exist');
                expect(entry).to.be.null;
            });

            it('addIndex', async function () {
                const orderedIndexCfg = {
                    name: 'length',
                    attributes: ['this']
                };
                const unorderedIndexCfg = {
                    name: 'length',
                    type: 'HASH',
                    attributes: ['this']
                };

                return Promise.all([
                    map.addIndex(orderedIndexCfg),
                    map.addIndex(unorderedIndexCfg)
                ]);
            });

            it('tryLock_success', async function () {
                const success = await map.tryLock('key0');
                expect(success).to.be.true;
            });

            it('tryLock_fail', async function () {
                await RC.executeOnController(cluster.id, generateLockScript(map.getName(), '"key0"'), 1);
                const success = await map.tryLock('key0');
                expect(success).to.be.false;
            });

            it('tryLock_success with timeout', async function () {
                await RC.executeOnController(cluster.id, generateLockScript(map.getName(), '"key0"'), 1);
                const startTime = Date.now();
                setTimeout(async () => {
                    await RC.executeOnController(cluster.id, generateUnlockScript(map.getName(), '"key0"'), 1);
                }, 1000);
                const success = await map.tryLock('key0', 2000);
                const elapsed = Date.now() - startTime;
                expect(success).to.be.true;
                expect(elapsed).to.be.greaterThan(990);
            });

            it('tryLock_fail with timeout', async function () {
                await RC.executeOnController(cluster.id, generateLockScript(map.getName(), '"key0"'), 1);
                const success = await map.tryLock('key0', 1000);
                expect(success).to.be.false;
            });

            it('tryPut success', async function () {
                const success = await map.tryPut('key0', 'val0', 1000);
                expect(success).to.be.true;
            });

            it('tryPut fail', async function () {
                await RC.executeOnController(cluster.id, generateLockScript(map.getName(), '"key0"'), 1);
                const success = await map.tryPut('key0', 'val0', 200);
                expect(success).to.be.false;
            });

            it('tryRemove success', async function () {
                const success = await map.tryRemove('key0', 1000);
                expect(success).to.be.true;
            });

            it('tryRemove fail', async function () {
                await RC.executeOnController(cluster.id, generateLockScript(map.getName(), '"key0"'), 1);
                const success = await map.tryRemove('key0', 200);
                expect(success).to.be.false;
            });

            it('addEntryListener on map, entryAdded fires because predicate returns true for that entry', function (done) {
                const listenerObject = {
                    added: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key10');
                            expect(entryEvent.value).to.be.null;
                            expect(entryEvent.oldValue).be.null;
                            expect(entryEvent.mergingValue).to.be.null;
                            expect(entryEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListenerWithPredicate(listenerObject, Predicates.sql('this == val10'))
                    .then(() => {
                        map.put('key10', 'val10');
                    });
            });

            it('addEntryListener on key, entryAdded fires because predicate returns true for that entry', function (done) {
                const listenerObject = {
                    added: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key10');
                            expect(entryEvent.value).to.be.null;
                            expect(entryEvent.oldValue).to.be.null;
                            expect(entryEvent.mergingValue).to.be.null;
                            expect(entryEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListenerWithPredicate(listenerObject, Predicates.sql('this == val10'), 'key10')
                    .then(() => {
                        map.put('key10', 'val10');
                    });
            });

            it('addEntryListener on key, entryAdded fires because predicate returns true for that entry, inlVal=yes',
                function (done) {
                    const listenerObject = {
                        added: function (entryEvent) {
                            try {
                                expect(entryEvent.name).to.equal('test');
                                expect(entryEvent.key).to.equal('key10');
                                expect(entryEvent.value).to.equal('val10');
                                expect(entryEvent.mergingValue).to.be.null;
                                expect(entryEvent.member).to.not.be.null;
                                done();
                            } catch (err) {
                                done(err);
                            }
                        }
                    };
                    map.addEntryListenerWithPredicate(listenerObject, Predicates.sql('this == val10'), 'key10', true)
                        .then(() => {
                            map.put('key10', 'val10');
                        });
                }
            );

            it('addEntryListener with predicate on map entryAdded', function (done) {
                const listenerObject = {
                    added: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key10');
                            expect(entryEvent.mergingValue).to.be.null;
                            expect(entryEvent.member).to.not.be.null;
                            expect(entryEvent.oldValue).to.be.null;
                            expect(entryEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListenerWithPredicate(listenerObject, Predicates.sql('this == val10'), 'key10', true)
                    .then(() => {
                        map.put('key10', 'val10');
                    });
            });

            it('addEntryListener on map entryAdded', function (done) {
                const listenerObject = {
                    added: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key10');
                            expect(entryEvent.value).to.equal('val10');
                            expect(entryEvent.oldValue).to.be.null;
                            expect(entryEvent.mergingValue).to.be.null;
                            expect(entryEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject, undefined, true).then(() => {
                    map.put('key10', 'val10');
                });
            });

            it('addEntryListener on map entryUpdated', function (done) {
                const listenerObject = {
                    updated: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key0');
                            expect(entryEvent.value).to.be.null;
                            expect(entryEvent.oldValue).to.be.null;
                            expect(entryEvent.mergingValue).be.null;
                            expect(entryEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject).then(() => {
                    map.put('key0', 'new-val');
                });
            });

            it('addEntryListener on key entryRemoved', function (done) {
                const listenerObject = {
                    removed: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key1');
                            expect(entryEvent.value).to.be.null;
                            expect(entryEvent.oldValue).to.be.null;
                            expect(entryEvent.mergingValue).to.be.null;
                            expect(entryEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject, 'key1', false).then(() => {
                    map.remove('key1');
                });
            });

            it('addEntryListener on key entryRemoved includeValue=true', function (done) {
                const listenerObject = {
                    removed: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key1');
                            expect(entryEvent.value).to.be.null;
                            expect(entryEvent.oldValue).to.equal('val1');
                            expect(entryEvent.mergingValue).to.be.null;
                            expect(entryEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject, 'key1', true).then(() => {
                    map.remove('key1');
                });
            });

            it('addEntryListener on key evicted includeValue=true', function (done) {
                const listenerObject = {
                    evicted: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('key1');
                            expect(entryEvent.value).to.be.null;
                            expect(entryEvent.oldValue).to.equal('val1');
                            expect(entryEvent.mergingValue).to.be.null;
                            expect(entryEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject, 'key1', true).then(() => {
                    map.evict('key1');
                });
            });

            it('addEntryListener on map evictAll', function (done) {
                const listenerObject = {
                    mapEvicted: function (mapEvent) {
                        try {
                            expect(mapEvent.name).to.equal('test');
                            expect(mapEvent.numberOfAffectedEntries).to.equal(10);
                            expect(mapEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject).then(() => {
                    map.evictAll();
                });
            });

            it('addEntryListener on map clearAll', function (done) {
                const listenerObject = {
                    mapCleared: function (mapEvent) {
                        try {
                            expect(mapEvent.name).to.equal('test');
                            expect(mapEvent.numberOfAffectedEntries).to.equal(10);
                            expect(mapEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObject).then(() => {
                    map.clear();
                });
            });

            it('addEntryListener on map entryExpired includeValue=true', function (done) {
                const listenerObj = {
                    expired: function (entryEvent) {
                        try {
                            expect(entryEvent.name).to.equal('test');
                            expect(entryEvent.key).to.equal('expiringKey');
                            expect(entryEvent.value).to.be.null;
                            expect(entryEvent.oldValue).to.equal('expiringValue');
                            expect(entryEvent.mergingValue).to.be.null;
                            expect(entryEvent.member).to.not.be.null;
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                map.addEntryListener(listenerObj, undefined, true)
                    .then(() => {
                        return map.put('expiringKey', 'expiringValue', 1000);
                    });
            });

            it('removeEntryListener with correct id', async function () {
                const listenerId = await map.addEntryListener({});
                const success = await map.removeEntryListener(listenerId);
                expect(success).to.be.true;
            });

            it('removeEntryListener with wrong id', async function () {
                const success = await map.removeEntryListener('aaa');
                expect(success).to.be.false;
            });

            it('entrySetWithPredicate', async function () {
                const entrySet = await map.entrySetWithPredicate(Predicates.sql('this == val3'));
                expect(entrySet.length).to.equal(1);
                expect(entrySet[0][0]).to.equal('key3');
                expect(entrySet[0][1]).to.equal('val3');
            });

            it('keySetWithPredicate', async function () {
                const keySet = await map.keySetWithPredicate(Predicates.sql('this == val3'));
                expect(keySet.length).to.equal(1);
                expect(keySet[0]).to.equal('key3');
            });

            it('keySetWithPredicate null response', async function () {
                const keySet = await map.keySetWithPredicate(Predicates.sql('this == nonexisting'));
                expect(keySet.length).to.equal(0);
            });

            it('valuesWithPredicate', async function () {
                const valueList = await map.valuesWithPredicate(Predicates.sql('this == val3'));
                expect(valueList.toArray().length).to.equal(1);
                expect(valueList.toArray()[0]).to.equal('val3');
            });

            it('entrySetWithPredicate paging', async function () {
                const entrySet = await map.entrySetWithPredicate(Predicates.paging(Predicates.greaterEqual('this', 'val3'), 1));
                expect(entrySet.length).to.equal(1);
                expect(entrySet[0]).to.deep.equal(['key3', 'val3']);
            });

            it('keySetWithPredicate paging', async function () {
                const keySet = await map.keySetWithPredicate(Predicates.paging(Predicates.greaterEqual('this', 'val3'), 1));
                expect(keySet.length).to.equal(1);
                expect(keySet[0]).to.equal('key3');
            });

            it('valuesWithPredicate paging', async function () {
                const values = await map.valuesWithPredicate(Predicates.paging(Predicates.greaterEqual('this', 'val3'), 1));
                expect(values.toArray().length).to.equal(1);
                expect(values.toArray()[0]).to.equal('val3');
            });

            it('destroy', async function () {
                const dmap = await client.getMap('map-to-be-destroyed');
                await dmap.put('key', 'val');
                await dmap.destroy();
                const newMap = await client.getMap('map-to-be-destroyed');
                const s = await newMap.size();
                expect(s).to.equal(0);
            });
        });
    });
});
