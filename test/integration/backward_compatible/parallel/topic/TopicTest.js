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
        // TestUtil.markClientVersionAtLeast(this, '5.3')
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
                this.events.push(event);
            }
        }

        const collector = new Collector();
        await topic.addListener(collector.onMessage.bind(collector));
        await topic.publish('item-value');

        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (collector.events.length === 1) {
                    clearInterval(interval);
                    const event = collector.events[0];
                    expect(event.messageObject).to.equal('item-value');
                    expect(event.publishingTime).to.exist;
                    if (event.publishingTime) {
                        expect(event.publishingTime.toNumber()).to.be.greaterThan(0);
                    }
                    resolve();
                }
            }, 100);
        });
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

        await TestUtil.assertTrueEventually(async () => {
            expect(count).to.equal(1);
            expect(receivedValues).to.deep.equal([message]);
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

        await TestUtil.assertTrueEventually(async () => {
            expect(count).to.equal(messages.length);
            expect(receivedValues).to.have.members(messages);
        });
    });

    it('tests publishAll with one null element in an array', async function() {
        const messages = [1, null, 3];
        await expect(() => topic.publishAll(messages)).to.throw('Non null value expected.');
    });

    it('tests publishAll with null array', async function() {
        const messages = null;
        await expect(() => topic.publishAll(messages)).to.throw('Non null value expected.');
    });

    it('tests publishAll with null elements array', async function() {
        const messages = [null, null, null];
        await expect(() => topic.publishAll(messages)).to.throw('Non null value expected.');
    });
});
