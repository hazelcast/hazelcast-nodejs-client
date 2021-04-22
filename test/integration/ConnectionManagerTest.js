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

const RC = require('./RC');
const { Client, IllegalStateError } = require('../../');
const { AddressImpl } = require('../../lib/core/Address');
const { promiseWaitMilliseconds } = require('../TestUtil');

/**
 * Basic tests for `ConnectionManager`.
 */
describe('ConnectionManagerTest', function () {

    let cluster;
    let client;
    let server;
    let testend;

    async function startUnresponsiveServer(port) {
        server = net.createServer(() => {
            // no-response
        });
        await new Promise((resolve) => server.listen(port, resolve));
    }

    function stopUnresponsiveServer() {
        if (server != null) {
            server.close();
        }
    }

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
    });

    beforeEach(function () {
        sandbox.restore();
        testend = false;
    });

    afterEach(async function () {
        testend = true;
        stopUnresponsiveServer();
        if (client != null) {
            await client.shutdown();
        }
    });

    after(async function () {
        await RC.terminateCluster(cluster.id);
    });

    it('should give up connecting after timeout', async function () {
        await startUnresponsiveServer(9999);

        const timeoutTime = 1000;
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                connectionTimeout: timeoutTime
            }
        });

        const connectionManager = client.getConnectionManager();
        await expect(
            connectionManager.getOrConnectToAddress(new AddressImpl('localhost', 9999))
        ).to.be.rejected;
    });

    it('destroys socket after connection timeout', async function () {
        const timeoutTime = 1000;
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                connectionTimeout: timeoutTime
            }
        });

        // emulate connection timeout with a stub socket
        const socketStub = sandbox.stub(net.Socket.prototype);
        sandbox.stub(net, 'connect').returns(socketStub);

        const connectionManager = client.getConnectionManager();
        await expect(
            connectionManager.getOrConnectToAddress(new AddressImpl('localhost', 9999))
        ).to.be.rejected;

        await promiseWaitMilliseconds(100);
        expect(socketStub.destroy.callCount).to.be.equal(1);
    });

    it('should not give up when timeout set to 0', function (done) {
        const timeoutTime = 0;
        let scheduled;

        startUnresponsiveServer(9999).then(() => {
            scheduled = setTimeout(() => {
                done();
            }, 6000); // 5000 is default timeout. The client should be still trying
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    connectionTimeout: timeoutTime
                }
            });
        }).then((cl) => {
            client = cl;
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
        const timeoutTime = 100;
        await startUnresponsiveServer(9999);

        await expect(Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                clusterMembers: ['127.0.0.1:9999'],
                connectionTimeout: timeoutTime
            },
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: 2000
                }
            }
        })).to.be.rejectedWith(IllegalStateError);
    });

    it('should close connection on socket error', async function () {
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
        // we should get existing connection here
        const conn = await client.getConnectionManager().getOrConnectToAddress(new AddressImpl('localhost', 5701));
        expect(conn.isAlive()).to.be.true;

        const closeSpy = sandbox.spy(conn, 'close');
        conn.socket.emit('error', new Error('boom'));

        expect(conn.isAlive()).to.be.false;
        expect(closeSpy.calledOnce).to.be.true;
    });

    it('should close all connections when shut down', async function () {
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
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
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
        const connectionManager = client.getConnectionManager();
        expect(connectionManager.connectionRegistry.activeConnections).to.have.lengthOf(1);

        connectionManager.reset();

        expect(connectionManager.connectionRegistry.activeConnections).to.have.lengthOf(0);
    });
});
