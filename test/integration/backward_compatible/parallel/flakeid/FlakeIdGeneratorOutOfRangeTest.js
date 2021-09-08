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

const RC = require('../../../RC');
const { HazelcastError } = require('../../../../../lib');
const TestUtil = require('../../../../TestUtil');
const { assertTrueEventually } = require('../../../../TestUtil');

describe('FlakeIdGeneratorOutOfRangeTest', function () {
    let cluster, client;
    let flakeIdGenerator;
    const testFactory = new TestUtil.TestFactory();

    afterEach(async function () {
        await flakeIdGenerator.destroy();
        await client.shutdown();
        await RC.terminateCluster(cluster.id);
    });

    after(async function () {
        await testFactory.cleanUp();
    });

    async function assignOverflowedNodeId(clusterId, instanceNum) {
        const script =
            `function assignOverflowedNodeId() {
                instance_${instanceNum}.getCluster().getLocalMember().setMemberListJoinVersion(100000);
                return instance_${instanceNum}.getCluster().getLocalMember().getMemberListJoinVersion();
            }
            result=""+assignOverflowedNodeId();`;
        return RC.executeOnController(clusterId, script, 1);
    }

    /**
     * Since this test is used with a unisocket client, getRandomConnection will return the first connection in the
     * active connection pool. In Node.js Maps, values() return values in insertion order. So it is enough for us to
     * overflow the member 0;
     */
    it('newId should succeed while there is at least one suitable member', async function () {
        cluster = await testFactory.createClusterForParallelTest();
        const member1 = await RC.startMember(cluster.id);

        client = await testFactory.newHazelcastClientForParallelTest({
            clusterName: cluster.id,
            network: {
                smartRouting: false
            }
        }, member1);

        // wait for the client to connect to first member, it is the one that will be overflowed
        await assertTrueEventually(async () => {
            expect(client.connectionRegistry.activeConnections.size).to.be.eq(1);
        });

        await RC.startMember(cluster.id);
        await assignOverflowedNodeId(cluster.id, 0);

        flakeIdGenerator = await client.getFlakeIdGenerator('test');
        for (let i = 0; i < 100; i++) {
            await flakeIdGenerator.newId();
        }
    });

    it('should throw when there is no server with a join id smaller than 2^16', async function () {
        cluster = await testFactory.createClusterForParallelTest();
        const member1 = await RC.startMember(cluster.id);
        const member2 = await RC.startMember(cluster.id);
        await assignOverflowedNodeId(cluster.id, 0);
        await assignOverflowedNodeId(cluster.id, 1);

        client = await testFactory.newHazelcastClientForParallelTest({
            clusterName: cluster.id
        }, [member1, member2]);
        flakeIdGenerator = await client.getFlakeIdGenerator('test');

        await expect(flakeIdGenerator.newId(flakeIdGenerator)).to.be.rejectedWith(HazelcastError);
    });
});
