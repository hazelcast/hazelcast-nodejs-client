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
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const fs = require('fs');

const RC = require('../../RC');
const { Client } = require('../../../../');
const { ItemEventType } = require('../../../../lib/proxy/ItemListener');

describe('QueueProxyTest', function () {

    let cluster;
    let client;
    let queue;

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_queue.xml', 'utf8'));
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        queue = await client.getQueue('ClientQueueTest');
        return offerToQueue(10);
    });

    afterEach(async function () {
        return queue.destroy();
    });

    async function offerToQueue(size, prefix) {
        if (prefix == null) {
            prefix = '';
        }
        const promises = [];
        for (let i = 0; i < size; i++) {
            promises.push(queue.offer(prefix + 'item' + i));
        }
        return Promise.all(promises);
    }

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('size', async function () {
        const s = await queue.size();
        expect(s).to.equal(10);
    });

    it('peek', async function () {
        const head = await queue.peek();
        expect(head).to.equal('item0');
    });

    it('add return true', async function () {
        const retVal = await queue.add('item_new');
        expect(retVal).to.be.true;
    });

    it('add increases queue size', async function () {
        await queue.add('item_new');
        const s = await queue.size();
        expect(s).to.equal(11);
    });

    it('add throws if queue is full', async function () {
        await offerToQueue(5, 'new');
        return expect(queue.add('excess_item')).to.eventually.rejected;
    });

    it('poll decreases queue size', async function () {
        await queue.poll();
        const s = await queue.size();
        expect(s).to.equal(9);
    });

    it('poll returns the head of the queue', async function () {
        const ret = await queue.poll();
        expect(ret).to.equal('item0');
    });

    it('poll returns null after timeout', async function () {
        await queue.clear();
        const ret = await queue.poll(1000);
        expect(ret).to.be.null;
    });

    it('poll returns head after a new element added', async function () {
        await queue.clear();
        setTimeout(async () => {
            await queue.offer('new_item');
        }, 500);
        const ret = await queue.poll(1000);
        expect(ret).to.equal('new_item');
    });

    it('offer with timeout', async function () {
        await queue.offer('new_item', 1000);
        const s = await queue.size();
        expect(s).to.equal(11);
    });

    it('remaining capacity', async function () {
        const c = await queue.remainingCapacity();
        expect(c).to.equal(5);
    });

    it('contains returns false for absent', async function () {
        const ret = await queue.contains('item_absent');
        expect(ret).to.be.false;
    });

    it('contains returns true for present', async function () {
        const ret = await queue.contains('item0');
        expect(ret).to.be.true;
    });

    it('remove', async function () {
        const ret = await queue.remove('item5');
        expect(ret).to.be.true;
    });

    it('remove decreases size', async function () {
        await queue.remove('item5');
        const s = await queue.size();
        expect(s).to.equal(9);
    });

    it('toArray', async function () {
        const arr = await queue.toArray();
        expect(arr).to.be.instanceof(Array);
        expect(arr).to.have.lengthOf(10);
        expect(arr).to.include.members(['item0', 'item2', 'item9']);
    });

    it('clear', async function () {
        await queue.clear();
        const s = await queue.size();
        expect(s).to.equal(0);
    });

    it('drainTo', async function () {
        const dummyArr = ['dummy_item'];
        await queue.drainTo(dummyArr);
        expect(dummyArr).to.have.lengthOf(11);
        expect(dummyArr).to.include.members(['item0', 'dummy_item', 'item3', 'item9']);
    });

    it('drainTo with max elements', async function () {
        const dummyArr = ['dummy_item'];
        await queue.drainTo(dummyArr, 2);
        expect(dummyArr).to.have.lengthOf(3);
        expect(dummyArr).to.include.members(['item0', 'dummy_item', 'item1']);
        expect(dummyArr).to.not.include.members(['item2', 'item9']);
    });

    it('isEmpty false', async function () {
        const ret = await queue.isEmpty();
        expect(ret).to.be.false;
    });

    it('isEmpty true', async function () {
        await queue.clear();
        const ret = await queue.isEmpty();
        expect(ret).to.be.true;
    });

    it('take waits', function (done) {
        queue.clear().then(() => {
            queue.take().then((val) => {
                expect(val).to.equal('item_new');
                done();
            }).catch(done);
            queue.add('item_new').catch(done);
        }).catch(done);
    });

    it('take immediately returns', async function () {
        const ret = await queue.take();
        expect(ret).to.equal('item0');
    });

    it('addAll', async function () {
        const values = ['a', 'b', 'c'];
        const retVal = await queue.addAll(values);
        expect(retVal).to.be.true;
        const vals = await queue.toArray();
        expect(vals).to.include.members(values);
    });

    it('containsAll true', async function () {
        const values = ['item0', 'item1'];
        const ret = await queue.containsAll(values);
        expect(ret).to.be.true;
    });

    it('containsAll false', async function () {
        const values = ['item0', 'item_absent'];
        const ret = await queue.containsAll(values);
        expect(ret).to.be.false;
    });

    it('containsAll true - empty list', async function () {
        const values = [];
        const ret = await queue.containsAll(values);
        expect(ret).to.be.true;
    });

    it('put', async function () {
        await queue.put('item_new');
        const s = await queue.size();
        expect(s).to.equal(11);
    });

    it('removeAll', async function () {
        const cand = ['item1', 'item2'];
        const retVal = await queue.removeAll(cand);
        expect(retVal).to.be.true;
        const arr = await queue.toArray();
        expect(arr).to.not.include.members(cand);
    });

    it('retainAll changes queue', async function () {
        const retains = ['item1', 'item2'];
        const r = await queue.retainAll(retains);
        expect(r).to.be.true;
        const arr = await queue.toArray();
        expect(arr).to.deep.equal(retains);
    });

    it('retainAll does not change queue', async function () {
        const retains = await queue.toArray();
        const r = await queue.retainAll(retains);
        expect(r).to.be.false;
        const arr = await queue.toArray();
        expect(arr).to.deep.equal(retains);
    });

    it('addItemListener itemAdded', function (done) {
        queue.addItemListener({
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('ClientQueueTest');
                expect(itemEvent.item).to.be.equal('item_new');
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        }, true).then(() => {
            queue.add('item_new');
        });
    });

    it('addItemListener itemAdded with includeValue=false', function (done) {
        queue.addItemListener({
            itemAdded: () => {
                done();
            }
        }, false).then(() => {
            queue.add('item_new');
        });
    });

    it('addItemListener itemRemoved', function (done) {
        queue.addItemListener({
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('ClientQueueTest');
                expect(itemEvent.item).to.be.equal('item0');
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        }, true).then(() => {
            queue.remove('item0');
        });
    });

    it('removeItemListener', async function () {
        const registrationId = await queue.addItemListener({}, false);
        const removed = await queue.removeItemListener(registrationId);
        expect(removed).to.be.true;
    });

    it('removeItemListener with wrong id returns false', async function () {
        await queue.addItemListener({}, false);
        const removed = await queue.removeItemListener('wrongId');
        expect(removed).to.be.false;
    });
});
