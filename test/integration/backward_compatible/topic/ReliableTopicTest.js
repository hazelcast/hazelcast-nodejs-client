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

const { expect } = require('chai');
const fs = require('fs');
const Long = require('long');

const RC = require('../../RC');
const { Client, TopicOverloadPolicy } = require('../../../../');
const { ReliableTopicMessage } = require('../../../../lib/proxy/topic/ReliableTopicMessage');

describe('ReliableTopicTest', function () {

    let cluster;
    let clientOne;
    let clientTwo;

    function createConfig(clusterName) {
        return {
            clusterName,
            reliableTopics: {
                'discard': {
                    overloadPolicy: TopicOverloadPolicy.DISCARD_NEWEST
                },
                'overwrite': {
                    overloadPolicy: TopicOverloadPolicy.DISCARD_OLDEST
                }
            }
        };
    }

    function generateItems(client, howMany) {
        const all = [];
        for (let i = 1; i <= howMany; i++) {
            const reliableTopicMessage = new ReliableTopicMessage();
            reliableTopicMessage.payload = client.getSerializationService().toData(i);
            reliableTopicMessage.publishTime = Long.fromNumber(new Date().getTime());
            reliableTopicMessage.publisherAddress = client.getLocalEndpoint().localAddress;
            all.push(reliableTopicMessage);
        }
        return all;
    }

    before(async function () {
        const memberConfig = fs.readFileSync(__dirname + '/hazelcast_topic.xml', 'utf8');
        cluster = await RC.createCluster(null, memberConfig);
        await RC.startMember(cluster.id);
        const config = createConfig(cluster.id);
        clientOne = await Client.newHazelcastClient(config);
        clientTwo = await Client.newHazelcastClient(config);
    });

    after(async function () {
        await clientOne.shutdown();
        await clientTwo.shutdown();
        await RC.terminateCluster(cluster.id);
    });

    it('writes and reads messages', function (done) {
        const topicName = 't' + Math.random();
        let topicOne;
        let topicTwo;
        clientOne.getReliableTopic(topicName).then((t) => {
            topicOne = t;
            return clientTwo.getReliableTopic(topicName);
        }).then((t) => {
            topicTwo = t;
            topicTwo.addMessageListener((msg) => {
                if (msg.messageObject['value'] === 'foo') {
                    done();
                }
            });
            setTimeout(() => {
                topicOne.publish({ 'value': 'foo' });
            }, 500);
        }).catch(done);
    });

    it('removed message listener does not receive items after removal', function (done) {
        const topicName = 't' + Math.random();
        let topicOne;
        let topicTwo;
        clientOne.getReliableTopic(topicName).then((topic) => {
            topicOne = topic;
            return clientTwo.getReliableTopic(topicName);
        }).then((topic) => {
            topicTwo = topic;
            let receivedMessages = 0;
            const id = topicTwo.addMessageListener(() => {
                receivedMessages++;
                if (receivedMessages > 2) {
                    done(new Error('Kept receiving messages after message listener is removed.'));
                }
            });

            topicOne.publish({ 'value0': 'foo0' });
            topicOne.publish({ 'value1': 'foo1' });
            setTimeout(() => {
                topicTwo.removeMessageListener(id);
                topicOne.publish({ 'value2': 'foo2' });
                topicOne.publish({ 'value3': 'foo3' });
                topicOne.publish({ 'value4': 'foo4' });
                topicOne.publish({ 'value5': 'foo5' });
                setTimeout(done, 500);
            }, 500);
        }).catch(done);
    });

    it('blocks when there is no more space', async function () {
        const topic = await clientOne.getReliableTopic('blocking');
        const ringbuffer = topic.getRingbuffer();

        const capacity = await ringbuffer.capacity();
        const all = [];
        for (let i = 0; i < capacity.toNumber() + 1; i++) {
            all.push(i);
        }
        await ringbuffer.addAll(all);

        const startTime = Date.now();
        await topic.publish(-50);
        // Here we check that the call was indeed blocking
        // until the TTL of the first inserted entry has passed
        const elapsed = Date.now() - startTime;
        if (elapsed <= 2000) {
            throw new Error('Message was published too fast, expected at least a 2 second delay, got: ' + elapsed);
        }
    });

    it('continues operating when stale sequence is reached', function (done) {
        let topic;
        let ringbuffer;
        clientOne.getReliableTopic('stale').then((t) => {
            topic = t;
            return topic.getRingbuffer();
        }).then((rb) => {
            ringbuffer = rb;
            topic.addMessageListener((m) => {
                if (m.messageObject === 20) {
                    done();
                }
            });
            const all = generateItems(clientOne, 20);
            ringbuffer.addAll(all);
        }).catch(done);
    });

    it('discards the item when there is no more space', async function () {
        const topic = await clientOne.getReliableTopic('discard');
        const ringbuffer = topic.getRingbuffer();

        const all = generateItems(clientOne, 10);
        await ringbuffer.addAll(all);
        await topic.publish(11);

        const seq = await ringbuffer.tailSequence();
        const item = await ringbuffer.readOne(seq);
        const obj = clientOne.getSerializationService().toObject(item.payload);
        expect(obj).to.equal(10);
    });

    it('overwrites the oldest item when there is no more space', async function () {
        const topic = await clientOne.getReliableTopic('overwrite');
        const ringbuffer = topic.getRingbuffer();

        const all = generateItems(clientOne, 10);
        await ringbuffer.addAll(all);
        await topic.publish(11);

        const seq = await ringbuffer.tailSequence();
        const item = await ringbuffer.readOne(seq);
        const obj = clientOne.getSerializationService().toObject(item.payload);
        expect(obj).to.equal(11);
    });
});
