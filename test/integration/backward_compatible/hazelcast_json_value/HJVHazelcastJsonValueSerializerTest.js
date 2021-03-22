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
const {
    Client,
    HazelcastJsonValue,
    JsonStringDeserializationPolicy
} = require('../../../../');

describe('HazelcastJsonValue with HazelcastJsonValueSerializer', function () {

    let cluster, client;
    let map;
    const object = { 'a': 1 };
    const hzJsonValue = new HazelcastJsonValue(JSON.stringify(object));

    before(async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            serialization: {
                jsonStringDeserializationPolicy: JsonStringDeserializationPolicy.NO_DESERIALIZATION
            }
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
        expect(value).to.be.an.instanceof(HazelcastJsonValue);
        expect(value).to.be.deep.equal(hzJsonValue);
        expect(JSON.parse(value.toString())).to.deep.equal(object);
    });

    it('storing HazelcastJsonValue objects', async function () {
        await map.put(1, hzJsonValue);
        const value = await map.get(1);
        expect(value).to.be.an.instanceof(HazelcastJsonValue);
        expect(value).to.be.deep.equal(hzJsonValue);
        expect(JSON.parse(value.toString())).to.deep.equal(object);
    });

    it('storing invalid Json strings', async function () {
        const invalidString = '{a}';
        const hzJsonValueInvalid = new HazelcastJsonValue(invalidString);
        await map.put(1, hzJsonValueInvalid);
        const value = await map.get(1);
        expect(value).to.be.an.instanceof(HazelcastJsonValue);
        expect(value).to.be.deep.equal(hzJsonValueInvalid);
        expect(() => JSON.parse(value.toString())).to.throw(SyntaxError);
    });
});
