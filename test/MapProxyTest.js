var expect = require("chai").expect;
var HazelcastClient = require("../.").Client;
var Q = require("q");
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
        return Q.all(promises);
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
        return Q.all([
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
        return map.lock('key0').then(function() {
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


