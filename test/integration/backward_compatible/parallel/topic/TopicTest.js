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

const expect = require('chai').expect;
const TestUtil = require('../../../../TestUtil');
const RC = require('../../../RC');

describe('TopicTest', function () {
    let client;
    let topic;

    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        const cluster = await testFactory.createClusterForParallelTests();
        const member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id
        }, member);
    });

    beforeEach(async function () {
        topic = await client.getTopic('topic-test');
    });

    afterEach(async function () {
        return topic.destroy();
    });

    it('tests listener', async function () {
        class Collector {
            constructor() {
                this.events = [];
            }

            onMessage(event) {
                event.publish_time = Date.now();
                this.events.push(event);
            }
        }

        const collector = new Collector();

        setTimeout(() => {
            expect(collector.events.length).to.be.equal(1);
            const event = collector.events[0];
            expect(event.message).to.be('item-value');
            expect(event.publish_time).to.be.above(0);
        }, 5000);
    });

    it('removes listener', async function() {
        class Collector {
            constructor() {
                this.events = [];
            }

            onMessage(event) {
                this.events.push(event);
            }
        }

        const collector = new Collector();
        const reg_id = await topic.addListener(collector.onMessage.bind(collector));
        await topic.removeListener(reg_id);
        await topic.publish('item-value');

        setTimeout(() => {
            expect(collector.events.length).to.be(0);
        }, 5000);
    });

    it('tests publish', async function () {
        let count = 0;
        const receivedValues = [];

        await topic.addListener((message) => {
            count++;
            receivedValues.push(message.messageObject);
        });

        const message = 'message';
        await topic.publish(message);

        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (count === 1) {
                    clearInterval(interval);
                    expect(receivedValues).to.deep.equal([message]);
                    resolve();
                }
            }, 100);
        });
    });

    it('tests publishAll', async function() {
        let count = 0;
        const receivedValues = [];

        await topic.addListener((message) => {
            count++;
            receivedValues.push(message.messageObject);
        });

        const messages = ['message 1', 'message 2', 'message 3'];
        await topic.publishAll(messages);

        await new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (count === messages.length) {
                    clearInterval(interval);
                    expect(receivedValues).to.have.members(messages);
                    resolve();
                }
            }, 100);
            setTimeout(() => {
                clearInterval(interval);
                reject(new Error('Timed out while waiting for messages to be published'));
            }, 5000);
        });
    });

    it('tests publishAll with null', async function() {
        let count = 0;
        const receivedValues = [];

        await topic.addListener((message) => {
            count++;
            receivedValues.push(message.messageObject);
        });

        const messages = [1, null, 3];
        await topic.publishAll(messages);

        await new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (count === messages.length) {
                    clearInterval(interval);
                    expect(receivedValues).to.have.members(messages);
                    resolve();
                }
            }, 100);
            setTimeout(() => {
                clearInterval(interval);
                reject(new Error('Timed out while waiting for messages to be published'));
            }, 5000);
        });
    });
});
