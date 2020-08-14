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
const net = require('net');

const Controller = require('./RC');
const { Client, HazelcastErrors } = require('../');
const { AddressImpl } = require('../lib/Address');

describe('ConnectionManagerTest', function () {

    let cluster, client;
    let testend, server;

    before(function () {
        return Controller.createCluster(null, null).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        });
    });

    beforeEach(function () {
        testend = false;
    });

    afterEach(function () {
        testend = true;
        stopUnresponsiveServer();
        if (client != null) {
            return client.shutdown();
        }
    });

    after(function () {
        return Controller.terminateCluster(cluster.id);
    });

    function startUnresponsiveServer(port) {
        server = net.createServer(function (socket) {
            // no-response
        });
        server.listen(port);
    }

    function stopUnresponsiveServer() {
        server.close();
    }

    it('gives up connecting after timeout', function () {
        const timeoutTime = 1000;
        startUnresponsiveServer(9999);
        return Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                connectionTimeout: timeoutTime
            }
        }).then(function (cl) {
            client = cl;
            return client.getConnectionManager().getOrConnect(new AddressImpl('localhost', 9999));
        }).should.eventually.be.rejected;
    });

    it('does not give up when timeout=0', function (done) {
        this.timeout(8000);

        const timeoutTime = 0;
        startUnresponsiveServer(9999);
        const scheduled = setTimeout(function () {
            done();
        }, 6000); // 5000 is default timeout. The client should be still trying

        Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                connectionTimeout: timeoutTime
            }
        }).then(function (cl) {
            client = cl;
            return client.getConnectionManager().getOrConnect(new AddressImpl('localhost',9999));
        }).then(function (value) {
            clearTimeout(scheduled);
            done(new Error('Client should be retrying!'));
        }).catch(function (e) {
            clearTimeout(scheduled);
            if (!testend) {
                done(new Error('Client should be retrying!\n' + e));
            }
        });
    });

    it('should throw IllegalStateError if there is an incompatible server', function () {
        client = null;
        const timeoutTime = 100;
        startUnresponsiveServer(9999);

        return expect(Client.newHazelcastClient({
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
        })).to.be.rejectedWith(HazelcastErrors.IllegalStateError);
    });
});
