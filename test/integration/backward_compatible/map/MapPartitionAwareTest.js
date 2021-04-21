/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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

const { expect } = require('chai');
const RC = require('../../RC');
const { Client } = require('../../../../');

describe('MapPartitionAwareTest', function () {

    const numOfEntries = 10000;
    const memberCount = 3;
    const mapName = 'testMap';

    let cluster;
    let client;
    let members = [];
    let map;

    class PartitionAwareKey {
        constructor(key, partitionKey) {
            this.key = key;
            this.partitionKey = partitionKey;
        }
    }

    function getLocalMapStats(serverInstance) {
        return 'function getLocalMapStats() {' +
            '   var map = instance_' + serverInstance + '.getMap("' + mapName + '");' +
            '   return map.getLocalMapStats().getOwnedEntryCount();' +
            '}' +
            'result=""+getLocalMapStats();';
    }

    async function fillMap(map, size) {
        const entryList = [];
        for (let i = 0; i < size; i++) {
            entryList.push([new PartitionAwareKey('' + i, 'specificKey'), '' + Math.random()]);
        }
        return map.putAll(entryList);
    }

    before(async function () {
        expect(memberCount, 'This test should have at least 2 members.').to.be.at.least(2);
        cluster = await RC.createCluster(null, null);
        for (let i = 0; i < memberCount; i++) {
            members.push(await RC.startMember(cluster.id));
        }
        members = await Promise.all(members);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    beforeEach(async function () {
        map = await client.getMap(mapName);
    });

    afterEach(async function () {
        return map.destroy();
    });

    it('put', async function () {
        await fillMap(map, numOfEntries);
        const stats = await Promise.all(members.map(async (member, index) => {
            return RC.executeOnController(cluster.id, getLocalMapStats(index), 1);
        }));
        const entriesPerMember = stats.map((item) => {
            return Number(item.result);
        });
        const expectedArray = [numOfEntries];
        for (let i = 0; i < memberCount - 1; i++) {
            expectedArray.push(0);
        }
        expect(entriesPerMember, 'One member should have all of the entries. The rest will have 0 entries.')
            .to.have.members(expectedArray);
    });

    it('get', async function () {
        const key = new PartitionAwareKey('key', 'partKey');
        await map.put(key, 'value');
        const val = await map.get(key);
        expect(val).to.equal('value');
    });
});
