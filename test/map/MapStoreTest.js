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
var HazelcastClient = require("../../lib/index.js").Client;
var Controller = require('./../RC');
var fs = require('fs');
var _fillMap = require('../Util').fillMap;
var promiseWaitMilliseconds = require('../Util').promiseWaitMilliseconds;
var Util = require('../Util');

describe('MapStore', function () {
    var cluster;
    var client;
    var map;

    before(function () {
        this.timeout(32000);
        return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_mapstore.xml', 'utf8')).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function (member) {
            return HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function () {
        return client.getMap('mapstore-test').then(function (mp) {
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

    it('loadAll with no arguments loads all keys', function () {
        return _fillMap(map).then(function () {
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
        Util.markServerVersionAtLeast(this, client, '3.11');
        var listenerObj = {
            loaded: function (entryEvent) {
                try {
                    expect(entryEvent.name).to.equal('mapstore-test');
                    expect(entryEvent.key).to.equal('some-key');
                    expect(entryEvent.value).to.equal('some-value');
                    expect(entryEvent.oldValue).to.be.undefined;
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
                return map.put('some-key', 'some-value', 100)
            }).then(function () {
                return promiseWaitMilliseconds(2000);
            }).then(function () {
                return map.get('some-key');
            });
    });
});
