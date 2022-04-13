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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const RC = require('../../RC');
const {
    IndexOutOfBoundsError,
    IllegalMonitorStateError
} = require('../../../../lib');
const TestUtil = require('../../../TestUtil');

describe('ClientRedoEnabledTest', function () {
    let cluster;
    let client;
    let member;

    const testFactory = new TestUtil.TestFactory();

    beforeEach(async function () {
        cluster = await testFactory.createClusterForParallelTests();
        member = await RC.startMember(cluster.id);
    });

    afterEach(async function () {
        await testFactory.shutdownAll();
    });

    it('List.get should throw on out of bounds index access', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            network: {
                redoOperation: true
            }
        }, member);

        const list = await client.getList('list');
        await expect(list.get(0)).to.be.rejectedWith(IndexOutOfBoundsError);
    });

    it('Map.unlock should throw when not locked', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            network: {
                redoOperation: true,
            }
        }, member);

        const map = await client.getMap('map');
        await expect(map.unlock('foo')).to.be.rejectedWith(IllegalMonitorStateError);
    });

    it('should redo operations in smart mode when member goes down', async function () {
        const memberTwo = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            network: {
                redoOperation: true
            }
        }, member);
        const map = await client.getMap('map');

        setTimeout(() => {
            RC.shutdownMember(cluster.id, memberTwo.uuid)
                .catch(() => {
                    // no-op
                });
        }, 0);

        for (let i = 0; i < 100; i++) {
            await map.put(i, i);
        }

        const size = await map.size();
        expect(size).to.be.equal(100);
    });

    it('should redo operations in unisocket mode when member goes down', async function () {
        await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            network: {
                redoOperation: true,
                smartRouting: false
            }
        }, member);
        const map = await client.getMap('map');

        setTimeout(() => {
            RC.shutdownMember(cluster.id, member.uuid)
                .catch(() => {
                    // no-op
                });
        }, 0);

        for (let i = 0; i < 100; i++) {
            await map.put(i, i);
        }

        const size = await map.size();
        expect(size).to.be.equal(100);
    });
});
