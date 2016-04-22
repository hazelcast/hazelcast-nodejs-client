var expect = require("chai").expect;
var HazelcastClient = require("../.").Client;
var Q = require("q");
var Controller = require('./RC');

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
                map = hazelcastClient.getMap('test-map');
                client = hazelcastClient;
            });
        });
    });

    beforeEach(function(done) {
        this.timeout(10000);
        var promises = [];
        for (var i = 0; i < 100; i++) {
            var promise = map.put('key' + i, 'val' + i);
            promises.push(promise);
        }
        Q.all(promises).then(function () {
            done();
        });
    });

    after(function() {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

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

    it('put with ttl removes value after ttl', function(done) {
        return map.put('ttl-to-remove', 'val', 1500).then(function() {
            setTimeout(function() {
                map.get('ttl-to-remove').then(function(val) {
                    try {
                        expect(val).to.be.null;
                        done();
                    } catch (e) {
                        done(e);
                    }
                })
            }, 1500);
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
            expect(size).to.equal(100);
        })
    });

    it('basic_remove_return_value', function() {
        return map.remove('key10').then(function(val) {
            return expect(val).to.equal('val10');
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
        return map.containsKey('key25').then(function(val) {
           return expect(val).to.be.true;
        });
    });

    it('containsKey_false', function() {
        return map.containsKey('non-existent').then(function(val) {
            return expect(val).to.be.false;
        });
    });

    it('containsValue_true', function() {
        return map.containsValue('val25').then(function(val) {
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


