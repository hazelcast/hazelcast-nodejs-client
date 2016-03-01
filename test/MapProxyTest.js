var expect = require("chai").expect;
var HazelcastClient = require("../lib/HazelcastClient");


describe("MapProxy Test", function() {

    var client;
    var map;

    before(function () {
        return HazelcastClient.newHazelcastClient().then(function(hazelcastClient) {
            map = hazelcastClient.getMap('test-map');
            client = hazelcastClient;
        });
    });

    beforeEach(function(done) {
        for(i=0; i<100; i++) {
            map.put('key'+i, 'val'+i);
        }
        done();
    });

    after(function() {
        return map.destroy();
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

});


