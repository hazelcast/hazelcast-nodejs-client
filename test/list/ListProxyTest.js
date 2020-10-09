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
const RC = require('./../RC');
const { Client } = require('../../');
const { ItemEventType } = require('../../lib/proxy/ItemListener');

describe('ListProxyTest', function () {

    let cluster;
    let client;
    let listInstance;

    before(async function () {
        this.timeout(10000);
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        listInstance = await client.getList('test');
    });

    afterEach(async function () {
        return listInstance.destroy();
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('appends one item', async function () {
        await listInstance.add(1);
        const size = await listInstance.size();
        expect(size).to.equal(1);
    });

    it('inserts one item at index', async function () {
        await listInstance.addAll([1, 2, 3]);
        await listInstance.addAt(1, 5);
        const all = await listInstance.toArray();
        expect(all).to.deep.equal([1, 5, 2, 3]);
    });

    it('clears', async function () {
        await listInstance.addAll([1, 2, 3]);
        await listInstance.clear();
        const size = await listInstance.size();
        expect(size).to.equal(0);
    });

    it('inserts all elements of array at index', async function () {
        await listInstance.addAll([1, 2, 3]);
        await listInstance.addAllAt(1, [5, 6]);
        const all = await listInstance.toArray();
        expect(all).to.deep.equal([1, 5, 6, 2, 3]);
    });

    it('gets item at index', async function () {
        const input = [1, 2, 3];
        await listInstance.addAll(input);
        const result = await listInstance.get(1);
        expect(result).to.equal(2);
    });

    it('removes item at index', async function () {
        const input = [1, 2, 3];
        await listInstance.addAll(input);
        const removed = await listInstance.removeAt(1);
        expect(removed).to.equal(2);
        const all = await listInstance.toArray();
        expect(all).to.deep.equal([1, 3]);
    });

    it('replaces item at index', async function () {
        const input = [1, 2, 3];
        await listInstance.addAll(input);
        const replaced = await listInstance.set(1, 6);
        expect(replaced).to.equal(2);
        const all = await listInstance.toArray();
        expect(all).to.deep.equal([1, 6, 3]);
    });

    it('contains', async function () {
        const input = [1, 2, 3];
        await listInstance.addAll(input);
        const contains = await listInstance.contains(1);
        expect(contains).to.be.true;
    });

    it('does not contain', async function () {
        const input = [1, 2, 3];
        await listInstance.addAll(input);
        const contains = await listInstance.contains(5);
        expect(contains).to.be.false;
    });

    it('contains all', async function () {
        await listInstance.addAll([1, 2, 3]);
        const contains = await listInstance.containsAll([1, 2]);
        expect(contains).to.be.true;
    });

    it('does not contain all', async function () {
        await listInstance.addAll([1, 2, 3]);
        const contains = await listInstance.containsAll([3, 4]);
        expect(contains).to.be.false;
    });

    it('is empty', async function () {
        const empty = await listInstance.isEmpty();
        expect(empty).to.be.true;
    });

    it('is not empty', async function () {
        await listInstance.add(1);
        const empty = await listInstance.isEmpty();
        expect(empty).to.be.false;
    });

    it('removes an entry', async function () {
        await listInstance.addAll([1, 2, 3]);
        await listInstance.remove(1);
        const all = await listInstance.toArray();
        expect(all).to.deep.equal([2, 3]);
    });

    it('removes an entry by index', async function () {
        await listInstance.addAll([1, 2, 3]);
        await listInstance.removeAt(1);
        const all = await listInstance.toArray();
        expect(all).to.deep.equal([1, 3]);
    });

    it('removes multiple entries', async function () {
        await listInstance.addAll([1, 2, 3, 4]);
        await listInstance.removeAll([1, 2]);
        const all = await listInstance.toArray();
        expect(all).to.deep.equal([3, 4]);
    });

    it('retains multiple entries', async function () {
        await listInstance.addAll([1, 2, 3, 4]);
        await listInstance.retainAll([1, 2]);
        const all = await listInstance.toArray();
        expect(all).to.deep.equal([1, 2]);
    });

    it('finds index of the element', async function () {
        await listInstance.addAll([1, 2, 4, 4]);
        const index = await listInstance.indexOf(4);
        expect(index).to.equal(2);
    });

    it('finds last index of the element', async function () {
        await listInstance.addAll([1, 2, 4, 4]);
        const index = await listInstance.lastIndexOf(4);
        expect(index).to.equal(3);
    });

    it('returns a sub list', async function () {
        await listInstance.addAll([1, 2, 3, 4, 5, 6]);
        const subList = await listInstance.subList(1, 5);
        expect(subList.toArray()).to.deep.equal([2, 3, 4, 5]);
    });

    it('listens for added entry', function (done) {
        this.timeout(5000);
        const listener = {
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        listInstance.addItemListener(listener, true).then(function () {
            listInstance.add(1);
        }).catch(function (e) {
            done(e);
        });
    });

    it('listens for added and removed entry', function (done) {
        this.timeout(5000);
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
        listInstance.addItemListener(listener, true).then(function () {
            return listInstance.add(2);
        }).then(function () {
            return listInstance.remove(2);
        }).catch(function (e) {
            done(e);
        });
    });

    it('listens for removed entry with value included', function (done) {
        this.timeout(5000);
        const listener = {
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        listInstance.addItemListener(listener, true).then(function () {
            return listInstance.add(1);
        }).then(function () {
            return listInstance.remove(1);
        }).catch(function (e) {
            done(e);
        });
    });

    it('listens for removed entry with value not included', function (done) {
        this.timeout(5000);
        const listener = {
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(null);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        };
        listInstance.addItemListener(listener, false).then(function () {
            return listInstance.add(1);
        }).then(function () {
            return listInstance.remove(1);
        }).catch(function (e) {
            done(e);
        });
    });

    it('remove entry listener', async function () {
        this.timeout(5000);
        const registrationId = await listInstance.addItemListener({
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
            }
        });
        const removed = await listInstance.removeItemListener(registrationId);
        expect(removed).to.be.true;
    });
});
