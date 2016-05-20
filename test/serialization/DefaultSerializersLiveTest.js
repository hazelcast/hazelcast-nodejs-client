var Client = require('../../.').Client;
var RC = require('../RC');
var expect = require('chai').expect;
describe('Default serializers with live instance', function() {
    var cluster;
    var member;
    var client;
    var map;

    before(function() {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function() {
            return RC.startMember(cluster.id);
        }).then(function (m) {
            member = m;
            return Client.newHazelcastClient();
        }).then(function (cl) {
            client = cl;
            map = client.getMap('test');
        });
    });

    after(function() {
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    function _generateGet(key) {
        return 'var StringArray = Java.type("java.lang.String[]");' +
            'function foo() {' +
            '   var map = instance_0.getMap("' + map.getName() + '");' +
            '   var res = map.get("' + key + '");' +
            '   if (res.getClass().isArray()) {' +
            '       return Java.from(res);' +
            '   } else {' +
            '       return res;' +
            '   }' +
            '}' +
            'result = ""+foo();'
    }

    it('string', function () {
        return map.put('testStringKey', 'testStringValue').then(function () {
            return RC.executeOnController(cluster.id, _generateGet('testStringKey'), 1);
        }).then(function(response) {
            return expect(response.result.toString()).to.equal('testStringValue');
        })
    });

    it('number', function () {
        return map.put('a', 23).then(function () {
            return RC.executeOnController(cluster.id, _generateGet('a'), 1);
        }).then(function(response) {
            return expect(Number.parseInt(response.result.toString())).to.equal(23);
        })
    });

    it('array', function() {
        return map.put('a', ['a', 'v', 'vg']).then(function () {
            return RC.executeOnController(cluster.id, _generateGet('a'), 1);
        }).then(function(response) {
            return expect(response.result.toString()).to.equal(['a', 'v', 'vg'].toString());
        })
    })
});
