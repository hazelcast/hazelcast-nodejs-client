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
const { deferredPromise } = require('../../../../lib/util/Util');

describe('ListenersOnReconnectTest', function () {
    let client;
    let cluster;
    let map;

    const testFactory = new TestUtil.TestFactory();

    beforeEach(async function () {
        cluster = await testFactory.createClusterForSerialTests();
    });

    afterEach(async function () {
        await testFactory.shutdownAll();
    });

    [true, false].forEach((isSmart) => {
        // This test needs to run serially since it restarts a member.
        it('restart member, listener still receives map.put event [smart=' + isSmart + ']', async function () {
            const deferred = deferredPromise();

            const member = await RC.startMember(cluster.id);
            client = await testFactory.newHazelcastClientForSerialTests({
                clusterName: cluster.id,
                network: {
                    smartRouting: isSmart,
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

            await RC.terminateMember(cluster.id, member.uuid);
            // Assert that the connection is closed and the listener is removed.
            await TestUtil.assertTrueEventually(async () => {
                const activeConnections = TestUtil.getConnections(client);
                expect(activeConnections.length).to.be.equal(0);

                const activeRegistrations = TestUtil.getActiveRegistrations(client, registrationId);
                const connectionsThatHasListener = [...activeRegistrations.keys()];
                expect(connectionsThatHasListener.length).to.be.equal(0);
            });
            await RC.startMember(cluster.id);

            // Assert that the connection reestablished and the listener is reregistered.
            await TestUtil.assertTrueEventually(async () => {
                const activeConnections = TestUtil.getConnections(client);
                expect(activeConnections.length).to.be.equal(1);

                const activeRegistrations = TestUtil.getActiveRegistrations(client, registrationId);
                const connectionsThatHasListener = [...activeRegistrations.keys()];
                expect(connectionsThatHasListener.length).to.be.equal(1);
                expect(connectionsThatHasListener[0]).to.be.equal(activeConnections[0]);
            });
            await map.put('keyx', 'valx');
            await deferred.promise;
        });
    });
});
