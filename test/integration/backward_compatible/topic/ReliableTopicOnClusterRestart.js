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
    const invocationTimeoutMillis = 2000;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        member = await RC.startMember(cluster.id);
        client1 = await Client.newHazelcastClient({
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
        client2 = await Client.newHazelcastClient({
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
    });
    after(async function() {
        await RC.shutdownCluster(cluster.id);
        await client1.shutdown();
        await client2.shutdown();
    });

    // https://github.com/hazelcast/hazelcast/pull/16644
    it('should continue on cluster restart after invocation timeout', async function () {
        let messageArrived = false;
        let messageCount = 0;

        const topicName = 'topic';

        const topic2 = await client2.getReliableTopic(topicName);
        await topic2.publish('message');
        await topic2.publish('message');

        const topic1 = await client1.getReliableTopic(topicName);
        topic1.addMessageListener(() => {
            console.log('received message');
            messageCount++;
            messageArrived = true;
        });

        await RC.terminateMember(cluster.id, member.uuid);

        await RC.startMember(cluster.id);

        // wait some time for subscription
        await promiseWaitMilliseconds(invocationTimeoutMillis);

        await assertTrueEventually(async () => {
            const topic3 = await client2.getReliableTopic(topicName);
            await topic3.publish(`newItem${randomString()}`);
            console.log('published message');
            await assertTrueEventually(async () => {
                if (!messageArrived)
                    throw new Error('message not arrived yet');
            }, 100, 5000);
        });

        messageCount.should.be.greaterThanOrEqual(1);
    });
});
