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
const { Client } = require('../../../../');
const { promiseWaitMilliseconds, assertTrueEventually, randomString } = require('../../../TestUtil');

describe('ReliableTopicOnClusterRestartTest', function () {

    let cluster;
    let member;
    let client1;
    let client2;

    beforeEach(async function () {
        client1 = undefined;
        client2 = undefined;
        cluster = await RC.createCluster(null, null);
        member = await RC.startMember(cluster.id);
    });

    afterEach(async function () {
        if (client1) {
            await client1.shutdown();
        }
        if (client2) {
            await client2.shutdown();
        }
        await RC.shutdownCluster(cluster.id);
    });

    const createInvocationTimeoutSetClient = (invocationTimeoutMillis) => {
        return Client.newHazelcastClient({
            clusterName: cluster.id,
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: Number.MAX_SAFE_INTEGER
                }
            },
            properties: {
                'hazelcast.client.invocation.timeout.millis': invocationTimeoutMillis
            }
        });
    };

    const createClient = () => {
        return Client.newHazelcastClient({
            clusterName: cluster.id,
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: Number.MAX_SAFE_INTEGER
                }
            }
        });
    };

    it('should continue on cluster restart when data lost and after invocation timeout', async function () {
        const invocationTimeoutMillis = 2000;

        client1 = await createInvocationTimeoutSetClient(invocationTimeoutMillis);
        client2 = await createInvocationTimeoutSetClient(invocationTimeoutMillis);

        let messageArrived = false;
        let messageCount = 0;

        const topicName = 'topic';

        const topic2 = await client2.getReliableTopic(topicName);
        await topic2.publish('message');
        await topic2.publish('message');

        const topic1 = await client1.getReliableTopic(topicName);
        topic1.addMessageListener(() => {
            messageCount++;
            messageArrived = true;
        });

        await RC.shutdownMember(cluster.id, member.uuid);
        await RC.startMember(cluster.id);

        // wait some time for subscription
        await promiseWaitMilliseconds(invocationTimeoutMillis);

        await assertTrueEventually(async () => {
            const topic3 = await client2.getReliableTopic(topicName);
            await topic3.publish(`newItem${randomString()}`);
            await assertTrueEventually(async () => messageArrived.should.be.true, undefined, 5000);
        });

        messageCount.should.be.greaterThanOrEqual(1);
    });

    it('should continue on cluster restart after invocation timeout', async function () {
        const invocationTimeoutMillis = 2000;

        client1 = await createInvocationTimeoutSetClient(invocationTimeoutMillis);

        let messageArrived = false;
        const topicName = 'topic';

        const topic1 = await client1.getReliableTopic(topicName);
        topic1.addMessageListener(() => {
            messageArrived = true;
        });

        await RC.shutdownMember(cluster.id, member.uuid);

        // wait for the topic operation to timeout
        await promiseWaitMilliseconds(invocationTimeoutMillis);

        await RC.startMember(cluster.id);

        client2 = await createClient();

        const topic2 = await client2.getReliableTopic(topicName);
        await topic2.publish('message');
        await assertTrueEventually(async () => messageArrived.should.be.true);
    });

    it('should continue on cluster restart', async function () {
        client1 = await createClient();
        client2 = await createClient();

        const topicName = 'topic';
        const topic1 = await client1.getReliableTopic(topicName);
        const topic2 = await client2.getReliableTopic(topicName);

        let messageArrived = false;

        topic1.addMessageListener(() => {
            messageArrived = true;
        });

        await RC.shutdownMember(cluster.id, member.uuid);
        await RC.startMember(cluster.id);

        await topic2.publish('message');
        await assertTrueEventually(async () => messageArrived.should.be.true);
    });
});
