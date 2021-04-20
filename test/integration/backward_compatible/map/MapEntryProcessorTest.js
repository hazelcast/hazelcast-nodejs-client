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
const fs = require('fs');

const RC = require('../../RC');
const {
    Client,
    Predicates
} = require('../../../../');
const TestUtil = require('../../../TestUtil');
const identifiedFactory = require('../../javaclasses/IdentifiedFactory');
const IdentifiedEntryProcessor = require('../../javaclasses/IdentifiedEntryProcessor');

describe('EntryProcessorTest', function () {

    const MAP_SIZE = 1000;

    let cluster;
    let client;
    let map;

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_identifiedfactory.xml', 'utf8'));
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            serialization: {
                dataSerializableFactories: {
                    66: identifiedFactory
                }
            }
        });
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    beforeEach(async function () {
        map = await client.getMap('map-to-be-processed');
        await TestUtil.fillMap(map, MAP_SIZE, '', '');
    });

    afterEach(async function () {
        return map.destroy();
    });

    it('executeOnEntries should modify entries', async function () {
        await map.executeOnEntries(new IdentifiedEntryProcessor('processed'));
        const entries = await map.entrySet();
        expect(entries.every((entry) => {
            return entry[1] === 'processed';
        })).to.be.true;
    });

    it('executeOnEntries should return modified entries', async function () {
        const entries = await map.executeOnEntries(new IdentifiedEntryProcessor('processed'));
        expect(entries).to.have.lengthOf(MAP_SIZE);
        expect(entries.every((entry) => {
            return entry[1] === 'processed';
        })).to.be.true;
    });

    it('executeOnEntries with predicate should modify entries', async function () {
        await map.executeOnEntries(new IdentifiedEntryProcessor('processed'), Predicates.regex('this', '^[01]$'));
        const entries = await map.getAll(['0', '1', '2']);
        expect(entries).to.deep.have.members([['0', 'processed'], ['1', 'processed'], ['2', '2']]);
    });

    it('executeOnEntries with predicate should return modified entries', async function () {
        const entries = await map.executeOnEntries(new IdentifiedEntryProcessor('processed'),
            Predicates.regex('this', '^[01]$'));
        expect(entries).to.have.lengthOf(2);
        expect(entries.every((entry) => {
            return entry[1] === 'processed';
        })).to.be.true;
    });

    it('executeOnKey should return modified value', async function () {
        const retVal = await map.executeOnKey('4', new IdentifiedEntryProcessor('processed'));
        expect(retVal).to.equal('processed');
    });

    it('executeOnKey should modify the value', async function () {
        await map.executeOnKey('4', new IdentifiedEntryProcessor('processed'));
        const value = await map.get('4');
        expect(value).to.equal('processed');
    });

    it('executeOnKeys should return modified entries', async function () {
        const entries = await map.executeOnKeys(['4', '5'], new IdentifiedEntryProcessor('processed'));
        expect(entries).to.deep.have.members([['4', 'processed'], ['5', 'processed']]);
    });

    it('executeOnKeys should modify the entries', async function () {
        await map.executeOnKeys(['4', '5'], new IdentifiedEntryProcessor('processed'));
        const entries = await map.getAll(['4', '5']);
        expect(entries).to.deep.have.members([['4', 'processed'], ['5', 'processed']]);
    });

    it('executeOnKeys with empty array should return empty array', async function () {
        const entries = await map.executeOnKeys([], new IdentifiedEntryProcessor('processed'));
        expect(entries).to.have.lengthOf(0);
    });
});
