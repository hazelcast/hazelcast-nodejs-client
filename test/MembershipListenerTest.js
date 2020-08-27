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
const RC = require('./RC');
const Client = require('../.').Client;
const { DeferredPromise } = require('../lib/util/Util');
const { MemberEvent } = require('../lib/core');

describe('MembershipListenerTest', function () {

    this.timeout(20000);
    let cluster, client;

    beforeEach(function () {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
            return RC.startMember(cluster.id)
        }).then(function (res) {
            return Client.newHazelcastClient({
                clusterName: cluster.id
            });
        }).then(function (res) {
            client = res;
        });
    });

    afterEach(function () {
        return client.shutdown()
            .then(() => RC.terminateCluster(cluster.id));
    });

    it('sees member added event', function () {
        let newMember;
        const listenerCalledResolver = DeferredPromise();

        const membershipListener = {
            memberAdded: (membershipEvent) => {
                listenerCalledResolver.resolve(membershipEvent);
            }
        };
        client.clusterService.addMembershipListener(membershipListener);

        return RC.startMember(cluster.id).then(function (res) {
            newMember = res;
            return listenerCalledResolver.promise;
        }).then(function (membershipEvent) {
            expect(membershipEvent.member.address.host).to.equal(newMember.host);
            expect(membershipEvent.member.address.port).to.equal(newMember.port);
            expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
            expect(membershipEvent.members).to.deep.equal(client.clusterService.getMemberList());
        });
    });

    it('sees member added event and other listener\'s event ', function () {
        let newMember;
        const listenerCalledResolver = DeferredPromise();
        let listenedSecondListener = false;

        const membershipListener = {
            memberAdded: (membershipEvent) => {
                listenerCalledResolver.resolve(membershipEvent);
            }
        };
        const membershipListener2 = {
            memberAdded: (membershipEvent) => {
                listenedSecondListener = true;
            }
        };
        client.clusterService.addMembershipListener(membershipListener);
        client.clusterService.addMembershipListener(membershipListener2);

        return RC.startMember(cluster.id).then(function (res) {
            newMember = res;
            return listenerCalledResolver.promise;
        }).then(function (membershipEvent) {
            expect(membershipEvent.member.address.host).to.equal(newMember.host);
            expect(membershipEvent.member.address.port).to.equal(newMember.port);
            expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
            expect(membershipEvent.members).to.deep.equal(client.clusterService.getMemberList());
            expect(listenedSecondListener).to.be.true;
        });

    });

    it('if same listener is added twice, gets same event twice', function () {
        let counter = 0;

        const membershipListener = {
            memberAdded: (membershipEvent) => {
                counter++;
            }
        };
        client.clusterService.addMembershipListener(membershipListener);
        client.clusterService.addMembershipListener(membershipListener);

        return RC.startMember(cluster.id).then(function (m) {
            expect(counter).to.equal(2);
        });
    });

    it('sees member removed event', function () {
        let newMember;
        const listenerCalledResolver = DeferredPromise();

        const membershipListener = {
            memberRemoved: (membershipEvent) => {
                listenerCalledResolver.resolve(membershipEvent);
            }
        };
        client.clusterService.addMembershipListener(membershipListener);

        return RC.startMember(cluster.id).then(function (res) {
            newMember = res;
            return RC.shutdownMember(cluster.id, newMember.uuid);
        }).then(function () {
            return listenerCalledResolver.promise;
        }).then(function (membershipEvent) {
            expect(membershipEvent.member.address.host).to.equal(newMember.host);
            expect(membershipEvent.member.address.port).to.equal(newMember.port);
            expect(membershipEvent.eventType).to.equal(MemberEvent.REMOVED);
            expect(membershipEvent.members).to.deep.equal(client.clusterService.getMemberList());
        });
    });
});
