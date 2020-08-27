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

const Client = require('../../.').Client;
const RC = require('../RC');
const expect = require('chai').expect;
const Promise = require('bluebird');

describe('MapPartitionAwareTest', function () {

    let cluster, client;
    const numOfEntries = 10000;
    const memberCount = 3;
    let members = [];
    const mapName = 'testMap';
    let map;

    function PartitionAwareKey(key, partitionKey) {
        this.key = key;
        this.partitionKey = partitionKey;
    }

    function getLocalMapStats(serverInstance) {
        return 'function getLocalMapStats() {' +
            '   var map = instance_' + serverInstance + '.getMap("' + mapName + '");' +
            '   return map.getLocalMapStats().getOwnedEntryCount();' +
            '}' +
            'result=""+getLocalMapStats();';
    }

    function fillMap(map, size) {
        const entryList = [];
        for (let i = 0; i < size; i++) {
            entryList.push([new PartitionAwareKey('' + i, 'specificKey'), '' + Math.random()]);
        }
        return map.putAll(entryList);
    }

    before(function () {
        expect(memberCount, 'This test should have at least 2 members.').to.be.at.least(2);
        this.timeout(30000);
        return RC.createCluster(null, null).then(function (c) {
            cluster = c;
            for (let i = 0; i < memberCount; i++) {
                members.push(RC.startMember(cluster.id));
            }
            return Promise.all(members);
        }).then(function (m) {
            members = m;
            return Client.newHazelcastClient({ clusterName: cluster.id });
        }).then(function (cl) {
            client = cl;
        });
    });

    after(function () {
        return client.shutdown()
            .then(() => RC.terminateCluster(cluster.id));
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
        return fillMap(map, numOfEntries).then(function (newVal) {
            const promises = members.map(function (member, index) {
                return RC.executeOnController(cluster.id, getLocalMapStats(index), 1);
            });
            return Promise.all(promises);
        }).then(function (stats) {
            const entriesPerMember = stats.map(function (item) {
                return Number(item.result);
            });
            const expectedArray = [numOfEntries];
            for (let i = 0; i < memberCount - 1; i++) {
                expectedArray.push(0);
            }
            return expect(entriesPerMember, 'One member should have all of the entries. The rest will have 0 entries.')
                .to.have.members(expectedArray);
        });
    });

    it('get', function () {
        const key = new PartitionAwareKey('key', 'partKey');
        return map.put(key, 'value').then(function () {
            return map.get(key);
        }).then(function (val) {
            return expect(val).to.equal('value');
        });
    })
});
