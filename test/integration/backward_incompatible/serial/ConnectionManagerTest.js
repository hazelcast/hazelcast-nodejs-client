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
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const net = require('net');

const RC = require('../../RC');
const { IllegalStateError, ClientNetworkConfigImpl } = require('../../../../lib');
const { AddressImpl } = require('../../../../lib/core/Address');
const { promiseWaitMilliseconds } = require('../../../TestUtil');
const TestUtil = require('../../../TestUtil');

/**
 * Basic tests for `ConnectionManager`.
 */
describe('ConnectionManagerTest', function () {
    let cluster;
    let client;
    let testend;
    const testFactory = new TestUtil.TestFactory();

    async function startUnresponsiveServer(port) {
        const server = net.createServer(() => {
            // no-response
        });
        await new Promise((resolve) => server.listen(port, resolve));
        return server;
    }

    before(async function () {
        cluster = await testFactory.createClusterForSerialTests();
        await RC.startMember(cluster.id);
    });

    beforeEach(function () {
        sandbox.restore();
        testend = false;
    });

    afterEach(async function () {
        testend = true;
        if (client != null) {
            await client.shutdown();
        }
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('should give up connecting after timeout', async function () {
        const timeoutTime = 1000;
        client = await testFactory.newHazelcastClientForSerialTests({
            clusterName: cluster.id,
            network: {
                connectionTimeout: timeoutTime
            }
        });

        // emulate connection timeout with a fake socket
        sandbox.replace(net, 'connect', sandbox.fake.returns(sandbox.createStubInstance(net.Socket)));

        const connectionManager = client.getConnectionManager();

        await expect(
            connectionManager.getOrConnectToAddress(new AddressImpl('localhost', 9999))
        ).to.be.rejected;
    });

    it('destroys socket after connection timeout', async function () {
        const timeoutTime = 1000;
        client = await testFactory.newHazelcastClientForSerialTests({
            clusterName: cluster.id,
            network: {
                connectionTimeout: timeoutTime
            }
        });

        // emulate connection timeout with a fake socket
        const fakeSocket = sandbox.createStubInstance(net.Socket);
        sandbox.replace(net, 'connect', sandbox.fake.returns(fakeSocket));

        const connectionManager = client.getConnectionManager();

        await expect(
            connectionManager.getOrConnectToAddress(new AddressImpl('localhost', 9999))
        ).to.be.rejected;

        await promiseWaitMilliseconds(100);
        expect(fakeSocket.destroy.callCount).to.be.equal(1);
        sandbox.restore();
    });

    it('should not give up when timeout set to 0', function (done) {
        const timeoutTime = 0;

        const networkConfig = new ClientNetworkConfigImpl();

        const scheduled = setTimeout(() => {
            done();
        }, networkConfig.connectionTimeout + 1000); // 1 second more than default, client should be retrying after this time

        testFactory.newHazelcastClientForSerialTests({
            clusterName: cluster.id,
            network: {
                connectionTimeout: timeoutTime
            }
        }).then((cl) => {
            client = cl;
            // emulate connection timeout with a fake socket
            sandbox.replace(net, 'connect', sandbox.fake.returns(sandbox.createStubInstance(net.Socket)));
            return client.getConnectionManager().getOrConnectToAddress(new AddressImpl('localhost', 9999));
        }).then(() => {
            clearTimeout(scheduled);
            done(new Error('Client should be retrying!'));
        }).catch((e) => {
            clearTimeout(scheduled);
            if (!testend) {
                done(new Error('Client should be retrying!\n' + e));
            }
        });
    });

    it('should throw IllegalStateError if there is an incompatible server', async function () {
        client = null;
        const port = 9999;
        const server = await startUnresponsiveServer(port);
        const timeout = 2000;

        try {
            await expect(testFactory.newHazelcastClientForSerialTests({
                clusterName: cluster.id,
                network: {
                    clusterMembers: [`127.0.0.1:${port}`]
                },
                connectionStrategy: {
                    connectionRetry: {
                        clusterConnectTimeoutMillis: timeout
                    }
                },
                // authentication timeout is same as heartbeat timeout, set it to `timeout`
                properties: {
                    'hazelcast.client.heartbeat.timeout': timeout
                }
            })).to.be.rejectedWith(IllegalStateError);
        } finally {
            server.close();
        }
    });

    it('should close connection on socket error', async function () {
        client = await testFactory.newHazelcastClientForSerialTests({ clusterName: cluster.id });
        // we should get existing connection here
        const conn = await client.getConnectionManager().getOrConnectToAddress(new AddressImpl('localhost', 5701));
        expect(conn.isAlive()).to.be.true;

        const closeSpy = sandbox.spy(conn, 'close');
        conn.socket.emit('error', new Error('boom'));

        expect(conn.isAlive()).to.be.false;
        expect(closeSpy.calledOnce).to.be.true;
    });

    it('should close all connections when shut down', async function () {
        client = await testFactory.newHazelcastClientForSerialTests({ clusterName: cluster.id });
        const connectionManager = client.getConnectionManager();
        expect(connectionManager.pendingConnections).to.have.lengthOf(0);

        // close the only existing connection
        const memberAddress = new AddressImpl('localhost', 5701);
        const conn = await connectionManager.getOrConnectToAddress(memberAddress);
        conn.close('Boom', null);

        // force creation of a pending connection
        connectionManager.getOrConnectToAddress(memberAddress);
        expect(connectionManager.pendingConnections).to.have.lengthOf(1);

        // now shut down the client
        await client.shutdown();

        // connections should be cleaned up and no new connections should appear
        await promiseWaitMilliseconds(1000);
        expect(connectionManager.pendingConnections).to.have.lengthOf(0);
        expect(connectionManager.connectionRegistry.activeConnections).to.have.lengthOf(0);
    });

    it('should close active connections when reset', async function () {
        client = await testFactory.newHazelcastClientForSerialTests({ clusterName: cluster.id });
        const connectionManager = client.getConnectionManager();
        expect(connectionManager.connectionRegistry.activeConnections).to.have.lengthOf(1);

        connectionManager.reset();

        expect(connectionManager.connectionRegistry.activeConnections).to.have.lengthOf(0);
    });
});
