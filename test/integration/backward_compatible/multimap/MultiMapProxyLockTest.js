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
const Client = require('../../../..').Client;

describe('MultiMapProxyLockTest', function () {

    let cluster;
    let clientOne;
    let clientTwo;

    let mapOne;
    let mapTwo;

    before(async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        const cfg = { clusterName: cluster.id };
        clientOne = await Client.newHazelcastClient(cfg);
        clientTwo = await Client.newHazelcastClient(cfg);
    });

    beforeEach(async function () {
        mapOne = await clientOne.getMultiMap('test');
        mapTwo = await clientTwo.getMultiMap('test');
    });

    afterEach(async function () {
        return Promise.all([mapOne.destroy(), mapTwo.destroy()]);
    });

    after(async function () {
        await clientOne.shutdown();
        await clientTwo.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('locks and unlocks', async function () {
        const startTime = Date.now();
        await mapOne.put(1, 2);
        await mapOne.lock(1);
        setTimeout(async () => {
            await mapOne.unlock(1);
        }, 1000);
        await mapTwo.lock(1);
        const elapsed = Date.now() - startTime;
        expect(elapsed).to.be.greaterThan(995);
    });

    it('unlocks after lease expired', async function () {
        const startTime = Date.now();
        await mapOne.lock(1, 1000);
        await mapTwo.lock(1);
        const elapsed = Date.now() - startTime;
        expect(elapsed).to.be.greaterThan(995);
    });

    it('gives up attempt to lock after timeout is exceeded', async function () {
        await mapOne.lock(1);
        const acquired = await mapTwo.tryLock(1, 1000);
        expect(acquired).to.be.false;
    });

    it('acquires lock before timeout is exceeded', async function () {
        const startTime = Date.now();
        await mapOne.lock(1, 1000);
        const acquired = await mapTwo.tryLock(1, 2000);
        const elapsed = Date.now() - startTime;
        expect(acquired).to.be.true;
        expect(elapsed).to.be.greaterThan(995);
    });

    it('acquires the lock before timeout and unlocks after lease expired', async function () {
        const startTime = Date.now();
        await mapOne.lock(1, 1000);
        await mapTwo.tryLock(1, 2000, 1000);
        let elapsed = Date.now() - startTime;
        expect(elapsed).to.be.greaterThan(995);
        await mapOne.lock(1, 2000);
        elapsed = Date.now() - startTime;
        expect(elapsed).to.be.greaterThan(995);
    });

    it('correctly reports lock status when unlocked', async function () {
        const locked = await mapOne.isLocked(1);
        expect(locked).to.be.false;
    });

    it('correctly reports lock status when locked', async function () {
        await mapOne.lock(1);
        let locked = await mapOne.isLocked(1);
        expect(locked).to.be.true;
        locked = await mapTwo.isLocked(1);
        expect(locked).to.be.true;
    });

    it('force unlocks', async function () {
        await mapOne.lock(1);
        await mapOne.lock(1);
        await mapOne.lock(1);
        await mapOne.unlock(1);
        let locked = await mapOne.isLocked(1);
        expect(locked).to.be.true;
        await mapOne.forceUnlock(1);
        locked = await mapOne.isLocked(1);
        expect(locked).to.be.false;
    });
});
