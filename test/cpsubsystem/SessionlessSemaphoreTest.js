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

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const fs = require('fs');
const RC = require('./../RC');
const {
    Client,
    DistributedObjectDestroyedError,
} = require('../../');

describe('SessionlessSemaphoreTest', function () {

    this.timeout(30000);

    let cluster;
    let client;
    let semaphore;

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_cpsubsystem.xml', 'utf8'))
        await Promise.all([
            RC.startMember(cluster.id),
            RC.startMember(cluster.id),
            RC.startMember(cluster.id)
        ]);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
        semaphore = await client.getCPSubsystem().getSemaphore('sessionless-semaphore');
    });

    after(async function () {
        await client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    it('should create Semaphore with respect to given CP group', async function () {
        const semaphoreInAnotherGroup = await client.getCPSubsystem().getSemaphore('sessionless-semaphore@mygroup');

        await semaphoreInAnotherGroup.acquire();
        try {
            const permits = await semaphore.availablePermits();
            expect(permits).to.be.equal(1);
        } finally {
            await semaphoreInAnotherGroup.release();
        }
    });

    it('destroy: should destroy Semaphore and throw on operation', async function () {
        const anotherSemaphore = await await client.getCPSubsystem().getSemaphore('another-semaphore');
        await anotherSemaphore.destroy();
        // the next destroy call should be ignored
        await anotherSemaphore.destroy();

        expect(anotherSemaphore.availablePermits()).to.be.rejectedWith(DistributedObjectDestroyedError);
    });

    it('availablePermits: should return available permits count', async function () {
        const permits = await semaphore.availablePermits();
        expect(permits).to.be.equal(1);
    });

    it('availablePermits: should return 0 when no permits are available', async function () {
        await semaphore.acquire();
        try {
            const permits = await semaphore.availablePermits();
            expect(permits).to.be.equal(0);
        } finally {
            await semaphore.release();
        }
    });
});
