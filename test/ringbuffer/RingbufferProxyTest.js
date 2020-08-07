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

const { expect } = require('chai');
const { Client } = require('../../');
const RC = require('./../RC');
const fs = require('fs');
const PrefixFilter = require('../javaclasses/PrefixFilter');
const Promise = require('bluebird');

describe('RingbufferProxyTest', function () {

    let cluster;
    let client;
    let rb;

    before(async function () {
        this.timeout(10000);
        const config = fs.readFileSync(__dirname + '/hazelcast_ringbuffer.xml', 'utf8');
        cluster = await RC.createCluster(null, config);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        rb = await client.getRingbuffer('test');
    });

    afterEach(async function () {
        return rb.destroy();
    });

    after(async function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('adds one item and reads back', async function () {
        return rb.add(1).then(function (sequence) {
            return rb.readOne(sequence).then(function (item) {
                expect(item).to.equal(1);
            });
        });
    });

    it('adds multiple items and reads them back one by one', async function () {
        return rb.addAll([1, 2, 3]).then(function () {
            return Promise.all([
                rb.readOne(0), rb.readOne(1), rb.readOne(2)
            ]).then(function (items) {
                expect(items).to.deep.equal([1, 2, 3]);
            });
        });
    });

    it('readOne throws on negative seq', function () {
        expect(() => rb.readOne(-1)).to.throw(RangeError);
    });

    it('readMany throws on negative start seq', function () {
        expect(() => rb.readMany(-1)).to.throw(RangeError);
    });

    it('readMany throws on negative min count', function () {
        expect(() => rb.readMany(0, -1)).to.throw(RangeError);
    });

    it('readMany throws on min count great than max count', function () {
        expect(() => rb.readMany(0, 2, 1)).to.throw(RangeError);
    });

    it('readMany reads all items at once', async function () {
        await rb.addAll([1, 2, 3]);
        const items = await rb.readMany(0, 1, 3);
        expect(items.get(0)).to.equal(1);
        expect(items.get(1)).to.equal(2);
        expect(items.get(2)).to.equal(3);
        expect(items.getReadCount()).to.equal(3);
        expect(items.getNextSequenceToReadFrom().toNumber()).to.equal(3);
    });

    it('readMany with filter filters the results', async function () {
        await rb.addAll(['item1', 'prefixedItem2', 'prefixedItem3']);
        const items = await rb.readMany(0, 1, 3, new PrefixFilter('prefixed'));
        expect(items.get(0)).to.equal('prefixedItem2');
        expect(items.get(1)).to.equal('prefixedItem3');
    });

    it('correctly reports tail sequence', async function () {
        await rb.addAll([1, 2, 3]);
        const sequence = await rb.tailSequence();
        expect(sequence.toNumber()).to.equal(2);
    });

    it('correctly reports head sequence', async function () {
        const limitedCapacity = await client.getRingbuffer('capacity');
        await limitedCapacity.addAll([1, 2, 3, 4, 5]);
        const sequence = await limitedCapacity.headSequence();
        expect(sequence.toNumber()).to.equal(2);
    });

    it('correctly reports remaining capacity', async function () {
        const ttl = await client.getRingbuffer('ttl-cap');
        await ttl.addAll([1, 2]);
        const rc = await ttl.remainingCapacity();
        expect(rc.toNumber()).to.equal(3);
    });

    it('correctly reports total capacity', async function () {
        const ttl = await client.getRingbuffer('ttl-cap');
        const capacity = await ttl.capacity();
        expect(capacity.toNumber()).to.equal(5);
    });

    it('correctly reports size', async function () {
        await rb.addAll([1, 2]);
        const size = await rb.size();
        expect(size.toNumber()).to.equal(2);
    });
});
