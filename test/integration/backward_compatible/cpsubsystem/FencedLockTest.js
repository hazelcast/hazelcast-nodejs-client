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
const RC = require('./../../RC');

const {
    Client,
    DistributedObjectDestroyedError,
    IllegalMonitorStateError
} = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('FencedLockTest', function () {

    let cluster;
    let client;
    let lock;

    let anotherLockSeq = 0;
    async function getAnotherLock() {
        return client.getCPSubsystem().getLock('another-lock-' + anotherLockSeq++);
    }

    function expectValidFence(fence) {
        expect(fence.toNumber()).to.be.greaterThan(0);
    }

    function expectValidFenceSequence(fences) {
        let prevFence;
        for (const fence of fences) {
            expectValidFence(fence);
            if (prevFence !== undefined) {
                expect(fence.toNumber() - prevFence.toNumber()).to.be.greaterThan(0);
            }
            prevFence = fence;
        }
    }

    function expectSingleValidFence(fences) {
        let validFence;
        let validCnt = 0;
        for (const fence of fences) {
            if (fence !== undefined && fence.toNumber() > 0) {
                validCnt++;
                validFence = fence;
            }
        }
        expect(validCnt).to.be.equal(1);
        return validFence;
    }

    before(async function () {
        cluster = await RC.createCluster(null, fs.readFileSync(__dirname + '/hazelcast_cpsubsystem.xml', 'utf8'));
        await Promise.all([
            RC.startMember(cluster.id),
            RC.startMember(cluster.id),
            RC.startMember(cluster.id)
        ]);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
        lock = await client.getCPSubsystem().getLock('alock');
    });

    after(async function () {
        await client.shutdown();
        await RC.shutdownCluster(cluster.id);
    });

    it('should create FencedLock with respect to given CP group', async function () {
        const lockInAnotherGroup = await client.getCPSubsystem().getLock('alock@mygroup');

        const fence = await lockInAnotherGroup.lock();
        try {
            const locked = await lock.isLocked();
            expect(locked).to.be.false;
        } finally {
            await lockInAnotherGroup.unlock(fence);
        }
    });

    it('should release locks on client shutdown', async function () {
        const anotherClient = await Client.newHazelcastClient({ clusterName: cluster.id });
        const lockOfAnotherClient = await anotherClient.getCPSubsystem().getLock('alock');

        await lockOfAnotherClient.lock();
        let locked = await lock.isLocked();
        expect(locked).to.be.true;

        await anotherClient.shutdown();

        await TestUtil.promiseWaitMilliseconds(5000);
        locked = await lock.isLocked();
        expect(locked).to.be.false;
    });

    it('destroy: should destroy FencedLock and throw on operation', async function () {
        const anotherLock = await getAnotherLock();
        await anotherLock.destroy();
        // the next destroy call should be ignored
        await anotherLock.destroy();

        await expect(anotherLock.isLocked()).to.be.rejectedWith(DistributedObjectDestroyedError);
    });

    it('isLocked: should return false when not locked', async function () {
        const locked = await lock.isLocked();
        expect(locked).to.be.false;
    });

    it('isLocked: should return true when locked with lock', async function () {
        const fence = await lock.lock();
        try {
            const locked = await lock.isLocked();
            expect(locked).to.be.true;
        } finally {
            await lock.unlock(fence);
        }
    });

    it('isLocked: should return true when locked with tryLock', async function () {
        const fence = await lock.tryLock();
        try {
            const locked = await lock.isLocked();
            expect(locked).to.be.true;
        } finally {
            await lock.unlock(fence);
        }
    });

    it('lock: should return fence when not locked', async function () {
        const fence = await lock.lock();
        try {
            expectValidFence(fence);
        } finally {
            await lock.unlock(fence);
        }
    });

    it('lock: should be non-reentrant', function (done) {
        let unlockedByTimer = false;
        lock.lock()
            .then((fence) => {
                setTimeout(() => {
                    unlockedByTimer = true;
                    // passes only when this unlock happens
                    lock.unlock(fence)
                        .catch(done);
                }, 1000);
                return lock.lock();
            })
            .then((fence) => {
                if (unlockedByTimer) {
                    done();
                }
                return lock.unlock(fence);
            })
            .catch(done);
    });

    it('lock: should succeed for one call in case of concurrent calls', async function () {
        // use separate Lock here as it will remain locked
        const anotherLock = await getAnotherLock();

        let lockCnt = 0;
        const lockPromises = [];
        for (let i = 0; i < 5; i++) {
            lockPromises.push(
                anotherLock.lock()
                    .then((fence) => {
                        expectValidFence(fence);
                        lockCnt++;
                    })
                    .catch(() => {
                        // no-op
                    })
            );
        }
        await Promise.race(lockPromises);

        expect(lockCnt).to.be.equal(1);
    });

    it('tryLock: should return fence when not locked and timeout not specified', async function () {
        const fence = await lock.tryLock();
        try {
            expectValidFence(fence);
        } finally {
            await lock.unlock(fence);
        }
    });

    it('tryLock: should return undefined when locked and timeout not specified', async function () {
        const fence = await lock.lock();
        const invalidFence = await lock.tryLock();
        try {
            expect(invalidFence).to.be.undefined;
        } finally {
            await lock.unlock(fence);
        }
    });

    it('tryLock: should return fence when not locked and timeout specified', async function () {
        const fence = await lock.tryLock(100);
        try {
            expectValidFence(fence);
        } finally {
            await lock.unlock(fence);
        }
    });

    it('tryLock: should return undefined when locked and timeout specified', async function () {
        const fence = await lock.lock();
        const invalidFence = await lock.tryLock(100);
        try {
            expect(invalidFence).to.be.undefined;
        } finally {
            await lock.unlock(fence);
        }
    });

    it('tryLock: should keep retrying until timeout when locked', async function () {
        let fence;
        const start = Date.now();
        try {
            fence = await lock.lock();
            await lock.tryLock(100);
            expect(Date.now() - start).to.be.greaterThan(100);
        } finally {
            await lock.unlock(fence);
        }
    });

    it('tryLock: should succeed for one call in case of concurrent calls', async function () {
        let fence;
        try {
            const tryLockPromises = [];
            for (let i = 0; i < 5; i++) {
                tryLockPromises.push(lock.tryLock());
            }
            const fences = await Promise.all(tryLockPromises);
            fence = expectSingleValidFence(fences);
        } finally {
            await lock.unlock(fence);
        }
    });

    it('unlock: should throw when not locked', async function () {
        const fence = await lock.lock();
        await lock.unlock(fence);

        await expect(lock.unlock(fence)).to.be.rejectedWith(IllegalMonitorStateError);
    });

    it('lock-unlock: should return monotonical fence sequence', async function () {
        const fences = [];
        for (let i = 0; i < 3; i++) {
            const fence = await lock.lock();
            fences.push(fence);
            await lock.unlock(fence);
        }

        expectValidFenceSequence(fences);
    });

    it('tryLock-unlock: should return monotonical fence sequence', async function () {
        const fences = [];
        for (let i = 0; i < 3; i++) {
            const fence = await lock.tryLock();
            fences.push(fence);
            await lock.unlock(fence);
        }

        expectValidFenceSequence(fences);
    });
});
