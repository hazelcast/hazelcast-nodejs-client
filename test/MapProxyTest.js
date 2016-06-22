var expect = require("chai").expect;
var HazelcastClient = require("../.").Client;
var Promise = require("bluebird");
var Controller = require('./RC');
var Util = require('./Util');

describe("MapProxy Test", function() {

    var cluster;
    var client;
    var map;

    before(function () {
        this.timeout(32000);
        return Controller.createCluster(null, null).then(function(res) {
            cluster = res;
            return Controller.startMember(cluster.id);
        }).then(function(member) {
            return HazelcastClient.newHazelcastClient().then(function(hazelcastClient) {
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function() {
        map = client.getMap('test');
        return _fillMap();
    });

    afterEach(function() {
        return map.destroy();
    });

    after(function() {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    function _fillMap(size) {
        if (size == void 0) {
            size = 10;
        }
        var promises = [];
        for (var i = 0; i< size; i++) {
            promises.push(map.put('key' + i, 'val' + i));
        }
        return Promise.all(promises);
    }

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

    it('get_basic', function() {
        return map.get('key0').then(function(v) {
            return expect(v).to.equal('val0');
        })
    });

    it('get_return_null_on_non_existent', function() {
        return map.get('non-existent').then(function(val) {
            return expect(val).to.be.null;
        });
    });

    it('put_return_value_not_null', function() {
        return map.put('key0','new-val').then(function(val) {
            return expect(val).to.equal('val0');
        });
    });

    it('put with ttl puts value to map', function() {
        return map.put('key-with-ttl', 'val-with-ttl', 3000).then(function() {
            return map.get('key-with-ttl').then(function(val) {
                return expect(val).to.equal('val-with-ttl');
            });
        });
    });

    it('put with ttl removes value after ttl', function() {
        return map.put('key10', 'val10', 1000).then(function() {
            return map.get('key10');
        }).then(function(val) {
            return expect(val).to.equal('val10');
        }).then(function() {
            return Util.promiseLater(1000, map.get.bind(map, 'key10'));
        }).then(function(val) {
            return expect(val).to.be.null;
        });
    });

    it('clear', function() {
        return map.clear().then(function() {
            return map.isEmpty();
        }).then(function(val) {
            return expect(val).to.be.true;
        });
    });

    it('size', function() {
        return map.size().then(function(size) {
            expect(size).to.equal(10);
        })
    });

    it('basic_remove_return_value', function() {
        return map.remove('key9').then(function(val) {
            return expect(val).to.equal('val9');
        });
    });

    it('basic_remove', function() {
        return map.remove('key1').then(function() {
            return map.get('key1');
        }).then(function(val) {
            return expect(val).to.be.null;
        });
    });

    it('remove_if_equal_false', function() {
        return map.remove('key1', 'wrong').then(function(val) {
            return expect(val).to.be.false;
        });
    });

    it('remove_if_equal_true', function() {
        return map.remove('key1', 'val1').then(function(val) {
            return expect(val).to.be.true;
        });
    });

    it('containsKey_true', function() {
        return map.containsKey('key1').then(function(val) {
           return expect(val).to.be.true;
        });
    });

    it('containsKey_false', function() {
        return map.containsKey('non-existent').then(function(val) {
            return expect(val).to.be.false;
        });
    });

    it('containsValue_true', function() {
        return map.containsValue('val1').then(function(val) {
            return expect(val).to.be.true;
        });
    });

    it('containsValue_false', function() {
        return map.containsValue('non-existent').then(function(val) {
            return expect(val).to.be.false;
        });
    });

    it('putAll', function(done) {
        var arr = [
            ['pa_k0', 'pa_v0'],
            ['pa_k1', 'pa_v1'],
            ['pa_k2', 'pa_v2'],
            ['pa_k3', 'pa_v3'],
            ['pa_k4', 'pa_v4']
        ];
        var returnedCorrectly = 0;
        var verify = function (expected) {
            return function(val) {
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
        map.putAll(arr).then(function() {
            map.get(arr[0][0]).then(verify(arr[0][1]));
            map.get(arr[1][0]).then(verify(arr[1][1]));
            map.get(arr[2][0]).then(verify(arr[2][1]));
            map.get(arr[3][0]).then(verify(arr[3][1]));
            map.get(arr[4][0]).then(verify(arr[4][1]));
        })
    });

    it('getAll', function() {
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

    it('delete', function() {
        return map.put('key-to-delete', 'value').then(function() {
            return map.delete('key-to-delete');
        }).then(function() {
            return map.get('key-to-delete');
        }).then(function(val) {
            return expect(val).to.be.null;
        })
    });

    it('entrySet_notNull', function() {
        var entryMap = client.getMap('entry-map');
        var samples = [
            ['k1', 'v1'],
            ['k2', 'v2'],
            ['k3', 'v3']
        ];
        return Promise.all([
            entryMap.put(samples[0][0], samples[0][1]),
            entryMap.put(samples[1][0], samples[1][1]),
            entryMap.put(samples[2][0], samples[2][1])
        ]).then(function() {
            return entryMap.entrySet();
        }).then(function(entrySet) {
            return expect(entrySet).to.deep.have.members(samples);
        });
    });

    it('entrySet_null', function() {
        var entryMap = client.getMap('null-entry-map');
        return entryMap.entrySet().then(function(entrySet) {
            return expect(entrySet).to.be.empty;
        });
    });

    it('evict', function() {
        return map.evict('key0').then(function() {
            return map.size();
        }).then(function(s) {
            return expect(s).to.equal(9);
        });
    });

    it('evict_nonexist_key', function() {
        return map.evict('non-key').then(function() {
            return map.size();
        }).then(function(s) {
            return expect(s).to.equal(10);
        });
    });

    it('evictAll', function() {
        return map.evictAll().then(function() {
            return map.size();
        }).then(function(s) {
            return expect(s).to.equal(0);
        });
    });

    it('flush', function() {
        return map.flush();
    });

    it('lock', function() {
        return map.lock('key0').then(function() {
            return map.isLocked('key0');
        }).then(function(isLocked) {
            return expect(isLocked).to.be.true;
        }).finally(function() {
            return map.unlock('key0');
        });
    });

    it('unlock', function() {
        return map.lock('key0').then(function() {
            return map.unlock('key0');
        }).then(function() {
            return map.isLocked('key0');
        }).then(function(isLocked) {
            return expect(isLocked).to.be.false;
        });
    });

    it('forceUnlock', function() {
        var script =
            'function lockByServer() {' +
            '   var map = instance_0.getMap("' + map.getName() + '");' +
            '   map.lock("key0");' +
            '   return map.isLocked("key0")' +
            '}' +
            'result=""+lockByServer();';
        return Controller.executeOnController(cluster.id, script, 1).then(function(s) {
            return map.forceUnlock('key0');
        }).then(function() {
            return map.isLocked('key0');
        }).then(function(isLocked) {
            return expect(isLocked).to.be.false;
        });
    });

    it('keySet', function() {
        return map.keySet().then(function(keySet) {
            return expect(keySet).to.deep.have.members([
                'key0', 'key1', 'key2', 'key3', 'key4',
                'key5', 'key6', 'key7', 'key8', 'key9'
            ]);
        });
    });

    it('loadAll');

    it('putIfAbsent_success', function() {
        return map.putIfAbsent('key10', 'new-val').then(function(oldVal) {
            return expect(oldVal).to.be.null;
        }).then(function() {
            return map.get('key10');
        }).then(function(val) {
            return expect(val).to.equal('new-val');
        });
    });

    it('putIfAbsent_fail', function() {
        return map.putIfAbsent('key9', 'new-val').then(function() {
            return map.get('key9');
        }).then(function(val) {
            return expect(val).to.equal('val9');
        });
    });

    it('putIfAbsent_with_ttl', function () {
        return map.putIfAbsent('key10', 'new-val', 1000).then(function() {
            return map.get('key10');
        }).then(function(val) {
            return expect(val).to.equal('new-val');
        }).then(function() {
            return Util.promiseLater(1000, map.get.bind(map, 'key10'));
        }).then(function(val) {
            return expect(val).to.be.null;
        });

    });

    it('putTransient', function() {
        return map.putTransient('key10', 'val10').then(function() {
            return map.get('key10');
        }).then(function(val) {
            return expect(val).to.equal('val10');
        });
    });

    it('putTransient_withTTL', function() {
        return map.putTransient('key10', 'val10', 1000).then(function() {
            return map.get('key10');
        }).then(function(val) {
            return expect(val).to.equal('val10');
        }).then(function() {
            return Util.promiseLater(1000, map.get.bind(map, 'key10'))
        }).then(function(val) {
            return expect(val).to.be.null;
        });
    });

    it('replace', function() {
        return map.replace('key9', 'new-val').then(function(oldVal) {
            return expect(oldVal).to.equal('val9');
        }).then(function() {
            return map.get('key9');
        }).then(function(val) {
            return expect(val).to.equal('new-val');
        });
    });

    it('replaceIfSame_success', function() {
        return map.replaceIfSame('key9', 'val9', 'new-val').then(function(success) {
            return expect(success).to.be.true;
        }).then(function() {
            return map.get('key9');
        }).then(function(val) {
            return expect(val).to.equal('new-val');
        });
    });

    it('replaceIfSame_fail', function() {
        return map.replaceIfSame('key9', 'wrong', 'new-val', function(success) {
            return expect(success).to.be.false;
        }).then(function() {
            return map.get('key9');
        }).then(function(val) {
            return expect(val).to.equal('val9');
        });
    });

    it('set', function() {
        return map.set('key10', 'val10').then(function() {
            return map.get('key10');
        }).then(function(val) {
            return expect(val).to.equal('val10');
        })
    });

    it('set_withTTL', function() {
        return map.set('key10', 'val10', 1000).then(function() {
            return map.get('key10');
        }).then(function(val) {
            return expect(val).to.equal('val10');
        }).then(function() {
            return Util.promiseLater(1000, map.get.bind(map, 'key10'));
        }).then(function(val) {
            return expect(val).to.be.null;
        })
    });

    it('values', function() {
        return map.values().then(function(vals) {
            return expect(vals).to.deep.have.members([
                'val0', 'val1', 'val2', 'val3', 'val4',
                'val5', 'val6', 'val7', 'val8', 'val9'
            ]);
        });
    });

    it('values_null', function() {
        return map.clear().then(function() {
            return map.values();
        }).then(function(vals) {
            return expect(vals).to.have.lengthOf(0);
        })
    });

    it('getEntryView', function(done) {
        map.getEntryView('key0').then(function(entry) {
            try {
                expect(entry.key).to.equal('key0');
                expect(entry.value).to.equal('val0');
                expect(entry.cost).to.be.above(0);
                expect(entry.creationTime).to.not.equal(0);
                expect(entry.expirationTime).to.not.equal(0);
                expect(entry.hits).to.not.equal(0);
                expect(entry.lastAccessTime).to.not.equal(0);
                expect(entry.lastStoreTime).to.not.equal(0);
                expect(entry.lastUpdateTime).to.not.equal(0);
                expect(entry.version).to.not.equal(0);
                expect(entry.evictionCriteriaNumber).to.not.equal(0);
                expect(entry.ttl).to.not.equal(0);
                done();
            } catch (e) {
                done(e);
            }
        });
    });

    it('getEntryView_null', function() {
        return map.getEntryView('non-exist').then(function(entry) {
            return expect(entry).to.be.null;
        });
    });

    it('addIndex', function() {
        return Promise.all([
            map.addIndex('length', false),
            map.addIndex('length', true)
        ]);
    });

    it('tryLock_success', function() {
        return map.tryLock('key0').then(function(success) {
            return expect(success).to.be.true;
        });
    });

    it('tryLock_fail', function() {
        return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function(s) {
            return map.tryLock('key0');
        }).then(function(success) {
            return expect(success).to.be.false;
        });
    });

    it('tryLock_success with timeout', function() {
        return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function() {
            var promise = map.tryLock('key0', 1000);
            Controller.executeOnController(cluster.id, _generateUnlockScript(map.getName(), '"key0"'), 1);
            return promise;
        }).then(function(success) {
            return expect(success).to.be.true;
        });
    });

    it('tryLock_fail with timeout', function() {
        return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function() {
            return map.tryLock('key0', 1000);
        }).then(function(success) {
            return expect(success).to.be.false;
        });
    });

    it('tryPut success', function() {
        return map.tryPut('key0', 'val0', 1000).then(function(success) {
            return expect(success).to.be.true;
        })
    });

    it('tryPut fail', function() {
        return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function() {
            return map.tryPut('key0', 'val0', 200);
        }).then(function(success) {
            return expect(success).to.be.false;
        })
    });

    it('tryRemove success', function() {
        return map.tryRemove('key0', 1000).then(function(success) {
            return expect(success).to.be.true;
        })
    });

    it('tryRemove fail', function() {
        return Controller.executeOnController(cluster.id, _generateLockScript(map.getName(), '"key0"'), 1).then(function() {
            return map.tryRemove('key0', 200);
        }).then(function(success) {
            return expect(success).to.be.false;
        })
    });

    it('addEntryListener on map entryAdded', function(done) {
        var listenerObject = {
            added: function(key, oldValue, value, mergingValue) {
                try {
                    expect(key).to.equal('key10');
                    expect(oldValue).to.be.null;
                    expect(value).to.be.null;
                    expect(mergingValue).to.be.null;
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        map.addEntryListener(listenerObject).then(function() {
            map.put('key10', 'val10');
        });
    });

    it('addEntryListener on map entryAdded', function(done) {
        var listenerObject = {
            added: function(key, oldValue, value, mergingValue) {
                try {
                    expect(key).to.equal('key10');
                    expect(oldValue).to.be.null;
                    expect(value).to.equal('val10');
                    expect(mergingValue).to.be.null;
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        map.addEntryListener(listenerObject, undefined, true).then(function() {
            map.put('key10', 'val10');
        });
    });

    it('addEntryListener on map entryUpdated', function(done) {
        var listenerObject = {
            updated: function(key, oldValue, value, mergingValue) {
                try {
                    expect(key).to.equal('key0');
                    expect(oldValue).to.be.null;
                    expect(value).to.be.null;
                    expect(mergingValue).to.be.null;
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        map.addEntryListener(listenerObject).then(function() {
            map.put('key0', 'new-val');
        });
    });

    it('addEntryListener on key entryRemoved', function(done) {
        var listenerObject = {
            removed: function(key, oldValue, value, mergingValue) {
                try {
                    expect(key).to.equal('key1');
                    expect(oldValue).to.be.null;
                    expect(value).to.be.null;
                    expect(mergingValue).to.be.null;
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        map.addEntryListener(listenerObject, 'key1', false).then(function() {
            map.remove('key1');
        });
    });

    it('addEntryListener on key entryRemoved includeValue=yes', function(done) {
        var listenerObject = {
            removed: function(key, oldValue, value, mergingValue) {
                try {
                    expect(key).to.equal('key1');
                    expect(oldValue).to.equal('val1');
                    expect(value).to.be.null;
                    expect(mergingValue).to.be.null;
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        map.addEntryListener(listenerObject, 'key1', true).then(function() {
            map.remove('key1');
        });
    });

    it('addEntryListener on key evicted includeValue=yes', function(done) {
        var listenerObject = {
            evicted: function(key, oldValue, value, mergingValue) {
                try {
                    expect(key).to.equal('key1');
                    expect(oldValue).to.equal('val1');
                    expect(value).to.be.null;
                    expect(mergingValue).to.be.null;
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        map.addEntryListener(listenerObject, 'key1', true).then(function() {
            map.evict('key1')
        });
    });

    it('addEntryListener on map evictAll', function(done) {
        var listenerObject = {
            evictedAll: function(key, oldValue, value, mergingValue, numberOfAffectedEntries) {
                try {
                    expect(key).to.be.null;
                    expect(oldValue).to.be.null;
                    expect(value).to.be.null;
                    expect(mergingValue).to.be.null;
                    expect(numberOfAffectedEntries).to.equal(10);
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        map.addEntryListener(listenerObject).then(function() {
            map.evictAll();
        });
    });

    it('addEntryListener on map clearAll', function(done) {
        var listenerObject = {
            clearedAll: function(key, oldValue, value, mergingValue, numberOfAffectedEntries) {
                try {
                    expect(key).to.be.null;
                    expect(oldValue).to.be.null;
                    expect(value).to.be.null;
                    expect(mergingValue).to.be.null;
                    expect(numberOfAffectedEntries).to.equal(10);
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        map.addEntryListener(listenerObject).then(function() {
            map.clear();
        });
    });

    it('removeEntryListener with correct id', function() {
        return map.addEntryListener({}).then(function(listenerId) {
            return map.removeEntryListener(listenerId);
        }).then(function(success) {
            return expect(success).to.be.true;
        });
    });

    it('removeEntryListener with wrong id', function() {
        return map.removeEntryListener('aaa').then(function(success) {
            return expect(success).to.be.false;
        });
    });

    it('destroy', function() {
        var dmap = client.getMap('map-to-be-destroyed');
        return dmap.put('key', 'val').then(function() {
            return dmap.destroy();
        }).then(function() {
            var newMap = client.getMap('map-to-be-destroyed');
            return newMap.size();
        }).then(function(s) {
            expect(s).to.equal(0);
        })
    });
});
