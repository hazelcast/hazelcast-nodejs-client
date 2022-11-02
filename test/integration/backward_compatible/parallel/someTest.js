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

const RC = require('../../RC');
const TestUtil = require('../../../TestUtil');
const chai = require('chai');
chai.should();

describe('SplitBrainTest', function () {
    let cluster;
    let member1, member2, member3, member4, member5;

    const testFactory = new TestUtil.TestFactory();

    beforeEach(async function () {
        cluster = await testFactory.createClusterForParallelTests();
        member1 = await RC.startMember(cluster.id);
        member2 = await RC.startMember(cluster.id);
        member3 = await RC.startMember(cluster.id);
        member4 = await RC.startMember(cluster.id);
        member5 = await RC.startMember(cluster.id);
        await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id
        }, member1);
    });

    afterEach(async function () {
        await testFactory.shutdownAll();
    });

    it('split brain works', async function () {
        // We will split brain the cluster into two parts as [1,2] and [3,4]
        const splitSuccess = await TestUtil.splitCluster(cluster.id, [member1, member2, member3], [member4, member5]);
        splitSuccess.should.be.true;
        const mergeCluster = await TestUtil.mergeCluster(cluster.id, [member1, member2, member3], [member4, member5]);
        mergeCluster.should.be.true;
        await TestUtil.promiseWaitMilliseconds(1111111);
    });
});
