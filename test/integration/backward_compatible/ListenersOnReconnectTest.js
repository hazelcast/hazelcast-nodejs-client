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
const { deferredPromise } = require('../../../lib/util/Util');

describe('ListenersOnReconnectTest', function () {

    let client;
    let cluster;
    let map;

    beforeEach(async function () {
        cluster = await RC.createCluster(null, null);
    });

    afterEach(async function () {
        await map.destroy();
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    async function closeTwoMembersOutOfThreeAndTestListener(isSmart, membersToClose, turnoffMember) {
        const deferred = deferredPromise();

        const members = await Promise.all([
            RC.startMember(cluster.id),
            RC.startMember(cluster.id),
            RC.startMember(cluster.id)
        ]);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                smartRouting: isSmart
            }
        });
        map = await client.getMap('testmap');

        const listener = {
            added: (entryEvent) => {
                try {
                    expect(entryEvent.name).to.equal('testmap');
                    expect(entryEvent.key).to.equal('keyx');
                    expect(entryEvent.value).to.equal('valx');
                    expect(entryEvent.oldValue).to.be.equal(null);
                    expect(entryEvent.mergingValue).to.be.equal(null);
                    expect(entryEvent.member).to.not.be.equal(null);
                    deferred.resolve();
                } catch (err) {
                    deferred.reject(err);
                }
            }
        };
        const registrationId = await map.addEntryListener(listener, 'keyx', true);
        await Promise.all([
            turnoffMember(cluster.id, members[membersToClose[0]].uuid),
            turnoffMember(cluster.id, members[membersToClose[1]].uuid)
        ]);

        // Assert that connections are closed and the listener is reregistered.
        await TestUtil.assertTrueEventually(async () => {
            const activeConnections = TestUtil.getConnections(client);
            expect(activeConnections.length).to.be.equal(1);

            const activeRegistrations = TestUtil.getActiveRegistrations(client, registrationId);
            const connectionsThatHasListener = [...activeRegistrations.keys()];
            expect(connectionsThatHasListener.length).to.be.equal(1);
            expect(connectionsThatHasListener[0]).to.be.equal(activeConnections[0]);
        });

        await map.put('keyx', 'valx');
        await deferred;
    }

    [true, false].forEach((isSmart) => {

        /**
         * We use three members to simulate all configurations where connection is closed to;
         *  - ownerconnection
         *  - connection that has the local listener that will react to map.put event
         *  - the other unrelated connection
         */

        it('kill two members [1,2], listener still receives map.put event [smart=' + isSmart + ']', async function () {
            await closeTwoMembersOutOfThreeAndTestListener(isSmart, [1, 2], RC.terminateMember);
        });

        it('kill two members [0,1], listener still receives map.put event [smart=' + isSmart + ']', async function () {
            await closeTwoMembersOutOfThreeAndTestListener(isSmart, [0, 1], RC.terminateMember);
        });

        it('kill two members [0,2], listener still receives map.put event [smart=' + isSmart + ']', async function () {
            await closeTwoMembersOutOfThreeAndTestListener(isSmart, [0, 2], RC.terminateMember);
        });

        it('shutdown two members [1,2], listener still receives map.put event [smart=' + isSmart + ']', async function () {
            await closeTwoMembersOutOfThreeAndTestListener(isSmart, [1, 2], RC.shutdownMember);
        });

        it('shutdown two members [0,1], listener still receives map.put event [smart=' + isSmart + ']', async function () {
            await closeTwoMembersOutOfThreeAndTestListener(isSmart, [0, 1], RC.shutdownMember);
        });

        it('shutdown two members [0,2], listener still receives map.put event [smart=' + isSmart + ']', async function () {
            await closeTwoMembersOutOfThreeAndTestListener(isSmart, [0, 2], RC.shutdownMember);
        });

        it('restart member, listener still receives map.put event [smart=' + isSmart + ']', async function () {
            const deferred = deferredPromise();
            const member = await RC.startMember(cluster.id);
            client = await Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    smartRouting: isSmart
                },
                properties: {
                    'hazelcast.client.heartbeat.interval': 1000
                }
            });
            map = await client.getMap('testmap');

            const listener = {
                added: (entryEvent) => {
                    try {
                        expect(entryEvent.name).to.equal('testmap');
                        expect(entryEvent.key).to.equal('keyx');
                        expect(entryEvent.value).to.equal('valx');
                        expect(entryEvent.oldValue).to.be.equal(null);
                        expect(entryEvent.mergingValue).to.be.equal(null);
                        expect(entryEvent.member).to.not.be.equal(null);
                        deferred.resolve();
                    } catch (err) {
                        deferred.reject(err);
                    }
                }
            };
            await map.addEntryListener(listener, 'keyx', true);

            await RC.terminateMember(cluster.id, member.uuid);
            await RC.startMember(cluster.id);

            await TestUtil.promiseWaitMilliseconds(8000);
            await map.put('keyx', 'valx');
            await deferred.promise;
        });
    });
});
