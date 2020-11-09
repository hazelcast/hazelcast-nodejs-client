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

const expect = require('chai').expect;
const HazelcastClient = require('../../lib/index.js').Client;
const Config = require('../../lib/index.js').Config;
const Controller = require('./../RC');
const Util = require('./../Util');
const Promise = require('bluebird');

describe('LockProxyTest', function () {

    const INVOCATION_TIMEOUT_FOR_TWO = 1000;

    let cluster;
    let clientOne;
    let clientTwo;

    let lockOne;
    let lockTwo;

    function warmupPartitions(client) {
        const partitionService = client.getPartitionService();
        return partitionService.refresh();
    }

    function generateKeyOwnedBy(client, member) {
        const partitionService = client.getPartitionService();
        while (true) {
            const id = '' + Util.getRandomInt(0, 1000);
            const partition = partitionService.getPartitionId(id);
            const address = partitionService.getAddressForPartition(partition);
            if (address.host === member.host && address.port === member.port) {
                return id;
            }
        }
    }

    before(function () {
        this.timeout(10000);
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return Promise.all([
                HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                    clientOne = hazelcastClient;
                }),
                HazelcastClient.newHazelcastClient().then(function (hazelcastClient) {
                    clientTwo = hazelcastClient;
                })
            ]);
        });
    });

    beforeEach(function () {
        return clientOne.getLock('test').then(function (lock) {
            lockOne = lock;
            return clientTwo.getLock('test');
        }).then(function (lock) {
            lockTwo = lock;
        });
    });

    afterEach(function () {
        return Promise.all([lockOne.destroy(), lockTwo.destroy()]);
    });

    after(function () {
        clientOne.shutdown();
        clientTwo.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('locks and unlocks', function () {
        this.timeout(10000);
        const startTime = Date.now();
        return lockOne.lock().then(function () {
            setTimeout(function () {
                lockOne.unlock();
            }, 1000);
            return lockTwo.lock()
        }).then(function () {
            const elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
        });
    });

    it('unlocks after lease expired', function () {
        this.timeout(10000);
        const startTime = Date.now();
        return lockOne.lock(1000).then(function () {
            return lockTwo.lock();
        }).then(function () {
            const elapsed = Date.now() - startTime;
            expect(elapsed).to.be.greaterThan(1000);
        });
    });

    it('gives up attempt to lock after timeout is exceeded', function () {
        this.timeout(10000);
        return lockOne.lock().then(function () {
            return lockTwo.tryLock(1000);
        }).then(function (acquired) {
            expect(acquired).to.be.false;
        });
    });

    it('acquires lock before timeout is exceeded', function () {
        this.timeout(10000);
        const startTime = Date.now();
        return lockOne.lock(1000).then(function () {
            return lockTwo.tryLock(2000);
        }).then(function (acquired) {
            const elasped = Date.now() - startTime;
            expect(acquired).to.be.true;
            expect(elasped).to.be.greaterThan(995);
        })
    });

    it('acquires the lock before timeout and unlocks after lease expired', function () {
        this.timeout(10000);
        const startTime = Date.now();
        return lockOne.lock(1000).then(function () {
            return lockTwo.tryLock(2000, 1000);
        }).then(function () {
            const elapsed = Date.now() - startTime;
            expect(elapsed).to.be.at.least(1000);
            return lockOne.lock(2000);
        }).then(function () {
            const elapsed = Date.now() - startTime;
            expect(elapsed).to.be.at.least(1000);
        });
    });

    it('acquires the lock when key owner terminates', function (done) {
        this.timeout(30000);
        let client;
        let keyOwner;
        let key;
        let alienLock;

        const cfg = new Config.ClientConfig();
        cfg.properties['hazelcast.client.invocation.timeout.millis'] = INVOCATION_TIMEOUT_FOR_TWO;
        HazelcastClient.newHazelcastClient(cfg).then(function (c) {
            client = c;
            return Controller.startMember(cluster.id)
        }).then(function (m) {
            keyOwner = m;
            return warmupPartitions(client);
        }).then(function () {
            key = generateKeyOwnedBy(client, keyOwner);
            return clientOne.getLock(key);
        }).then(function (lock) {
            alienLock = lock;
            return alienLock.lock();
        }).then(function () {
            return client.getLock(key);
        }).then(function (lock) {
            // try to lock concurrently
            lock.lock()
                .then(function () {
                    return lock.unlock();
                })
                .then(done)
                .catch(done)
                .finally(function () {
                    client.shutdown();
                });
            return Util.promiseWaitMilliseconds(2 * INVOCATION_TIMEOUT_FOR_TWO);
        }).then(function () {
            return alienLock.isLocked();
        }).then(function (locked) {
            expect(locked).to.be.true;
            return Controller.terminateMember(cluster.id, keyOwner.uuid);
        }).then(function () {
            return alienLock.unlock();
        }).catch(done);
    });

    it('correctly reports lock status when unlocked', function () {
        return lockOne.isLocked().then(function (locked) {
            expect(locked).to.be.false;
        });
    });

    it('correctly reports lock status when locked', function () {
        return lockOne.lock().then(function () {
            return lockOne.isLocked();
        }).then(function (locked) {
            expect(locked).to.be.true;
            return lockTwo.isLocked();
        }).then(function (locked) {
            expect(locked).to.be.true;
        });
    });

    it('correctly reports remaining lease time', function () {
        return lockOne.lock(1000).then(function () {
            return Util.promiseWaitMilliseconds(30)
        }).then(function (remaining) {
            return lockOne.getRemainingLeaseTime();
        }).then(function (remaining) {
            expect(remaining).to.be.lessThan(971);
        })
    });

    it('correctly reports that lock is being held by a specific client', function () {
        return lockOne.lock().then(function () {
            return lockOne.isLockedByThisClient();
        }).then(function (locked) {
            expect(locked).to.be.true;
            return lockTwo.isLockedByThisClient();
        }).then(function (locked) {
            expect(locked).to.be.false;
        });
    });

    it('correctly reports lock acquire count', function () {
        return lockOne.lock().then(function () {
            return lockOne.getLockCount();
        }).then(function (count) {
            expect(count).to.equal(1);
            return lockOne.lock();
        }).then(function () {
            return lockOne.getLockCount();
        }).then(function (count) {
            expect(count).to.equal(2);
        });
    });

    it('force unlocks', function () {
        return lockOne.lock().then(function () {
            return lockOne.lock();
        }).then(function () {
            return lockOne.lock();
        }).then(function () {
            return lockOne.unlock()
        }).then(function () {
            return lockOne.isLocked();
        }).then(function (locked) {
            expect(locked).to.be.true;
            return lockOne.forceUnlock();
        }).then(function () {
            return lockOne.isLocked();
        }).then(function (locked) {
            expect(locked).to.be.false;
        });
    });
});
