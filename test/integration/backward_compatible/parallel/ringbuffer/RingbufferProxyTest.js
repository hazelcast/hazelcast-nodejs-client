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
const path = require('path');
const RC = require('../../../RC');
const { StaleSequenceError } = require('../../../../../lib');
const PrefixFilter = require('../../../javaclasses/PrefixFilter');
const TestUtil = require('../../../../TestUtil');

describe('RingbufferProxyTest', function () {
    let client;
    let rb;
    let ttlRb;
    let limitedCapacityRb;

    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        const config = fs.readFileSync(path.join(__dirname, 'hazelcast_ringbuffer.xml'), 'utf8');
        const cluster = await testFactory.createClusterForParallelTest(null, config);
        const member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTest({
            clusterName: cluster.id
        }, member);
    });

    beforeEach(async function () {
        rb = await client.getRingbuffer('test');
        ttlRb = await client.getRingbuffer('ttl-cap');
        limitedCapacityRb = await client.getRingbuffer('capacity');
    });

    afterEach(async function () {
        await rb.destroy();
        await ttlRb.destroy();
        await limitedCapacityRb.destroy();
    });

    after(async function () {
        await testFactory.cleanUp();
    });

    it('adds one item and reads back', async function () {
        const sequence = await rb.add(1);
        const item = await rb.readOne(sequence);
        expect(item).to.equal(1);
    });

    it('adds multiple items and reads them back one by one', async function () {
        await rb.addAll([1, 2, 3]);
        const items = await Promise.all([
            rb.readOne(0), rb.readOne(1), rb.readOne(2)
        ]);
        expect(items).to.deep.equal([1, 2, 3]);
    });

    it('readOne throws on read stale sequence', async function () {
        await limitedCapacityRb.addAll([1, 2, 3, 4, 5]);
        try {
            await limitedCapacityRb.readOne(0);
            return Promise.reject('Test failed as readOne did not throw');
        } catch (e) {
            expect(e).to.be.an.instanceof(StaleSequenceError);
        }
    });

    it('readOne throws on negative sequence', function () {
        expect(() => rb.readOne(-1)).to.throw(RangeError);
    });

    it('readMany throws on negative start sequence', function () {
        expect(() => rb.readMany(-1)).to.throw(RangeError);
    });

    it('readMany throws on negative min count', function () {
        expect(() => rb.readMany(0, -1)).to.throw(RangeError);
    });

    it('readMany throws on min count greater than max count', function () {
        expect(() => rb.readMany(0, 2, 1)).to.throw(RangeError);
    });

    it('readMany throws on too large max count', function () {
        expect(() => rb.readMany(0, 1, 1001)).to.throw(RangeError);
    });

    it('readMany reads all items at once', async function () {
        await rb.addAll([1, 2, 3]);
        const items = await rb.readMany(0, 1, 3);
        expect(items.get(0)).to.equal(1);
        expect(items.get(1)).to.equal(2);
        expect(items.get(2)).to.equal(3);
        expect(items.getReadCount()).to.equal(3);
        expect(items.size()).to.equal(3);
        expect(items.getNextSequenceToReadFrom().toNumber()).to.equal(3);
    });

    it('readMany with filter filters the results', async function () {
        await rb.addAll(['item1', 'prefixedItem2', 'prefixedItem3']);
        const items = await rb.readMany(0, 1, 3, new PrefixFilter('prefixed'));
        expect(items.get(0)).to.equal('prefixedItem2');
        expect(items.get(1)).to.equal('prefixedItem3');
        expect(items.getReadCount()).to.equal(3);
        expect(items.size()).to.equal(2);
    });

    it('readMany reads newer items when sequence is no longer available', async function () {
        await limitedCapacityRb.addAll([1, 2, 3, 4, 5]);
        const items = await limitedCapacityRb.readMany(0, 1, 2);
        expect(items.get(0)).to.equal(3);
        expect(items.get(1)).to.equal(4);
        expect(items.getReadCount()).to.equal(2);
        expect(items.size()).to.equal(2);
        expect(items.getNextSequenceToReadFrom().toNumber()).to.equal(4);
    });

    it('correctly reports tail sequence', async function () {
        await rb.addAll([1, 2, 3]);
        const sequence = await rb.tailSequence();
        expect(sequence.toNumber()).to.equal(2);
    });

    it('correctly reports head sequence', async function () {
        await limitedCapacityRb.addAll([1, 2, 3, 4, 5]);
        const sequence = await limitedCapacityRb.headSequence();
        expect(sequence.toNumber()).to.equal(2);
    });

    it('correctly reports remaining capacity', async function () {
        await ttlRb.addAll([1, 2]);
        const rc = await ttlRb.remainingCapacity();
        expect(rc.toNumber()).to.equal(3);
    });

    it('correctly reports total capacity', async function () {
        const capacity = await ttlRb.capacity();
        expect(capacity.toNumber()).to.equal(5);
    });

    it('correctly reports size', async function () {
        await rb.addAll([1, 2]);
        const size = await rb.size();
        expect(size.toNumber()).to.equal(2);
    });
});
