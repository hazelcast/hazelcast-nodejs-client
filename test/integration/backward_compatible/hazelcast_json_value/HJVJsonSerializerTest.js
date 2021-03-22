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
    HazelcastJsonValue
} = require('../../../../');

describe('HazelcastJsonValue with JsonSerializer', function () {

    let cluster, client;
    let map;
    const object = { 'a': 1 };
    const hzJsonValue = new HazelcastJsonValue(JSON.stringify(object));

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
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('storing JavaScript objects', async function () {
        await map.put(1, object);
        const value = await map.get(1);
        expect(value).to.deep.equal(object);
    });

    it('storing HazelcastJsonValue objects', async function () {
        await map.put(1, hzJsonValue);
        const value = await map.get(1);
        expect(value).to.deep.equal(object);
    });

    it('storing invalid Json strings', async function () {
        const invalidString = '{a}';
        await map.put(1, new HazelcastJsonValue(invalidString));
        return expect(map.get(1)).to.be.rejectedWith(SyntaxError);
    });

    it('storing JavaScript and HazelcastJsonValue objects as keys', async function () {
        await map.put(object, 1);
        let value = await map.get(object);
        expect(value).to.equal(1);
        await map.put(hzJsonValue, 2);
        value = await map.get(hzJsonValue);
        expect(value).to.equal(2);
        const size = await map.size();
        expect(size).to.equal(1);
    });

    it('storing JavaScript and HazelcastJsonValue objects together', async function () {
        await map.put(1, object);
        await map.put(2, hzJsonValue);
        let value = await map.get(1);
        expect(value).to.deep.equal(object);
        value = await map.get(2);
        expect(value).to.deep.equal(object);
    });
});
