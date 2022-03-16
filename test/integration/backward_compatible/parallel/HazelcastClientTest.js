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
const TestUtil = require('../../../TestUtil');

class ManagedObjects {
    constructor() {
        this.managedObjects = [];
    }

    addObject(obj) {
        this.managedObjects.push(obj);
    }

    async destroyAll() {
        const promises = [];
        this.managedObjects.forEach((obj) => {
            promises.push(obj.destroy());
        });
        return Promise.all(promises);
    }

    async destroy(name) {
        for (const el of this.managedObjects) {
            if (el.getName() === name) {
                await el.destroy();
            }
        }
    }
}

const testFactory = new TestUtil.TestFactory();

[true, false].forEach((isSmart) => {
    describe('HazelcastClientTest[smart=' + isSmart + ']', function () {
        let cluster;
        let client;
        let managed;
        let member;

        const filterInternalMaps = (distributedObjects) => {
            return distributedObjects.filter(distObj => !distObj.getName().startsWith('__'));
        };

        before(async function () {
            cluster = await testFactory.createClusterForParallelTests();
            member = await RC.startMember(cluster.id);
        });

        beforeEach(async function () {
            managed = new ManagedObjects();
            client = await testFactory.newHazelcastClientForParallelTests({
                network: {
                    smartRouting: isSmart
                },
                clusterName: cluster.id
            }, member);
        });

        afterEach(async function () {
            await managed.destroyAll();
            await client.shutdown();
        });

        after(async function () {
            await testFactory.shutdownAll();
        });

        it('getDistributedObject returns empty array when there is no distributed object', async function () {
            const distributedObjects = filterInternalMaps(await client.getDistributedObjects());
            expect(distributedObjects).to.be.an('array');
            expect(distributedObjects).to.be.empty;
        });

        it('more than one call to shutdown returns same promise', function () {
            TestUtil.markClientVersionAtLeast(this, '5.0');
            const promise1 = client.shutdown();
            const promise2 = client.shutdown();
            expect(promise1).to.be.eq(promise2);
        });

        it('getLocalEndpoint returns correct info', function () {
            const info = client.getLocalEndpoint();
            const localAddress = TestUtil.getRandomConnection(client).localAddress;
            expect(info.localAddress.host).to.equal(localAddress.host);
            expect(info.localAddress.port).to.equal(localAddress.port);
            expect(info.uuid).to.deep.equal(client.getConnectionManager().getClientUuid());
            expect(info.type).to.equal('NodeJS');
            expect(info.labels).to.deep.equal(new Set());
        });

        it('getDistributedObjects returns all dist objects', async function () {
            managed.addObject(await client.getMap('map'));
            managed.addObject(await client.getSet('set'));

            await TestUtil.assertTrueEventually(async () => {
                const distObjects = filterInternalMaps(await client.getDistributedObjects());
                const names = distObjects.map((o) => {
                    return o.getName();
                });
                expect(names).to.have.members(['map', 'set']);
            });
        });

        it('getDistributedObjects does not return removed object', async function () {
            managed.addObject(await client.getMap('map1'));
            managed.addObject(await client.getMap('map2'));
            managed.addObject(await client.getMap('map3'));

            await TestUtil.assertTrueEventually(async () => {
                await managed.destroy('map1');
                const distObjects = filterInternalMaps(await client.getDistributedObjects());
                const names = distObjects.map(o => {
                    return o.getName();
                });
                expect(names).to.have.members(['map2', 'map3']);
            });
        });
    });
});
