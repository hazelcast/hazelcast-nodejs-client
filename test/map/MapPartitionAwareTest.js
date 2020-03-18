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

var Client = require('../../.').Client;
var Controller = require('../RC');
var expect = require('chai').expect;
var Promise = require('bluebird');

describe('Map Partition Aware', function () {

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

    PartitionAwareKey.prototype.getPartitionKey = function () {
        return this.partitionKey;
    };

    function getLocalMapStats(serverInstance) {
        return 'function getLocalMapStats() {' +
            '   var map = instance_' + serverInstance + '.getMap("' + mapName + '");' +
            '   return map.getLocalMapStats().getOwnedEntryCount();' +
            '}' +
            'result=""+getLocalMapStats();';
    }

    function _fillMap(map, size) {
        var entryList = [];
        for (var i = 0; i < size; i++) {
            entryList.push([new PartitionAwareKey('' + i, 'specificKey'), '' + Math.random()]);
        }
        return map.putAll(entryList);
    }

    before(function () {
        expect(memberCount, 'This test should have at least 2 members.').to.be.at.least(2);
        this.timeout(30000);
        return Controller.createCluster(null, null).then(function (c) {
            cluster = c;
            for (var i = 0; i < memberCount; i++) {
                members.push(Controller.startMember(cluster.id));
            }
            return Promise.all(members);
        }).then(function (m) {
            members = m;
            return Client.newHazelcastClient();
        }).then(function (cl) {
            client = cl;
        });
    });

    after(function () {
        this.timeout(30000);
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    beforeEach(function () {
        return client.getMap(mapName).then(function (mp) {
            map = mp;
        });
    });

    afterEach(function () {
        return map.destroy();
    });

    it('put', function () {
        this.timeout(15000);
        return _fillMap(map, numOfEntries).then(function (newVal) {
            var promises = members.map(function (member, index) {
                return Controller.executeOnController(cluster.id, getLocalMapStats(index), 1);
            });
            return Promise.all(promises);
        }).then(function (stats) {
            var entriesPerMember = stats.map(function (item) {
                return Number(item.result);
            });
            var expectedArray = [numOfEntries];
            for (var i = 0; i < memberCount - 1; i++) {
                expectedArray.push(0);
            }
            return expect(entriesPerMember, 'One member should have all of the entries. The rest will have 0 entries.').to.have.members(expectedArray);
        });
    });

    it('get', function () {
        var key = new PartitionAwareKey('key', 'partKey');
        return map.put(key, 'value').then(function () {
            return map.get(key);
        }).then(function (val) {
            return expect(val).to.equal('value');
        });
    })
});
