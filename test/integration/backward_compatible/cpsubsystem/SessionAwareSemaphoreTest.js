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

const RC = require('../../RC');
const {
    Client,
    IllegalStateError
} = require('../../../../');

describe('SessionAwareSemaphoreTest', function () {

    let cluster;
    let client;
    let groupSeq = 0;

    // we use a separate semaphore (and group) per each test to enforce test isolation
    async function getSemaphore(initializeWith) {
        const semaphore = await client.getCPSubsystem().getSemaphore('sessionaware@group' + groupSeq++);
        if (initializeWith) {
            await semaphore.init(initializeWith);
        }
        return semaphore;
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

    it('release: should throw when not acquired', async function () {
        const semaphore = await getSemaphore(3);
        await semaphore.acquire(1);

        await expect(semaphore.release(2)).to.be.rejectedWith(IllegalStateError);
    });

    it('release: should throw when no session created', async function () {
        const semaphore = await getSemaphore(3);

        await expect(semaphore.release()).to.be.rejectedWith(IllegalStateError);
    });

    it('reducePermits: should allow negative permits counter', async function () {
        const semaphore = await getSemaphore(10);

        await semaphore.reducePermits(15);

        const permits = await semaphore.availablePermits();
        expect(permits).to.be.equal(-5);
    });

    it('reducePermits: should allow negative permits counter (JUC)', async function () {
        const semaphore = await getSemaphore(0);

        await semaphore.reducePermits(100);

        const available = await semaphore.availablePermits();
        expect(available).to.be.equal(-100);
        const drained = await semaphore.drainPermits();
        expect(drained).to.be.equal(-100);
    });
});
