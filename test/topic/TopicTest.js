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

const expect = require('chai').expect;
const fs = require('fs');
const Long = require('long');
const Promise = require('bluebird');

const RC = require('./../RC');
const Client = require('../..').Client;
const TopicOverloadPolicy = require('../..').TopicOverloadPolicy.TopicOverloadPolicy;
const ReliableTopicMessage = require('../../lib/proxy/topic/ReliableTopicMessage').ReliableTopicMessage;

describe('TopicTest', function () {

    this.timeout(40000);
    let cluster;
    let clientOne;
    let clientTwo;

    function createConfig(clusterName) {
        return {
            clusterName,
            reliableTopics : {
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
            reliableTopicMessage.publisherAddress = client.getClusterService().getLocalClient().localAddress;
            all.push(reliableTopicMessage);
        }
        return all;
    }

    before(function () {
        this.timeout(40000);
        const memberConfig = fs.readFileSync(__dirname + '/hazelcast_topic.xml', 'utf8');
        return RC.createCluster(null, memberConfig).then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        }).then(function () {
            const config = createConfig(cluster.id);
            return Promise.all([
                Client.newHazelcastClient(config).then(function (hazelcastClient) {
                    clientOne = hazelcastClient;
                }),
                Client.newHazelcastClient(config).then(function (hazelcastClient) {
                    clientTwo = hazelcastClient;
                })
            ]);
        });
    });

    after(function () {
        clientOne.shutdown();
        clientTwo.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('writes and reads messages', function (done) {
        const topicName = 't' + Math.random();
        let topicOne;
        let topicTwo;
        clientOne.getReliableTopic(topicName).then(function (t) {
            topicOne = t;
            return clientTwo.getReliableTopic(topicName);
        }).then(function (t) {
            topicTwo = t;
            topicTwo.addMessageListener(function (msg) {
                if (msg.messageObject['value'] === 'foo') {
                    done();
                }
            });
            setTimeout(function () {
                topicOne.publish({'value': 'foo'});
            }, 500);
        });
    });

    it('removed message listener does not receive items after removal', function (done) {
        const topicName = 't' + Math.random();
        let topicOne;
        let topicTwo;
        clientOne.getReliableTopic(topicName).then(function (topic) {
            topicOne = topic;
            return clientTwo.getReliableTopic(topicName);
        }).then(function (topic) {
            topicTwo = topic;
            let receivedMessages = 0;
            const id = topicTwo.addMessageListener(function (msg) {
                receivedMessages++;
                if (receivedMessages > 2) {
                    done(new Error('Kept receiving messages after message listener is removed.'));
                }
            });

            topicOne.publish({'value0': 'foo0'});
            topicOne.publish({'value1': 'foo1'});
            setTimeout(function () {
                topicTwo.removeMessageListener(id);
                topicOne.publish({'value2': 'foo2'});
                topicOne.publish({'value3': 'foo3'});
                topicOne.publish({'value4': 'foo4'});
                topicOne.publish({'value5': 'foo5'});
                setTimeout(done, 500);
            }, 500);
        });
    });

    it('blocks when there is no more space', function () {
        let topic;
        let ringbuffer;
        return clientOne.getReliableTopic('blocking').then(function (t) {
            topic = t;
            return topic.getRingbuffer();
        }).then(function (rb) {
            ringbuffer = rb;
            return ringbuffer.capacity();
        }).then(function (capacity) {
            const all = [];
            for (let i = 0; i < capacity.toNumber() + 1; i++) {
                all.push(i);
            }
            return ringbuffer.addAll(all);
        }).then(function () {
            const startTime = Date.now();
            return topic.publish(-50).then(function () {
                // Here we check that the call was indeed blocking
                // until the TTL of the first inserted entry has passed
                const elapsed = Date.now() - startTime;
                if (elapsed > 2000) {
                    return;
                } else {
                    throw new Error('Message was published too fast, expected at least a 2 second delay, got: ' + elapsed);
                }
            });
        });
    });

    it('continues operating when stale sequence is reached', function (done) {
        this.skip();
        let topic;
        let ringbuffer;
        clientOne.getReliableTopic('stale').then(function (t) {
            topic = t;
            return topic.getRingbuffer();
        }).then(function (rb) {
            ringbuffer = rb;
            topic.addMessageListener(function (e) {
                if (e.messageObject === 20) {
                    done();
                }
            });
            const all = generateItems(clientOne, 20);
            ringbuffer.addAll(all);
        });
    });

    it('discards the item when there is no more space', function () {
        let topic;
        let ringbuffer;
        return clientOne.getReliableTopic('discard').then(function (t) {
            topic = t;
            return topic.getRingbuffer();
        }).then(function (rb) {
            ringbuffer = rb;
            const all = generateItems(clientOne, 10);
            ringbuffer.addAll(all);
            return topic.publish(11);
        }).then(function () {
            return ringbuffer.tailSequence();
        }).then(function (seq) {
            return ringbuffer.readOne(seq);
        }).then(function (item) {
            const obj = clientOne.getSerializationService().toObject(item.payload);
            expect(obj).to.equal(10);
        });
    });

    it('overwrites the oldest item when there is no more space', function () {
        let topic;
        let ringbuffer;
        return clientOne.getReliableTopic('overwrite').then(function (t) {
            topic = t;
            return topic.getRingbuffer();
        }).then(function (rb) {
            ringbuffer = rb;
            const all = generateItems(clientOne, 10);
            ringbuffer.addAll(all);
            return topic.publish(11);
        }).then(function () {
            return ringbuffer.tailSequence();
        }).then(function (seq) {
            return ringbuffer.readOne(seq);
        }).then(function (item) {
            const obj = clientOne.getSerializationService().toObject(item.payload);
            expect(obj).to.equal(11);
        });
    });
});
