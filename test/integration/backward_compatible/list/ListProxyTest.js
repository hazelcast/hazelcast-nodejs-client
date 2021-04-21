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
const RC = require('../../RC');
const { Client } = require('../../../../');
const { ItemEventType } = require('../../../../lib/proxy/ItemListener');
const { deferredPromise } = require('../../../../lib/util/Util');

describe('ListProxyTest', function () {

    let cluster;
    let client;
    let list;

    before(async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        list = await client.getList('test');
    });

    afterEach(async function () {
        await list.destroy();
    });

    after(async function () {
        await client.shutdown();
        await RC.terminateCluster(cluster.id);
    });

    it('appends one item', async function () {
        await list.add(1);
        const size = await list.size();
        expect(size).to.equal(1);
    });

    it('inserts one item at index', async function () {
        await list.addAll([1, 2, 3]);
        await list.addAt(1, 5);
        const all = await list.toArray();
        expect(all).to.deep.equal([1, 5, 2, 3]);
    });

    it('clears', async function () {
        await list.addAll([1, 2, 3]);
        await list.clear();
        const size = await list.size();
        expect(size).to.equal(0);
    });

    it('inserts all elements of array at index', async function () {
        await list.addAll([1, 2, 3]);
        await list.addAllAt(1, [5, 6]);
        const all = await list.toArray();
        expect(all).to.deep.equal([1, 5, 6, 2, 3]);
    });

    it('gets item at index', async function () {
        const input = [1, 2, 3];
        await list.addAll(input);
        const result = await list.get(1);
        expect(result).to.equal(2);
    });

    it('removes item at index', async function () {
        const input = [1, 2, 3];
        await list.addAll(input);
        const removed = await list.removeAt(1);
        expect(removed).to.equal(2);
        const all = await list.toArray();
        expect(all).to.deep.equal([1, 3]);
    });

    it('replaces item at index', async function () {
        const input = [1, 2, 3];
        await list.addAll(input);
        const replaced = await list.set(1, 6);
        expect(replaced).to.equal(2);
        const all = await list.toArray();
        expect(all).to.deep.equal([1, 6, 3]);
    });

    it('contains', async function () {
        const input = [1, 2, 3];
        await list.addAll(input);
        const contains = await list.contains(1);
        expect(contains).to.be.true;
    });

    it('does not contain', async function () {
        const input = [1, 2, 3];
        await list.addAll(input);
        const contains = await list.contains(5);
        expect(contains).to.be.false;
    });

    it('contains all', async function () {
        await list.addAll([1, 2, 3]);
        const contains = await list.containsAll([1, 2]);
        expect(contains).to.be.true;
    });

    it('does not contain all', async function () {
        await list.addAll([1, 2, 3]);
        const contains = await list.containsAll([3, 4]);
        expect(contains).to.be.false;
    });

    it('is empty', async function () {
        const empty = await list.isEmpty();
        expect(empty).to.be.true;
    });

    it('is not empty', async function () {
        await list.add(1);
        const empty = await list.isEmpty();
        expect(empty).to.be.false;
    });

    it('removes an entry', async function () {
        await list.addAll([1, 2, 3]);
        await list.remove(1);
        const all = await list.toArray();
        expect(all).to.deep.equal([2, 3]);
    });

    it('removes an entry by index', async function () {
        await list.addAll([1, 2, 3]);
        await list.removeAt(1);
        const all = await list.toArray();
        expect(all).to.deep.equal([1, 3]);
    });

    it('removes multiple entries', async function () {
        await list.addAll([1, 2, 3, 4]);
        await list.removeAll([1, 2]);
        const all = await list.toArray();
        expect(all).to.deep.equal([3, 4]);
    });

    it('retains multiple entries', async function () {
        await list.addAll([1, 2, 3, 4]);
        await list.retainAll([1, 2]);
        const all = await list.toArray();
        expect(all).to.deep.equal([1, 2]);
    });

    it('finds index of the element', async function () {
        await list.addAll([1, 2, 4, 4]);
        const index = await list.indexOf(4);
        expect(index).to.equal(2);
    });

    it('finds last index of the element', async function () {
        await list.addAll([1, 2, 4, 4]);
        const index = await list.lastIndexOf(4);
        expect(index).to.equal(3);
    });

    it('returns a sub list', async function () {
        await list.addAll([1, 2, 3, 4, 5, 6]);
        const subList = await list.subList(1, 5);
        expect(subList.toArray()).to.deep.equal([2, 3, 4, 5]);
    });

    it('listens for added entry', function (done) {
        const listener = {
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        list.addItemListener(listener, true).then(() => {
            list.add(1);
        }).catch((e) => {
            done(e);
        });
    });

    it('listens for added and removed entry', function (done) {
        let added = false;
        const listener = {
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(2);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
                added = true;
            },
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(2);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                expect(added).to.be.true;
                done();
            }
        };
        list.addItemListener(listener, true).then(() => {
            return list.add(2);
        }).then(() => {
            return list.remove(2);
        }).catch((e) => {
            done(e);
        });
    });

    it('listens for removed entry with value included', function (done) {
        const listener = {
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        list.addItemListener(listener, true).then(() => {
            return list.add(1);
        }).then(() => {
            return list.remove(1);
        }).catch((e) => {
            done(e);
        });
    });

    it('listens for removed entry with value not included', function (done) {
        const listener = {
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(null);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        list.addItemListener(listener, false).then(() => {
            return list.add(1);
        }).then(() => {
            return list.remove(1);
        }).catch((e) => {
            done(e);
        });
    });

    it('remove entry listener', async function () {
        const itemRemovedNotTriggered = deferredPromise();
        const registrationId = await list.addItemListener({
            itemRemoved: () => {
                itemRemovedNotTriggered.reject(new Error('Listener should not be triggered'));
            }
        });

        const removed = await list.removeItemListener(registrationId);
        expect(removed).to.be.true;

        await list.add(1);
        await list.remove(1);

        setTimeout(itemRemovedNotTriggered.resolve, 1000);
        await itemRemovedNotTriggered.promise;
    });
});
