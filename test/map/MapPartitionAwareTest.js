var Client = require('../../.').Client;
var Controller = require('../RC');
var expect = require('chai').expect;
var Promise = require('bluebird');

describe('Map Partition Aware', function() {

    var cluster;
    var numOfEntries = 10000;
    var memberCount = 3;
    var members = [];
    var client;
    var map;
    var mapName = 'testMap';

    function PartitionAwareKey(key, partitionKey) {
        this.key = key;
        this.partitionKey = partitionKey;
    }

    PartitionAwareKey.prototype.getPartitionKey = function() {
        return this.partitionKey;
    };

    function getLocalMapStats(serverInstance) {
        return 'function getLocalMapStats() {' +
            '   var map = instance_' + serverInstance + '.getMap("' + mapName + '");' +
            '   return map.getLocalMapStats().getOwnedEntryCount();' +
            '}' +
            'result=""+getLocalMapStats();';
    }

    function _fillMap(map, ssize) {
        var entryList = [];
        for (var i = 0; i < ssize; i++) {
            entryList.push([new PartitionAwareKey(''+Math.random(), 'specificKey'), ''+Math.random()]);
        }
        return map.putAll(entryList);
    }

    before(function() {
        expect(memberCount, 'This test should have at least 2 members.').to.be.at.least(2);
        this.timeout(30000);
        return Controller.createCluster(null, null).then(function(c) {
            cluster = c;
            for (var i = 0; i < memberCount; i++) {
                members.push(Controller.startMember(cluster.id));
            }
            return Promise.all(members);
        }).then(function(m) {
            members = m;
            return Client.newHazelcastClient();
        }).then(function(cl) {
            client = cl;
        });
    });

    after(function() {
        this.timeout(30000);
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    beforeEach(function() {
        map = client.getMap(mapName);
    });

    afterEach(function() {
        return map.destroy();
    });

    it('put', function() {
        this.timeout(20000);
        return _fillMap(map, numOfEntries).then(function(newVal) {
            var promises = members.map(function(member, index) {
                return Controller.executeOnController(cluster.id, getLocalMapStats(index), 1);
            });
            return Promise.all(promises);
        }).then(function(stats) {
            var entriesPerMember = stats.map(function(item) {
                return Number(item.result);
            });
            var expectedArray = [numOfEntries];
            for (var i = 0; i < memberCount - 1; i++) {
                expectedArray.push(0);
            }
            return expect(entriesPerMember, 'One member should have all of the entries. The rest will have 0 entries.').to.have.members(expectedArray);
        });
    });

    it('get', function() {
        var key = new PartitionAwareKey('key', 'partKey');
        return map.put(key, 'value').then(function() {
            return map.get(key);
        }).then(function(val) {
            return expect(val).to.equal('value');
        });
    })
});
