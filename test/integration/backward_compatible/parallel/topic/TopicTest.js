/*
 * Copyright (c) 2008-2026, Hazelcast, Inc. All Rights Reserved.
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
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const RC = require('../../../RC');
const TestUtil = require('../../../../TestUtil');

describe('TopicProxyTest', function () {
    let cluster;
    let client;
    let topic;
    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '6.0');
        cluster = await testFactory.createClusterForParallelTests();
        const member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({ clusterName: cluster.id }, member);
    });

    beforeEach(async function () {
        topic = await client.getTopic('ClientTopicTest');
        return null;
    });

    afterEach(async function () {
        return topic.destroy();
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('should be able to add a listener', async function() {
        const target = 'item-value';
        const collector = eventCollector();
        const topic = await client.getTopic('topic-listener');
        await topic.addMessageListener(collector);
        await topic.publish(target);
        await TestUtil.assertTrueEventually(async () => {
            expect(collector.events.length).equal(1);
            const event = collector.events[0];
            expect(event.messageObject).equal(target);
            expect(event.publishingTime.isZero()).equal(false);
        });
    });

    it('should be able to remove a listener', async function() {
        const collector = eventCollector();
        const topic = await client.getTopic('topic-listener');
        const listenerId = await topic.addMessageListener(collector);
        await topic.removeMessageListener(listenerId);
        await topic.publish('item-value');
        await TestUtil.assertTrueEventually(async () => {
            expect(collector.events.length).equal(0);
        });
    });
});

function eventCollector() {
    const events = [];
    function collector(e) {
        events.push(e);
    }
    collector.events = events;
    return collector;
}
