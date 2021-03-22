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
const { Client, HazelcastError } = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('FlakeIdGeneratorOutOfRangeTest', function () {

    let cluster, client;
    let flakeIdGenerator;

    afterEach(async function () {
        await flakeIdGenerator.destroy();
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
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

    for (let repeat = 0; repeat < 10; repeat++) {
        it('newId should succeed while there is at least one suitable member (repeat: ' + repeat + '/10)', async function () {
            cluster = await RC.createCluster();
            await RC.startMember(cluster.id);
            await RC.startMember(cluster.id);
            await assignOverflowedNodeId(cluster.id, TestUtil.getRandomInt(0, 2));

            client = await Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    smartRouting: false
                }
            });

            flakeIdGenerator = await client.getFlakeIdGenerator('test');
            for (let i = 0; i < 100; i++) {
                await flakeIdGenerator.newId();
            }
        });
    }

    it('should throw when there is no server with a join id smaller than 2^16', async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        await RC.startMember(cluster.id);
        await assignOverflowedNodeId(cluster.id, 0);
        await assignOverflowedNodeId(cluster.id, 1);

        client = await Client.newHazelcastClient({
            clusterName: cluster.id
        });
        flakeIdGenerator = await client.getFlakeIdGenerator('test');

        await expect(flakeIdGenerator.newId(flakeIdGenerator)).to.be.rejectedWith(HazelcastError);
    });
});
