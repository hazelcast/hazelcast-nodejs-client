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
const { Client } = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('NearCachedMapTest', function () {

    [true, false].forEach((invalidateOnChange) => {
        describe('invalidate on change=' + invalidateOnChange, function () {

            let cluster;
            let client1;
            let client2;
            let map1;
            let map2;

            before(async function () {
                const cfg = {
                    nearCaches: {
                        'ncc-map': {
                            invalidateOnChange
                        }
                    }
                };
                cluster = await RC.createCluster(null,
                    fs.readFileSync(__dirname + '/hazelcast_nearcache_batchinvalidation_false.xml', 'utf8'));
                await RC.startMember(cluster.id);
                cfg.clusterName = cluster.id;
                client1 = await Client.newHazelcastClient(cfg);
                client2 = await Client.newHazelcastClient(cfg);
            });

            beforeEach(async function () {
                map1 = await client1.getMap('ncc-map');
                map2 = await client2.getMap('ncc-map');
                return TestUtil.fillMap(map1);
            });

            afterEach(async function () {
                return map1.destroy();
            });

            after(async function () {
                await client1.shutdown();
                await client2.shutdown();
                return RC.terminateCluster(cluster.id);
            });

            function getNearCacheStats(map) {
                return map.nearCache.getStatistics();
            }

            function expectStats(map, hit, miss, entryCount) {
                const stats = getNearCacheStats(map);
                expect(stats.hitCount).to.equal(hit);
                expect(stats.missCount).to.equal(miss);
                expect(stats.entryCount).to.equal(entryCount);
            }

            it('second get should hit', async function () {
                await map1.get('key0');
                const val = await map1.get('key0');
                expect(val).to.equal('val0');
                expectStats(map1, 1, 1, 1);
            });

            it('remove operation removes entry from near cache', async function () {
                await map1.get('key1');
                await map1.remove('key1');
                const val = await map1.get('key1');
                expect(val).to.be.null;
                expectStats(map1, 0, 2, 1);
            });

            it('update invalidates the near cache', async function () {
                await map1.get('key1');
                await map1.put('key1', 'something else');
                const val = await map1.get('key1');
                expect(val).to.be.equal('something else');
                expectStats(map1, 0, 2, 1);
            });

            it('get returns null if the entry was removed by another client', async function () {
                if (!invalidateOnChange) {
                    this.skip();
                }
                await map1.get('key1');
                await map2.remove('key1');
                const val = await TestUtil.promiseLater(1000, map1.get.bind(map1, 'key1'));
                expectStats(map1, 0, 2, 1);
                expect(val).to.be.null;
            });

            it('clear clears nearcache', async function () {
                await map1.get('key1');
                await map1.clear();
                expectStats(map1, 0, 1, 0);
            });

            it('containsKey true(in near cache)', async function () {
                await map1.get('key1');
                const c = await map1.containsKey('key1');
                expectStats(map1, 1, 1, 1);
                expect(c).to.be.true;
            });

            it('containsKey false(in near cache)', async function () {
                await map1.get('exx');
                const c = await map1.containsKey('exx');
                expectStats(map1, 1, 1, 1);
                expect(c).to.be.false;
            });

            it('containsKey true', async function () {
                const c = await map1.containsKey('key1');
                expectStats(map1, 0, 1, 0);
                expect(c).to.be.true;
            });

            it('containsKey false', async function () {
                const c = await map1.containsKey('exx');
                expectStats(map1, 0, 1, 0);
                expect(c).to.be.false;
            });

            it('delete invalidates the cache', async function () {
                await map1.get('key1');
                await map1.delete('key1');
                expectStats(map1, 0, 1, 0);
            });

            it('evictAll evicts near cache', async function () {
                await map1.get('key1');
                await map1.evictAll();
                expectStats(map1, 0, 1, 0);
            });

            it('evict evicts the entry', async function () {
                await map1.getAll(['key1', 'key2']);
                await map1.evict('key1');
                expectStats(map1, 0, 2, 1);
            });

            it('getAll', async function () {
                const vals = await map1.getAll(['key1', 'key2']);
                expect(vals).to.deep.have.members([
                    ['key1', 'val1'],
                    ['key2', 'val2']
                ]);
                expectStats(map1, 0, 2, 2);
            });

            it('getAll second call should hit', async function () {
                await map1.getAll(['key1', 'key2']);
                const vals = await map1.getAll(['key1', 'key2', 'key3']);
                expect(vals).to.deep.have.members([
                    ['key1', 'val1'],
                    ['key2', 'val2'],
                    ['key3', 'val3']
                ]);
                expectStats(map1, 2, 3, 3);
            });

            // TODO implement missing tests

            // it('executeOnKey invalidates the entry');

            // it('executeOnKeys invalidates entries');

            // it('loadAll invalidates the cache');

            [true, false].forEach((shouldUsePutAll) => {
                it((shouldUsePutAll ? 'putAll' : 'setAll') + ' invalidates entries', async function () {
                    await map1.getAll(['key1', 'key2']);
                    const entries = [
                        ['key1', 'newVal1'],
                        ['key2', 'newVal2']
                    ];
                    if (shouldUsePutAll) {
                        await map1.putAll(entries);
                    } else {
                        await map1.setAll(entries);
                    }
                    expectStats(map1, 0, 2, 0);
                });
            });

            it('putIfAbsent (existing key) invalidates the entry', async function () {
                await map1.get('key1');
                await map1.putIfAbsent('key1', 'valnew');
                expectStats(map1, 0, 1, 0);
            });

            it('putTransient invalidates the entry', async function () {
                await map1.get('key1');
                await map1.putTransient('key1', 'vald');
                expectStats(map1, 0, 1, 0);
            });

            it('replace invalidates the entry', async function () {
                await map1.get('key1');
                await map1.replace('key1', 'newVal');
                expectStats(map1, 0, 1, 0);
            });

            it('replaceIfSame invalidates the entry', async function () {
                await map1.get('key1');
                await map1.replaceIfSame('key1', 'val1', 'newVal');
                expectStats(map1, 0, 1, 0);
            });

            it('set invalidates the entry', async function () {
                await map1.get('key1');
                await map1.set('key1', 'newVal');
                expectStats(map1, 0, 1, 0);
            });

            it('tryPut invalidates the entry', async function () {
                await map1.get('key1');
                await map1.tryPut('key1', 'newVal', 1000);
                expectStats(map1, 0, 1, 0);
            });

            it('tryRemove invalidates the entry', async function () {
                await map1.get('key1');
                await map1.tryRemove('key1', 1000);
                expectStats(map1, 0, 1, 0);
            });

            it('setTtl invalidates the entry', async function () {
                TestUtil.markClientVersionAtLeast(this, '4.1');
                await map1.get('key1');
                await map1.setTtl('key1', 60000);
                expectStats(map1, 0, 1, 0);
            });
        });
    });
});
