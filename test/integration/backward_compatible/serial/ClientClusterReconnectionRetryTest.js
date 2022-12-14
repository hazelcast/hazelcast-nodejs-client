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
const { expect } = require('chai');
const { ClientState, ConnectionManager } = require('../../../../lib/network/ConnectionManager');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

/**
 * Basic tests for reconnection to cluster scenarios.
 */
describe('ClientClusterReconnectionRetryTest', function () {
    let cluster;
    let client;
    const ASSERTION_MILISECONDS = 30000;
    const INT32_MAX_VALUE = 2147483647;

    const testFactory = new TestUtil.TestFactory();

    beforeEach(function () {
       client = undefined;
       cluster = undefined;
    });

    afterEach(async function () {
        await testFactory.shutdownAll();
    });

    it('testClientShouldNotTryToConnectCluster_whenThereIsNoConnection', async function () {
        cluster = await testFactory.createClusterForSerialTests();
        const member = await RC.startMember(cluster.id);
        // Sleep indefinitely after the first connection attempt fails
        client = await testFactory.newHazelcastClientForSerialTests({
            clusterName: cluster.id,
            connectionStrategy: {
                connectionRetry: {
                    initialBackoffMillis: INT32_MAX_VALUE,
                    maxBackoffMillis: INT32_MAX_VALUE
                }
            }
        });
        await RC.terminateMember(cluster.id, member.uuid);
        // Wait until the client-side connection is closed
        await TestUtil.waitForConnectionCount(client, 0);
        // Wait a bit more to make it more likely that the first reconnection
        // attempt is made before we restart the instance
        await TestUtil.promiseLater(ASSERTION_MILISECONDS, () => { });

        await RC.startMember(cluster.id);
        const clientConnectionsFn = await TestUtil.getClientConnections(client);
        await TestUtil.assertTrueAllTheTime(async () => {
            return clientConnectionsFn().length === 0 ?
                Promise.resolve(true) :
                Promise.reject(new Error('Result can not be false. Connection length:' + clientConnectionsFn().length));
        }, 100, ASSERTION_MILISECONDS);
    });

    it('testClientState_AfterDisconnected', async function () {
        const fnGetOrConnectToMember = sandbox.replace(
            ConnectionManager.prototype,
            'getOrConnectToMember',
            sandbox.fake(ConnectionManager.prototype.getOrConnectToMember)
        );

        cluster = await testFactory.createClusterForSerialTests();
        const member = await RC.startMember(cluster.id);
        // Sleep indefinitely after the first connection attempt fails
        client = await testFactory.newHazelcastClientForSerialTests({
            clusterName: cluster.id,
            connectionStrategy: {
                connectionRetry: {
                    initialBackoffMillis: INT32_MAX_VALUE,
                    maxBackoffMillis: INT32_MAX_VALUE
                }
            }
        });
        await RC.terminateMember(cluster.id, member.uuid);
        // Wait until the client-side connection is closed
        await TestUtil.waitForConnectionCount(client, 0);

        // After terminateMember client state will be DISCONNECTED_FROM_CLUSTER
        expect(client.getConnectionManager().getConnectionRegistry().getClientState()
                == ClientState.DISCONNECTED_FROM_CLUSTER).to.be.eq(true);
        // getOrConnectToMember function called only two times(first connection),
        // after disconnection client will not try to reconnect
        fnGetOrConnectToMember.callCount.should.be.eq(2);
    });
});
