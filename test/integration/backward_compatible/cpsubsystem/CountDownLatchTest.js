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
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const fs = require('fs');
const { AssertionError } = require('assert');

const RC = require('../../RC');
const {
    Client,
    DistributedObjectDestroyedError
} = require('../../../../');

describe('CountDownLatchTest', function () {

    let cluster;
    let client;
    let groupSeq = 0;

    // we use a separate latch (and group) per each test to enforce test isolation
    async function getLatch(initialCount) {
        const latch = await client.getCPSubsystem().getCountDownLatch('alatch@group' + groupSeq++);
        if (initialCount) {
            await latch.trySetCount(initialCount);
        }
        return latch;
    }

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_cpsubsystem.xml', 'utf8'));
        await Promise.all([
            RC.startMember(cluster.id),
            RC.startMember(cluster.id),
            RC.startMember(cluster.id)
        ]);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    after(async function () {
        await client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    it('should create CountDownLatch with respect to given CP group', async function () {
        const latch = await getLatch();
        const latchInAnotherGroup = await getLatch();

        await latchInAnotherGroup.trySetCount(42);
        let count = await latchInAnotherGroup.getCount();
        expect(count).to.be.equal(42);

        count = await latch.getCount();
        expect(count).to.be.not.equal(42);
    });

    it('destroy: should destroy CountDownLatch and throw on operation', async function () {
        const latch = await getLatch();
        await latch.destroy();
        // the next destroy call should be ignored
        await latch.destroy();

        await expect(latch.getCount()).to.be.rejectedWith(DistributedObjectDestroyedError);
    });

    it('trySetCount: should throw on negative count', async function () {
        const latch = await getLatch();
        expect(() => latch.trySetCount(-1)).to.throw(AssertionError);
    });

    it('trySetCount: should throw on zero count', async function () {
        const latch = await getLatch();
        expect(() => latch.trySetCount(0)).to.throw(AssertionError);
    });

    it('trySetCount: should throw on non-number count', async function () {
        const latch = await getLatch();
        expect(() => latch.trySetCount('count')).to.throw(AssertionError);
    });

    it('trySetCount: should succeed when not set', async function () {
        const latch = await getLatch();

        const result = await latch.trySetCount(3);
        expect(result).to.be.true;

        const count = await latch.getCount();
        expect(count).to.be.equal(3);
    });

    it('trySetCount: should not succeed when already set', async function () {
        const latch = await getLatch();

        await latch.trySetCount(10);

        let result = await latch.trySetCount(20);
        expect(result).to.be.false;
        result = await latch.trySetCount(30);
        expect(result).to.be.false;

        const count = await latch.getCount();
        expect(count).to.be.equal(10);
    });

    it('trySetCount: should succeed when count goes to zero', async function () {
        const latch = await getLatch(1);

        await latch.countDown();
        await latch.await(0);

        const result = await latch.trySetCount(1001);
        expect(result).to.be.true;
        const count = await latch.getCount();
        expect(count).to.be.equal(1001);
    });

    it('countDown: should reduce count', async function () {
        const latch = await getLatch(10);

        for (let i = 9; i >= 0; i--) {
            await latch.countDown();
            const count = await latch.getCount();
            expect(count).to.be.equal(i);
        }

        await latch.countDown();
        const count = await latch.getCount();
        expect(count).to.be.equal(0);
    });

    it('getCount: should return current count', async function () {
        const latch = await getLatch(42);

        const count = await latch.getCount();
        expect(count).to.be.equal(42);
    });

    it('await: should throw on non-number timeout', async function () {
        const latch = await getLatch();
        expect(() => latch.await('timeout')).to.throw(AssertionError);
    });

    it('await: should treat negative timeout as zero', async function () {
        const latch = await getLatch(1);

        const result = await latch.await(-1);
        expect(result).to.be.false;
    });

    it('await: should return immediately on zero timeout', async function () {
        const latch = await getLatch(1);

        const result = await latch.await(0);
        expect(result).to.be.false;
    });

    it('await: should return when timeout is reached', async function () {
        const latch = await getLatch(1);

        const start = Date.now();
        await latch.await(100);
        expect(Date.now() - start).to.be.greaterThan(100);
    });

    it('await: should return from multiple waiting calls', async function () {
        const latch = await getLatch(1);

        let completed = 0;
        const awaiters = [];
        for (let i = 0; i < 10; i++) {
            awaiters.push(
                latch.await(10000)
                    .then((result) => {
                        if (result) {
                            completed++;
                        }
                    })
            );
        }

        await latch.countDown();
        await Promise.all(awaiters);

        expect(completed).to.be.equal(10);
    });
});
