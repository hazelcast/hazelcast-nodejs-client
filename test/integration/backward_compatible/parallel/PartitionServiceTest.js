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
chai.should();
const RC = require('../../RC');
const TestUtil = require('../../../TestUtil');
const CompactUtil = require('../parallel/serialization/compact/CompactUtil');
const Long = require('long');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

describe('PartitionServiceTest', function () {
    let cluster;
    let member;
    let client;
    let CompactStreamSerializer;

    try {
        CompactStreamSerializer = require('../../../../lib/serialization/compact/CompactStreamSerializer')
        .CompactStreamSerializer;
    } catch (e) {
        // no op
    }

    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        TestUtil.markClientVersionAtLeast('5.1.0');
        cluster = await testFactory.createClusterForParallelTests();
        member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compact: {
                    serializers: [new CompactUtil.EmployeeSerializer()]
                }
            }
        }, member);
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('should be able to use compact keys in getPartitionId', async function () {
        const employee1 = new CompactUtil.Employee(12, Long.fromNumber(1));
        const writeSpy = sandbox.replace(
            CompactStreamSerializer.prototype,
            'write',
            sandbox.fake(CompactStreamSerializer.prototype.write)
        );

        (() => client.getPartitionService().getPartitionId(employee1)).should.not.throw();
        // Assert that we used CompactSerializer
        writeSpy.called.should.be.true;
    });
});
