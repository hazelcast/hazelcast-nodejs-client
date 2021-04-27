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

describe('SetProxyTest', function () {

    let cluster;
    let client;
    let setInstance;

    before(async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        setInstance = await client.getSet('test');
    });

    afterEach(async function () {
        return setInstance.destroy();
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('adds one item', async function () {
        await setInstance.add(1);
        const size = await setInstance.size();
        expect(size).to.equal(1);
    });

    it('adds all', async function () {
        await setInstance.addAll([1, 2, 3]);
        const size = await setInstance.size();
        expect(size).to.equal(3);
    });

    it('toArray', async function () {
        const input = [1, 2, 3];
        await setInstance.addAll(input);
        const all = await setInstance.toArray();
        expect(all.sort()).to.deep.equal(input);
    });

    it('contains', async function () {
        const input = [1, 2, 3];
        await setInstance.addAll(input);
        let contains = await setInstance.contains(1);
        expect(contains).to.be.true;
        contains = await setInstance.contains(5);
        expect(contains).to.be.false;
    });

    it('contains all', async function () {
        await setInstance.addAll([1, 2, 3]);
        let contains = await setInstance.containsAll([1, 2]);
        expect(contains).to.be.true;
        contains = await setInstance.containsAll([3, 4]);
        expect(contains).to.be.false;
    });

    it('is empty', async function () {
        let empty = await setInstance.isEmpty();
        expect(empty).to.be.true;
        await setInstance.add(1);
        empty = await setInstance.isEmpty();
        expect(empty).to.be.false;
    });

    it('removes an entry', async function () {
        await setInstance.addAll([1, 2, 3]);
        await setInstance.remove(1);
        const all = await setInstance.toArray();
        expect(all.sort()).to.deep.equal([2, 3]);
    });

    it('removes multiple entries', async function () {
        await setInstance.addAll([1, 2, 3, 4]);
        await setInstance.removeAll([1, 2]);
        const all = await setInstance.toArray();
        expect(all.sort()).to.deep.equal([3, 4]);
    });

    it('retains multiple entries', async function () {
        await setInstance.addAll([1, 2, 3, 4]);
        await setInstance.retainAll([1, 2]);
        const all = await setInstance.toArray();
        expect(all.sort()).to.deep.equal([1, 2]);
    });

    it('clear', async function () {
        await setInstance.addAll([1, 2, 3, 4]);
        await setInstance.clear();
        const s = await setInstance.size();
        expect(s).to.equal(0);
    });

    it('listens for added entry', function (done) {
        setInstance.addItemListener({
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        }).then(() => {
            setInstance.add(1);
        }).catch((e) => {
            done(e);
        });
    });

    it('listens for added and removed entry', function (done) {
        setInstance.addItemListener({
            itemAdded: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(2);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.ADDED);
                expect(itemEvent.member).to.not.be.equal(null);
            },
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(2);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            },
        }).then(() => {
            return setInstance.add(2);
        }).then(() => {
            return setInstance.remove(2);
        }).catch((e) => {
            done(e);
        });
    });

    it('listens for removed entry', function (done) {
        setInstance.addItemListener({
            itemRemoved: function (itemEvent) {
                expect(itemEvent.name).to.be.equal('test');
                expect(itemEvent.item).to.be.equal(1);
                expect(itemEvent.eventType).to.be.equal(ItemEventType.REMOVED);
                expect(itemEvent.member).to.not.be.equal(null);
                done();
            }
        }).then(() => {
            return setInstance.add(1);
        }).then(() => {
            return setInstance.remove(1);
        }).catch((e) => {
            done(e);
        });
    });

    it('remove entry listener', async function () {
        const registrationId = await setInstance.addItemListener({});
        const removed = await setInstance.removeItemListener(registrationId);
        expect(removed).to.be.true;
    });
});
