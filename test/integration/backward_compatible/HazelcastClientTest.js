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
const RC = require('../RC');
const { Client } = require('../../../');
const TestUtil = require('../../TestUtil');

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

[true, false].forEach((isSmart) => {
    describe('HazelcastClientTest[smart=' + isSmart + ']', function () {

        let cluster;
        let client;
        let managed;

        before(async function () {
            cluster = await RC.createCluster(null, null);
            await RC.startMember(cluster.id);
        });

        beforeEach(async function () {
            managed = new ManagedObjects();
            client = await Client.newHazelcastClient({
                network: {
                    smartRouting: isSmart
                },
                clusterName: cluster.id
            });
        });

        afterEach(async function () {
            await managed.destroyAll();
            await client.shutdown();
        });

        after(async function () {
            await RC.terminateCluster(cluster.id);
        });

        it('getDistributedObject returns empty array when there is no distributed object', async function () {
            const distributedObjects = await client.getDistributedObjects();
            expect(distributedObjects).to.be.an('array');
            expect(distributedObjects).to.be.empty;
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
                const distObjects = await client.getDistributedObjects();
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
                const distObjects = await client.getDistributedObjects();
                const names = distObjects.map(o => {
                    return o.getName();
                });
                expect(names).to.have.members(['map2', 'map3']);
            });
        });
    });
});
