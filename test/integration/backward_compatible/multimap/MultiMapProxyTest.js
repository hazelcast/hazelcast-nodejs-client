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
const TestUtil = require('../../../TestUtil');

describe('MultiMapProxyTest', function () {

    let cluster;
    let client;
    let map;

    before(async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id
        });
    });

    beforeEach(async function () {
        map = await client.getMultiMap('test');
    });

    afterEach(async function () {
        return map.destroy();
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('adds and retrieves a single item', async function () {
        await map.put(1, 1);
        const values = await map.get(1);
        expect(values.toArray()).to.deep.equal([1]);
    });

    it('adds and retrieves multiple items', async function () {
        await map.put(1, 1);
        await map.put(1, 2);
        const values = await map.get(1);
        expect(values.toArray().sort()).to.deep.equal([1, 2]);
    });

    it('reports change after put', async function () {
        await map.put(1, 1);
        const changed = await map.put(1, 2);
        expect(changed).to.be.true;
    });

    it('reports no change after put', async function () {
        await map.put(1, 1);
        const changed = await map.put(1, 1);
        expect(changed).to.be.false;
    });

    it('adds and removes a single entry', async function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(1, 5)];
        await Promise.all(puts);
        await map.remove(1, 3);
        const values = await map.get(1);
        expect(values.toArray().sort()).to.deep.equal([1, 5]);
    });

    it('reports change after remove', async function () {
        await map.put(1, 1);
        const removed = await map.remove(1, 1);
        expect(removed).to.be.true;
    });

    it('reports no change after remove', async function () {
        await map.put(1, 1);
        const removed = await map.remove(1, 2);
        expect(removed).to.be.false;
    });

    it('removes all values from key', async function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(1, 5)];
        await Promise.all(puts);
        const oldValues = await map.removeAll(1);
        expect(oldValues.toArray().sort()).to.deep.equal([1, 3, 5]);
        const values = await map.get(1);
        expect(values.toArray()).to.be.empty;
    });

    it('returns a key set', async function () {
        const puts = [map.put(1, 1), map.put(2, 3), map.put(3, 5)];
        await Promise.all(puts);
        const keySet = await map.keySet();
        expect(keySet.sort()).to.deep.equal([1, 2, 3]);
    });

    it('returns all values', async function () {
        const puts = [map.put(1, 1), map.put(2, 3), map.put(3, 5)];
        await Promise.all(puts);
        const values = await map.values();
        expect(values.toArray().sort()).to.deep.equal([1, 3, 5]);
    });

    it('returns entry set', async function () {
        const puts = [map.put(1, 1), map.put(2, 3), map.put(3, 5)];
        await Promise.all(puts);
        const entrySet = await map.entrySet();
        const initialValue = {};
        const entries = entrySet.reduce((obj, tuple) => {
            obj[tuple[0]] = tuple[1];
            return obj;
        }, initialValue);
        const expected = {
            1: 1,
            2: 3,
            3: 5
        };
        expect(entries).to.deep.equal(expected);
    });

    it('contains a key', async function () {
        await map.put(1, 1);
        const contains = await map.containsKey(1);
        expect(contains).to.be.true;
    });

    it('does not contain a key', async function () {
        await map.put(1, 1);
        const contains = await map.containsKey(4);
        expect(contains).to.be.false;
    });

    it('contains a value', async function () {
        const puts = [map.put(1, 2), map.put(1, 3), map.put(3, 5)];
        await Promise.all(puts);
        const contains = await map.containsValue(3);
        expect(contains).to.be.true;
    });

    it('contains an entry', async function () {
        const puts = [map.put(1, 2), map.put(1, 3), map.put(3, 5)];
        await Promise.all(puts);
        const contains = await map.containsEntry(1, 3);
        expect(contains).to.be.true;
    });

    it('does not contain an entry', async function () {
        const puts = [map.put(1, 2), map.put(1, 3), map.put(3, 5)];
        await Promise.all(puts);
        const contains = await map.containsEntry(1, 5);
        expect(contains).to.be.false;
    });

    it('returns correct size', async function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(3, 5)];
        await Promise.all(puts);
        const size = await map.size();
        expect(size).to.equal(3);
    });

    it('returns correct value count', async function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(3, 5)];
        await Promise.all(puts);
        const valueCount = await map.valueCount(1);
        expect(valueCount).to.equal(2);
    });

    it('clears', async function () {
        const puts = [map.put(1, 1), map.put(1, 3), map.put(3, 5)];
        await Promise.all(puts);
        await map.clear();
        const size = await map.size();
        expect(size).to.equal(0);
    });

    it('putAll with empty pairs', async function () {
        await map.putAll([]);
        const size = await map.size();
        expect(size).to.equal(0);
    });

    it('putAll', async function () {
        TestUtil.markServerVersionAtLeast(this, client, '4.1');
        const pairs = [['a', [1]], ['b', [2, 22]], ['c', [3, 33, 333]]];
        const checkValues = (expected, actual) => {
            expect(actual.length).to.equal(expected.length);
            expect(actual).to.have.members(expected);
        };
        await map.putAll(pairs);
        let values = await map.get('a');
        checkValues([1], values.toArray());
        values = await map.get('b');
        checkValues([2, 22], values.toArray());
        values = await map.get('c');
        checkValues([3, 33, 333], values.toArray());

    });
});
