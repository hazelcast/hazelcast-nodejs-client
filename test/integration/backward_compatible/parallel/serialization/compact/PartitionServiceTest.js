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
chai.should();
const RC = require('../../../../RC');
const TestUtil = require('../../../../../TestUtil');
const CompactUtil = require('./CompactUtil');
const Long = require('long');
const sinon = require('sinon');
const { HazelcastSerializationError } = require('../../../../../../lib');
const sandbox = sinon.createSandbox();

describe('PartitionServiceTest', function () {
    let cluster;
    let member;
    let client;
    let CompactStreamSerializer;
    let SchemaNotReplicatedError;

    try {
        CompactStreamSerializer = require('../../../../../../lib/serialization/compact/CompactStreamSerializer')
        .CompactStreamSerializer;
        SchemaNotReplicatedError = require('../../../../../../lib/core').SchemaNotReplicatedError;
    } catch (e) {
        // no op
    }

    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
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
        TestUtil.markServerVersionAtLeast(this, client, '5.1.0');
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    const getPartitionId = async (key) => {
        try {
            return Promise.resolve(client.getPartitionService().getPartitionId(key));
        } catch (e) {
            if (e instanceof HazelcastSerializationError && e.cause instanceof SchemaNotReplicatedError) {
                return client.getInvocationService().registerSchema(e.cause.schema, e.cause.clazz).then(() => {
                    return getPartitionId(key);
                });
            }
            throw e;
        }
    };

    it('should be able to fetch compact keys\' schemas', async function () {
        const employee1 = new CompactUtil.Employee(12, Long.fromNumber(1));
        const writeSpy = sandbox.replace(
            CompactStreamSerializer.prototype,
            'write',
            sandbox.fake(CompactStreamSerializer.prototype.write)
        );
        // Compact schema is not replicated, so we should return an exception
        (() => client.getPartitionService().getPartitionId(employee1)).should.throw(HazelcastSerializationError);

        await getPartitionId(employee1);
        // Assert that we used CompactSerializer
        writeSpy.called.should.be.true;
    });
});
