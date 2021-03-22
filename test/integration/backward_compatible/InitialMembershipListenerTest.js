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
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const RC = require('../RC');
const { Client } = require('../../../');
const { deferredPromise } = require('../../../lib/util/Util');

describe('InitialMembershipListenerTest', function () {

    let cluster;
    let initialMember;
    let client;

    beforeEach(async function () {
        cluster = await RC.createCluster(null, null);
        initialMember = await RC.startMember(cluster.id);
    });

    afterEach(async function () {
        await client.shutdown();
        await RC.terminateCluster(cluster.id);
    });

    it('should receive available member when added before client start', async function () {
        const initTriggered = deferredPromise();
        const config = {
            clusterName: cluster.id,
            membershipListeners: [
                {
                    init: (event) => {
                        try {
                            const members = event.members;
                            expect(members).to.have.lengthOf(1);
                            const member = members[0];
                            expect(member.address.host).to.equal(initialMember.host);
                            expect(member.address.port).to.equal(initialMember.port);
                            initTriggered.resolve();
                        } catch (err) {
                            initTriggered.reject(err);
                        }
                    }
                }
            ]
        };

        client = await Client.newHazelcastClient(config);

        await initTriggered.promise;
    });

    it('should receive available member when added after client start', async function () {
        const initTriggered = deferredPromise();
        const membershipListener = {
            init: (event) => {
                try {
                    const members = event.members;
                    expect(members).to.have.lengthOf(1);
                    const member = members[0];
                    expect(member.address.host).to.equal(initialMember.host);
                    expect(member.address.port).to.equal(initialMember.port);
                    initTriggered.resolve();
                } catch (err) {
                    initTriggered.reject(err);
                }
            }
        };

        client = await Client.newHazelcastClient({ clusterName: cluster.id });
        client.getCluster().addMembershipListener(membershipListener);

        await initTriggered.promise;
    });

    it('should receive events after initial event', async function () {
        const newMemberStarted = deferredPromise();
        const memberAddedTriggered = deferredPromise();

        const membershipListener = {
            init: (event) => {
                const members = event.members;
                expect(members).to.have.lengthOf(1);
                const member = members[0];
                expect(member.address.host).to.equal(initialMember.host);
                expect(member.address.port).to.equal(initialMember.port);
            },
            memberAdded: (event) => {
                newMemberStarted.promise
                    .then(() => {
                        try {
                            const member = event.member;
                            expect(member.address.host).to.equal(newMember.host);
                            expect(member.address.port).to.equal(newMember.port);
                            memberAddedTriggered.resolve();
                        } catch (err) {
                            memberAddedTriggered.reject(err);
                        }
                    });
            }
        };
        const config = {
            clusterName: cluster.id,
            membershipListeners: [membershipListener]
        };

        client = await Client.newHazelcastClient(config);
        const newMember = await RC.startMember(cluster.id);
        newMemberStarted.resolve();

        await memberAddedTriggered.promise;
    });
});
