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

const RC = require('../RC');
const {
    AddressImpl,
    Client,
    TargetDisconnectedError
} = require('../../../');
const { deferredPromise } = require('../../../lib/util/Util');
const TestUtil = require('../../TestUtil');

describe('HeartbeatFromServerTest', function () {

    let cluster;
    let client;

    function simulateHeartbeatLost(client, address, timeout) {
        const connection = client.getConnectionManager().getConnectionForAddress(address);
        connection.lastReadTimeMillis = connection.getLastReadTimeMillis() - timeout;
    }

    async function warmUpConnectionToAddressWithRetry(client, address, retryCount) {
        const conn = await client.getConnectionManager().getOrConnectToAddress(address);
        if (conn != null) {
            return conn;
        } else if (conn == null && retryCount > 0) {
            await TestUtil.promiseWaitMilliseconds(300);
            return warmUpConnectionToAddressWithRetry(client, address, retryCount - 1);
        }
        throw new Error('Could not warm up connection to ' + address);
    }

    function wasClosedAfterHeartbeatTimeout(connection) {
        return connection.closedCause != null
            && connection.closedCause instanceof TargetDisconnectedError
            && connection.closedCause.message != null
            && connection.closedCause.message.includes('Heartbeat timed out');
    }

    beforeEach(async function () {
        cluster = await RC.createCluster(null, null);
    });

    afterEach(async function () {
        if (client != null) {
            await client.shutdown();
        }
        return RC.terminateCluster(cluster.id);
    });

    it('connectionRemoved fired when second member stops heartbeating', function (done) {
        let member2;
        const memberAddedPromise = deferredPromise();
        RC.startMember(cluster.id).then(() => {
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                properties: {
                    'hazelcast.client.heartbeat.interval': 500,
                    'hazelcast.client.heartbeat.timeout': 2000
                }
            });
        }).then((c) => {
            client = c;
            client.clusterService.addMembershipListener({
                memberAdded: (membershipEvent) => {
                    const address =
                        new AddressImpl(membershipEvent.member.address.host, membershipEvent.member.address.port);
                    warmUpConnectionToAddressWithRetry(client, address, 3)
                        .then(() => memberAddedPromise.resolve())
                        .catch((err) => memberAddedPromise.reject(err));
                }
            });
            return RC.startMember(cluster.id);
        }).then((m2) => {
            member2 = m2;
            return memberAddedPromise.promise;
        }).then(() => {
            client.getConnectionManager().once('connectionRemoved', (connection) => {
                const remoteAddress = connection.getRemoteAddress();
                if (remoteAddress.host === member2.host && remoteAddress.port === member2.port) {
                    if (wasClosedAfterHeartbeatTimeout(connection)) {
                        done();
                    } else {
                        done(new Error('Connection was not closed due to heartbeat timeout. Reason: '
                            + connection.closedReason + ', cause: ' + connection.closedCause));
                    }
                } else {
                    done(new Error(remoteAddress.host + ':' + remoteAddress.port + ' is removed instead of '
                        + member2.host + ':' + member2.port));
                }
            });
            /*
            Run more than once to avoid the following case:

            as a result of ping requests lastReadTime of a connection is continuously updated.
            let's say we called simulateHeartbeatLost and then
            before the heartbeatFunction() has a chance to run(it has 500 interval for this test)
            data may be received on the socket, which updates the lastReadTime. Then heartbeatFunction
            runs and since lastReadTime is updated, it won't close the connection.
             */
            for (let i = 0; i < 5; i++) {
                setTimeout(() => simulateHeartbeatLost(client, new AddressImpl(member2.host, member2.port), 2000), 100 * i);
            }
        }).catch(done);
    });

    it('connectionAdded fired when second member comes back', function (done) {
        let member2;
        const memberAddedPromise = deferredPromise();
        RC.startMember(cluster.id).then(() => {
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                properties: {
                    'hazelcast.client.heartbeat.interval': 500,
                    'hazelcast.client.heartbeat.timeout': 2000
                }
            });
        }).then((c) => {
            client = c;
            client.clusterService.addMembershipListener({
                memberAdded: memberAddedPromise.resolve
            });
            return RC.startMember(cluster.id);
        }).then((m) => {
            member2 = m;
            return memberAddedPromise.promise;
        }).then(() => {
            return warmUpConnectionToAddressWithRetry(client, new AddressImpl(member2.host, member2.port), 3);
        }).then(() => {
            client.getConnectionManager().once('connectionRemoved', (connection) => {
                const remoteAddress = connection.getRemoteAddress();
                if (remoteAddress.host === member2.host && remoteAddress.port === member2.port) {
                    if (!wasClosedAfterHeartbeatTimeout(connection)) {
                        done(new Error('Connection was closed due to unexpected reason. Reason: '
                            + connection.closedReason + ', cause: ' + connection.closedCause));
                    }
                } else {
                    done(new Error(remoteAddress.host + ':' + remoteAddress.port + ' is removed instead of '
                        + member2.host + ':' + member2.port));
                }
            });
            client.getConnectionManager().once('connectionAdded', (connection) => {
                const remoteAddress = connection.getRemoteAddress();
                if (remoteAddress.host === member2.host && remoteAddress.port === member2.port) {
                    done();
                } else {
                    done(new Error(remoteAddress.host + ':' + remoteAddress.port + ' is added instead of '
                        + member2.host + ':' + member2.port));
                }
            });
            /*
            Run more than once to avoid the following case:

            as a result of ping requests lastReadTime of a connection is continuously updated.
            let's say we called simulateHeartbeatLost and then
            before the heartbeatFunction() has a chance to run(it has 500 interval for this test)
            data may be received on the socket, which updates the lastReadTime. Then heartbeatFunction
            runs and since lastReadTime is updated, it won't close the connection.
             */
            for (let i = 0; i < 5; i++) {
                setTimeout(
                    () => simulateHeartbeatLost(client, new AddressImpl(member2.host, member2.port), 2000),
                    2000 + i * 100
                );
            }
        }).catch(done);
    });
});
