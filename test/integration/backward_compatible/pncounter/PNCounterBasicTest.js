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

describe('PNCounterBasicTest', function () {

    let cluster;
    let client;
    let pnCounter;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    beforeEach(async function () {
        pnCounter = await client.getPNCounter('pncounter');
    });

    afterEach(async function () {
        return pnCounter.destroy();
    });

    async function testPNCounterMethod(promise, returnVal, postOperation) {
        let value = await promise;
        expect(value.toNumber()).to.equal(returnVal);
        value = await pnCounter.get();
        return expect(value.toNumber()).to.equal(postOperation);
    }

    it('get', async function () {
        await pnCounter.getAndAdd(4);
        const value = await pnCounter.get();
        return expect(value.toNumber()).to.equal(4);
    });

    it('getAndAdd', async function () {
        return testPNCounterMethod(pnCounter.getAndAdd(3), 0, 3);
    });

    it('addAndGet', async function () {
        return testPNCounterMethod(pnCounter.addAndGet(3), 3, 3);
    });

    it('getAndSubtract', async function () {
        return testPNCounterMethod(pnCounter.getAndSubtract(3), 0, -3);
    });

    it('subtractAndGet', async function () {
        return testPNCounterMethod(pnCounter.subtractAndGet(3), -3, -3);
    });

    it('decrementAndGet', async function () {
        return testPNCounterMethod(pnCounter.decrementAndGet(3), -1, -1);
    });

    it('incrementAndGet', async function () {
        return testPNCounterMethod(pnCounter.incrementAndGet(), 1, 1);
    });

    it('getAndDecrement', async function () {
        return testPNCounterMethod(pnCounter.getAndDecrement(), 0, -1);
    });

    it('getAndIncrement', async function () {
        return testPNCounterMethod(pnCounter.getAndIncrement(), 0, 1);
    });
});
