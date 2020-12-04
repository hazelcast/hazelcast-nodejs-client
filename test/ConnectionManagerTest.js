/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const net = require('net');

const RC = require('./RC');
const { Client, IllegalStateError } = require('../');
const { AddressImpl } = require('../lib/core/Address');

describe('ConnectionManagerTest', function () {

    let cluster, client;
    let testend, server;

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

    before(function () {
        return RC.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return RC.startMember(cluster.id);
        });
    });

    beforeEach(function () {
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

    it('gives up connecting after timeout', async function () {
        const timeoutTime = 1000;
        await startUnresponsiveServer(9999);
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

    it('does not give up when timeout=0', function (done) {
        this.timeout(8000);

        const timeoutTime = 0;
        let scheduled;

        startUnresponsiveServer(9999).then(() => {
            scheduled = setTimeout(function () {
                done();
            }, 6000); // 5000 is default timeout. The client should be still trying
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    connectionTimeout: timeoutTime
                }
            });
        }).then(function (cl) {
            client = cl;
            return client.getConnectionManager().getOrConnectToAddress(new AddressImpl('localhost', 9999));
        }).then(function () {
            clearTimeout(scheduled);
            done(new Error('Client should be retrying!'));
        }).catch(function (e) {
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
        const conn = await client.getConnectionManager().getOrConnect(new AddressImpl('localhost', 5701));
        expect(conn.isAlive()).to.be.true;

        const closeSpy = sinon.spy(conn, 'close');
        const err = new Error('boom');
        err.code = 'ECONNRESET';
        conn.socket.emit('error', err);

        expect(conn.isAlive()).to.be.false;
        expect(closeSpy.calledOnce).to.be.true;
    });
});
