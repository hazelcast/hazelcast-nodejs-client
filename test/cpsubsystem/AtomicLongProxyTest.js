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
const fs = require('fs');
const Long = require('long');
const RC = require('./../RC');
const { Client } = require('../../');

describe('AtomicLongProxyTest', function () {

    let cluster;
    let client;
    let long;

    function expectLong(expected, long) {
        return expect(long.toString()).to.equal(Long.fromValue(expected).toString());
    }

    before(async function () {
        this.timeout(30000);
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_cpsubsystem.xml', 'utf8'))
        await Promise.all([
            RC.startMember(cluster.id),
            RC.startMember(cluster.id),
            RC.startMember(cluster.id)
        ]);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    beforeEach(async function () {
        long = await client.getAtomicLong('along');
    });

    afterEach(async function () {
        return long.destroy();
    });

    after(async function () {
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    it('get: should return 0 initially', async function () {
        const value = await long.get();
        expectLong(0, value);
    });

    it('addAndGet: should return added value', async function () {
        const value = await long.addAndGet(33);
        expectLong(33, value);
    });

    it('addAndGet: should add', async function () {
        await long.addAndGet(33);
        const value = await long.get();
        expectLong(33, value);
    });

    it('getAndAdd: should return old value', async function () {
        const value = await long.getAndAdd(123);
        expectLong(0, value);
    });

    it('getAndAdd: should add', async function () {
        await long.getAndAdd(123);
        const value = await long.get();
        return expectLong(123, value);
    });

    it('decrementAndGet: should decrement', async function () {
        const value = await long.decrementAndGet();
        expectLong(-1, value);
    });

    it('compareAndSet: should set the value when condition is met', async function () {
        await long.set(42);
        const result = await long.compareAndSet(42, 13);
        expect(result).to.be.true;
        const value = await long.get();
        expectLong(13, value);
    });

    it('compareAndSet: should have no effect when condition is not met', async function () {
        await long.set(42);
        const result = await long.compareAndSet(13, 13);
        expect(result).to.be.false;
        const value = await long.get();
        expectLong(42, value);
    });

    it('set: should set new value', async function () {
        await long.set(1001);
        const value = await long.get();
        expectLong(1001, value);
    });

    it('getAndSet: should return old value', async function () {
        const value = await long.getAndSet(-123);
        expectLong(0, value);
    });

    it('getAndSet: should set the value', async function () {
        await long.getAndSet(-123);
        const value = await long.get();
        expectLong(-123, value);
    });

    it('incrementAndGet: should increment', async function () {
        const value = await long.incrementAndGet();
        expectLong(1, value);
    });

    it('getAndIncrement: should return old value', async function () {
        const value = await long.getAndIncrement();
        expectLong(0, value);
    });

    it('getAndIncrement: should increment the value', async function () {
        await long.getAndIncrement(2);
        const value = await long.get();
        expectLong(2, value);
    });
});
