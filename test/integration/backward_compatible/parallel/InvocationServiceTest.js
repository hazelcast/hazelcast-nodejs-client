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
const CompactUtil = require('../../../integration/backward_compatible/parallel/serialization/compact/CompactUtil');
const { ClientPingCodec } = require('../../../../lib/codec/ClientPingCodec');
const { SetAddCodec } = require('../../../../lib/codec/SetAddCodec');
const { Invocation } = require('../../../../lib/invocation/InvocationService');
const { expect } = require('chai');
const sinon = require('sinon');
const Long = require('long');

describe('ClientInvocationServiceImplTest', function () {
    let cluster;
    let client;
    let connection;

    const testFactory = new TestUtil.TestFactory();

    const checkUrgentInvocation_withNoData = (client) => {
        const clientMessage = ClientPingCodec.encodeRequest();
        const invocation = new Invocation(client.invocationService, clientMessage);
        client.invocationService.doInvoke(invocation);
        return {invocation, clientMessage};
    };

    const checkUrgentInvocation_withData = (client) => {
        const data = client.getSerializationService().toData(1);
        const clientMessage = SetAddCodec.encodeRequest('test', data);
        const invocation = new Invocation(client.invocationService, clientMessage);
        client.invocationService.doInvoke(invocation);
        return clientMessage;
    };

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '5.2.0');
        // Server version should not be lower than 5.2 for compact serialization tests
        if (await TestUtil.compareServerVersionWithRC(RC, '5.2.0') < 0) {
            this.skip();
        }
    });

    beforeEach(async function () {
        cluster = await testFactory.createClusterForParallelTests();
        const member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compact: {
                    serializers: [new CompactUtil.EmployeeDTOSerializer()]
                }
            }
        }, member);
        connection = client.connectionRegistry.getConnection(member.uuid);
    });

    afterEach(async function () {
        client.shutdown();
    });

    it('testInvokeUrgent_whenThereAreNoCompactSchemas_andClientIsInitializedOnCluster', async function () {
        // No compact schemas, no need to check urgent invocations
        expect(client.schemaService.hasAnySchemas()).to.be.eq(false);
        // client is connected to the member and initialized on it since this
        // is the initial cluster connection
        expect(client.connectionRegistry.clientInitializedOnCluster()).to.be.eq(true);

        var connectionMock = sinon.mock(connection);

        const pingInvocationClientMessage = checkUrgentInvocation_withNoData(client);
        const setAddInvocationClientMessage = checkUrgentInvocation_withData(client);

        connectionMock.expects('write').once().withArgs(pingInvocationClientMessage);
        connectionMock.expects('write').once().withArgs(setAddInvocationClientMessage);
    });

    it('testInvokeUrgent_whenThereAreCompactSchemas_andClientIsInitializedOnCluster', async function () {
        const sampleMap = await client.getMap('testMap');
        await sampleMap.put('test', new CompactUtil.EmployeeDTO(23, Long.fromNumber(123)));

        // Some compact schemas, need to check urgent invocations
        expect(client.schemaService.hasAnySchemas()).to.be.eq(true);
        // client is connected to the member and initialized on it since this
        // is the initial cluster connection
        expect(client.connectionRegistry.clientInitializedOnCluster()).to.be.eq(true);

        var connectionMock = sinon.mock(connection);

        const pingInvocationClientMessage = checkUrgentInvocation_withNoData(client);
        const setAddInvocationClientMessage = checkUrgentInvocation_withData(client);

        connectionMock.expects('write').once().withArgs(pingInvocationClientMessage);
        connectionMock.expects('write').once().withArgs(setAddInvocationClientMessage);
    });
});
