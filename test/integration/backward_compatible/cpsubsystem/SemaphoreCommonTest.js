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
    DistributedObjectDestroyedError
} = require('../../../../');

describe('SemaphoreCommonTest', function () {

    let cluster;
    let client;
    const testTypes = ['sessionless', 'sessionaware'];
    let groupSeq = 0;

    // we use a separate semaphore (and group) per each test to enforce test isolation
    async function getSemaphore(type, initializeWith) {
        const semaphore = await client.getCPSubsystem().getSemaphore(type + '@group' + groupSeq++);
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

    it('should create Semaphore with respect to given CP group', async function () {
        const semaphoreOne = await getSemaphore('sessionless', 1);
        const semaphoreTwo = await client.getCPSubsystem().getSemaphore('sessionless');

        await semaphoreOne.acquire();

        const permits = await semaphoreTwo.availablePermits();
        expect(permits).to.be.equal(0);
    });

    it('destroy: should destroy Semaphore and throw on operation', async function () {
        const semaphore = await getSemaphore('sessionless');
        await semaphore.destroy();
        // the next destroy call should be ignored
        await semaphore.destroy();

        await expect(semaphore.availablePermits()).to.be.rejectedWith(DistributedObjectDestroyedError);
    });

    for (const type of testTypes) {
        describe(`[${type}]`, function () {

            it('availablePermits: should return available permits count', async function () {
                const semaphore = await getSemaphore(type, 3);
                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(3);
            });

            it('availablePermits: should return 0 when no permits are available', async function () {
                const semaphore = await getSemaphore(type, 1);
                await semaphore.acquire();

                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(0);
            });

            it('init: should change permits for non-initialized semaphore', async function () {
                const semaphore = await getSemaphore(type);
                const result = await semaphore.init(7);
                expect(result).to.be.true;
                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(7);
            });

            it('init: should not change permits for initialized semaphore', async function () {
                const semaphore = await getSemaphore(type, 1);
                const result = await semaphore.init(7);
                expect(result).to.be.false;
                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(1);
            });

            it('acquire: should succeed when permits are available', async function () {
                const semaphore = await getSemaphore(type, 42);
                await semaphore.acquire(2);

                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(40);
            });

            it('acquire: should wait when no permits are available', function (done) {
                let semaphore;
                let releasedByTimer = false;
                getSemaphore(type, 1)
                    .then((s) => {
                        semaphore = s;
                        return semaphore.acquire();
                    })
                    .then(() => {
                        setTimeout(() => {
                            releasedByTimer = true;
                            // passes only when this release happens
                            semaphore.release()
                                .catch(done);
                        }, 1000);
                        return semaphore.acquire();
                    })
                    .then(() => {
                        if (releasedByTimer) {
                            done();
                        }
                        return semaphore.release();
                    })
                    .catch(done);
            });

            it('tryAcquire: should acquire one permit by default when permits are available', async function () {
                const semaphore = await getSemaphore(type, 5);

                const result = await semaphore.tryAcquire();
                expect(result).to.be.true;

                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(4);
            });

            it('tryAcquire: should acquire given number of permits when permits are available', async function () {
                const semaphore = await getSemaphore(type, 5);

                const result = await semaphore.tryAcquire(2);
                expect(result).to.be.true;

                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(3);
            });

            it('tryAcquire: should fail when permits are not available', async function () {
                const semaphore = await getSemaphore(type, 1);

                const result = await semaphore.tryAcquire(2);
                expect(result).to.be.false;

                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(1);
            });

            it('tryAcquire: should keep retrying until timeout when permits are not available', async function () {
                const semaphore = await getSemaphore(type, 1);

                const start = Date.now();
                const result = await semaphore.tryAcquire(2, 100);
                expect(result).to.be.false;
                expect(Date.now() - start).to.be.greaterThan(100);
            });

            it('release: should succeed when permits are acquired', async function () {
                const semaphore = await getSemaphore(type, 2);
                await semaphore.acquire(2);
                await semaphore.release(2);

                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(2);
            });

            it('reducePermits: should reduce available permits', async function () {
                const semaphore = await getSemaphore(type, 10);

                await semaphore.reducePermits(5);

                const permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(5);
            });

            it('increasePermits: should increase available permits', async function () {
                const semaphore = await getSemaphore(type, 10);

                let permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(10);

                await semaphore.increasePermits(100);

                permits = await semaphore.availablePermits();
                expect(permits).to.be.equal(110);
            });

            it('drainPermits: should drain all available permits', async function () {
                const semaphore = await getSemaphore(type, 20);

                await semaphore.acquire(5);

                const drained = await semaphore.drainPermits();
                expect(drained).to.be.equal(15);
                const available = await semaphore.availablePermits();
                expect(available).to.be.equal(0);
            });

            it('drainPermits: should return 0 when permits are not available', async function () {
                const semaphore = await getSemaphore(type, 0);

                const drained = await semaphore.drainPermits();
                expect(drained).to.be.equal(0);
            });
        });
    }
});
