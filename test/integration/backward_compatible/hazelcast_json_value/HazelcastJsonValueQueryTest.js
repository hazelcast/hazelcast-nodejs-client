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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const RC = require('../../RC');
const {
    Client,
    Predicates,
    HazelcastJsonValue
} = require('../../../../');

describe('HazelcastJsonValue query test', function () {

    let cluster, client;
    let map;
    const object = { 'a': 1 };

    before(async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id
        });
    });

    beforeEach(async function () {
        map = await client.getMap('jsonTest');
    });

    afterEach(async function () {
        return map.destroy();
    });

    after(async function () {
        if (!client) {
            return;
        }
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('querying over JavaScript objects', async function () {
        const objects = [
            [0, { 'a': 1 }],
            [1, { 'a': 3 }]
        ];
        await map.putAll(objects);
        const values = await map.valuesWithPredicate(Predicates.greaterThan('a', 2));
        expect(values.toArray()).to.deep.equal([objects[1][1]]);
    });

    it('querying over nested attributes', async function () {
        const objects = [
            [0, { 'a': 1, 'b': { 'c': 1 } }],
            [1, { 'a': 3, 'b': { 'c': 3 } }]
        ];
        await map.putAll(objects);
        const values = await map.valuesWithPredicate(Predicates.greaterThan('b.c', 2));
        expect(values.toArray()).to.deep.equal([objects[1][1]]);
    });

    it('querying over keys', async function () {
        const hzJsonValue2 = new HazelcastJsonValue('{ "a": 3 }');
        await map.put(object, 1);
        await map.put(hzJsonValue2, 2);
        const values = await map.valuesWithPredicate(Predicates.sql('__key.a > 2'));
        expect(values.toArray()).to.deep.equal([2]);
    });

    it('querying nested attributes over keys', async function () {
        const object1 = { 'a': 1, 'b': { 'c': 1 } };
        const object2 = { 'a': 1, 'b': { 'c': 3 } };
        await map.put(object1, 1);
        await map.put(object2, 2);
        const keySet = await map.keySetWithPredicate(Predicates.equal('__key.b.c', 3));
        expect(keySet).to.deep.equal([object2]);
    });
});
