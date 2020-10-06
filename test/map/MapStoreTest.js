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
'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const RC = require('../RC');
const { Client } = require('../../lib/index.js');
const { fillMap } = require('../Util');
const { promiseWaitMilliseconds } = require('../Util');
const Util = require('../Util');

describe('MapStoreTest', function () {

    let cluster;
    let client;
    let map;

    before(async function () {
        this.timeout(32000);
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_mapstore.xml', 'utf8'))
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        map = await client.getMap('mapstore-test');
        await fillMap(map);
    });

    afterEach(async function () {
        await map.destroy();
    });

    after(async function () {
        await client.shutdown()
        return RC.terminateCluster(cluster.id);
    });

    it('loadAll with no arguments loads all keys', async function () {
        await fillMap(map)
        await map.evictAll();
        await map.loadAll();
        let values = await map.getAll([
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

    it('loadAll with empty keyset loads nothing', async function () {
        await map.evictAll();
        await map.loadAll([]);
        let val = await map.size()
        expect(val).to.equal(0);
    });

    it('loadAll with keyset loads all keys', async function () {
        await map.evictAll();
        await map.loadAll(['key0', 'key1']);
        let values = await map.getAll(['key0', 'key1']);
        expect(values).to.deep.have.members([
            ['key0', 'val0'], ['key1', 'val1']
        ]);
    });

    it('loadAll overrides entries in memory by default', async function () {
        await map.evictAll();
        await map.putTransient('key0', 'newval0');
        await map.putTransient('key1', 'newval1');
        await map.loadAll(['key0', 'key1']);
        let values = await map.getAll(['key0', 'key1']);
        expect(values).to.deep.have.members([
            ['key0', 'val0'], ['key1', 'val1']
        ]);
    });

    it('loadAll with replaceExisting=true overrides the entries', async function () {
        await map.evictAll();
        await map.putTransient('key0', 'newval0');
        await map.putTransient('key1', 'newval1');
        await map.loadAll(['key0', 'key1'], true);
        let values = await map.getAll(['key0', 'key1']);
        expect(values).to.deep.have.members([
            ['key0', 'val0'], ['key1', 'val1']
        ]);
    });

    it('loadAll with replaceExisting=false does not override', async function () {
        await map.evictAll();
        await map.putTransient('key0', 'newval0');
        await map.putTransient('key1', 'newval1');
        await map.loadAll(['key0', 'key1'], false);
        let values = await map.getAll(['key0', 'key1']);
        expect(values).to.deep.have.members([
            ['key0', 'newval0'], ['key1', 'newval1']
        ]);
    });

    it('evict', async function () {
        await map.evict('key0');
        let s = await map.size();
        expect(s).to.equal(9);
    });

    it('evict_nonexist_key', async function () {
        await map.evict('non-key');
        let s = await map.size();
        expect(s).to.equal(10);
    });

    it('evictAll', async function () {
        await map.evictAll();
        let s = await map.size();
        expect(s).to.equal(0);
    });

    it('addEntryListener on map entryLoaded includeValue=true', function (done) {
        const listener = {
            loaded: function (entryEvent) {
                try {
                    expect(entryEvent.name).to.equal('mapstore-test');
                    expect(entryEvent.key).to.equal('some-key');
                    expect(entryEvent.value).to.equal('some-value');
                    expect(entryEvent.oldValue).to.be.equal(null);
                    expect(entryEvent.mergingValue).to.be.equal(null);
                    expect(entryEvent.member).to.not.be.equal(null);
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };

        map.addEntryListener(listener, undefined, true)
            .then(function () {
                return map.put('some-key', 'some-value', 100)
            }).then(function () {
                return promiseWaitMilliseconds(2000);
            }).then(function () {
                return map.get('some-key');
            });
    });

    it('listener contains old value after putAll', function (done) {
        let listenerId;
        const listener = {
            updated: event => {
                map.removeEntryListener(listenerId)
                    .then(() => {
                        if (event.oldValue === '1') {
                            done();
                        } else {
                            done(new Error('Old value for the received event does not match with expected value! ' +
                                'Expected: 1, received: ' + event.oldValue));
                        }
                    });
            },
        }
        map.evictAll()
            .then(() => map.put('1', '1'))
            .then(() => map.addEntryListener(listener, null, true))
            .then(id => {
                listenerId = id;
                return map.putAll([['1', '2']]);
            });
    });

    it('listener does not contain old value after setAll', function (done) {
        Util.markServerVersionAtLeast(this, client, '4.1');
        let listenerId;
        const listener = {
            added: event => {
                map.removeEntryListener(listenerId)
                    .then(() => {
                        if (event.oldValue == null) {
                            done();
                        } else {
                            done(new Error('Old value for the received event does not match with expected value! ' +
                                'Expected: null, received: ' + event.oldValue));
                        }
                    });
            },
        }
        map.evictAll()
            .then(() => map.put('1', '1'))
            .then(() => map.addEntryListener(listener, null, true))
            .then(id => {
                listenerId = id;
                return map.setAll([['1', '2']]);
            });
    });
});
