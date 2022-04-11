/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
const TestUtil = require('../../../TestUtil');

describe('AutoPipeliningDisabledTest', function () {
    let client;
    let map;

    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        const cluster = await testFactory.createClusterForParallelTests();
        const member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            properties: {
                ['hazelcast.client.autopipelining.enabled']: false
            }
        }, member);
    });

    beforeEach(async function () {
        map = await client.getMap('test');
    });

    afterEach(async function () {
        return map.destroy();
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('basic map operations work fine', async function () {
        await map.set('foo', 'bar');
        const value = await map.get('foo');
        expect(value).to.equal('bar');
    });
});

