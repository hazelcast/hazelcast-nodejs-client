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
const { Client, MemberEvent } = require('../../../');
const { deferredPromise } = require('../../../lib/util/Util');

describe('MembershipListenerTest', function () {

    let cluster;
    let client;

    beforeEach(async function () {
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id
        });
    });

    afterEach(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('sees member added event', async function () {
        const listenerCalledResolver = deferredPromise();

        const membershipListener = {
            memberAdded: (membershipEvent) => {
                listenerCalledResolver.resolve(membershipEvent);
            }
        };
        client.getCluster().addMembershipListener(membershipListener);

        const newMember = await RC.startMember(cluster.id);
        const membershipEvent = await listenerCalledResolver.promise;

        expect(membershipEvent.member.address.host).to.equal(newMember.host);
        expect(membershipEvent.member.address.port).to.equal(newMember.port);
        expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
        expect(membershipEvent.members).to.deep.equal(client.getCluster().getMembers());
    });

    it('sees member added event and other listener\'s event ', async function () {
        const listenerCalledResolver = deferredPromise();
        let listenedSecondListener = false;

        const membershipListener = {
            memberAdded: (membershipEvent) => {
                listenerCalledResolver.resolve(membershipEvent);
            }
        };
        const membershipListener2 = {
            memberAdded: () => {
                listenedSecondListener = true;
            }
        };
        client.getCluster().addMembershipListener(membershipListener);
        client.getCluster().addMembershipListener(membershipListener2);

        const newMember = await RC.startMember(cluster.id);
        const membershipEvent = await listenerCalledResolver.promise;

        expect(membershipEvent.member.address.host).to.equal(newMember.host);
        expect(membershipEvent.member.address.port).to.equal(newMember.port);
        expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
        expect(membershipEvent.members).to.deep.equal(client.getCluster().getMembers());
        expect(listenedSecondListener).to.be.true;
    });

    it('if same listener is added twice, gets same event twice', async function () {
        let counter = 0;

        const membershipListener = {
            memberAdded: () => {
                counter++;
            }
        };
        client.getCluster().addMembershipListener(membershipListener);
        client.getCluster().addMembershipListener(membershipListener);

        await RC.startMember(cluster.id);
        expect(counter).to.equal(2);
    });

    it('sees member removed event', async function () {
        const listenerCalledResolver = deferredPromise();

        const membershipListener = {
            memberRemoved: (membershipEvent) => {
                listenerCalledResolver.resolve(membershipEvent);
            }
        };
        client.getCluster().addMembershipListener(membershipListener);

        const newMember = await RC.startMember(cluster.id);
        await RC.shutdownMember(cluster.id, newMember.uuid);
        const membershipEvent = await listenerCalledResolver.promise;

        expect(membershipEvent.member.address.host).to.equal(newMember.host);
        expect(membershipEvent.member.address.port).to.equal(newMember.port);
        expect(membershipEvent.eventType).to.equal(MemberEvent.REMOVED);
        expect(membershipEvent.members).to.deep.equal(client.getCluster().getMembers());
    });
});
