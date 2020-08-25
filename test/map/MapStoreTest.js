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
const RC = require('./../RC');
const { Client } = require('../../lib/index.js');
const { fillMap } = require('../Util');
const { promiseWaitMilliseconds } = require('../Util');
const Util = require('../Util');

describe('MapStoreTest', function () {

    let cluster;
    let client;
    let map;

    before(function () {
        this.timeout(32000);
        return RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_mapstore.xml', 'utf8'))
            .then(function (res) {
                cluster = res;
                return RC.startMember(cluster.id);
            })
            .then(function (member) {
                return Client.newHazelcastClient({ clusterName: cluster.id });
            })
            .then(function (hazelcastClient) {
                client = hazelcastClient;
            });
    });

    beforeEach(function () {
        return client.getMap('mapstore-test').then(function (mp) {
            map = mp;
            return fillMap(map);
        });
    });

    afterEach(function () {
        return map.destroy();
    });

    after(function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('loadAll with no arguments loads all keys', function () {
        return fillMap(map).then(function () {
            return map.evictAll();
        }).then(function () {
            return map.loadAll();
        }).then(function () {
            return map.getAll([
                'key0', 'key1', 'key2', 'key3', 'key4',
                'key5', 'key6', 'key7', 'key8', 'key9'
            ]);
        }).then(function (values) {
            return expect(values).to.deep.have.members([
                ['key0', 'val0'], ['key1', 'val1'],
                ['key2', 'val2'], ['key3', 'val3'],
                ['key4', 'val4'], ['key5', 'val5'],
                ['key6', 'val6'], ['key7', 'val7'],
                ['key8', 'val8'], ['key9', 'val9']
            ]);
        });
    });

    it('loadAll with empty keyset loads nothing', function () {
        return map.evictAll().then(function () {
            return map.loadAll([]);
        }).then(function () {
            return map.size()
        }).then(function (val) {
            expect(val).to.equal(0);
        })
    });

    it('loadAll with keyset loads all keys', function () {
        return map.evictAll().then(function () {
            return map.loadAll(['key0', 'key1']);
        }).then(function () {
            return map.getAll(['key0', 'key1']);
        }).then(function (values) {
            return expect(values).to.deep.have.members([
                ['key0', 'val0'], ['key1', 'val1']
            ]);
        });
    });

    it('loadAll overrides entries in memory by default', function () {
        return map.evictAll().then(function () {
            return map.putTransient('key0', 'newval0');
        }).then(function () {
            return map.putTransient('key1', 'newval1');
        }).then(function () {
            return map.loadAll(['key0', 'key1']);
        }).then(function () {
            return map.getAll(['key0', 'key1']);
        }).then(function (values) {
            return expect(values).to.deep.have.members([
                ['key0', 'val0'], ['key1', 'val1']
            ]);
        });
    });

    it('loadAll with replaceExisting=true overrides the entries', function () {
        return map.evictAll().then(function () {
            return map.putTransient('key0', 'newval0');
        }).then(function () {
            return map.putTransient('key1', 'newval1');
        }).then(function () {
            return map.loadAll(['key0', 'key1'], true);
        }).then(function () {
            return map.getAll(['key0', 'key1']);
        }).then(function (values) {
            return expect(values).to.deep.have.members([
                ['key0', 'val0'], ['key1', 'val1']
            ]);
        });
    });

    it('loadAll with replaceExisting=false does not override', function () {
        return map.evictAll().then(function () {
            return map.putTransient('key0', 'newval0');
        }).then(function () {
            return map.putTransient('key1', 'newval1');
        }).then(function () {
            return map.loadAll(['key0', 'key1'], false);
        }).then(function () {
            return map.getAll(['key0', 'key1']);
        }).then(function (values) {
            return expect(values).to.deep.have.members([
                ['key0', 'newval0'], ['key1', 'newval1']
            ]);
        });
    });

    it('evict', function () {
        return map.evict('key0').then(function () {
            return map.size();
        }).then(function (s) {
            return expect(s).to.equal(9);
        });
    });

    it('evict_nonexist_key', function () {
        return map.evict('non-key').then(function () {
            return map.size();
        }).then(function (s) {
            return expect(s).to.equal(10);
        });
    });

    it('evictAll', function () {
        return map.evictAll().then(function () {
            return map.size();
        }).then(function (s) {
            return expect(s).to.equal(0);
        });
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
