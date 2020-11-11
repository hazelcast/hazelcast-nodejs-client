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
const Client = require('../.').Client;
const RC = require('./RC');
const DeferredPromise = require('../lib/Util').DeferredPromise;
const MemberEvent = require('../lib/invocation/ClusterService').MemberEvent;

describe('ClientClusterRestartEventTest', function () {

    this.timeout(40000);

    let cluster;
    let client;
    let member;

    beforeEach(function () {
        return RC.createCluster(null, null).then(function (c) {
            cluster = c;
            return RC.startMember(cluster.id)
        }).then(function (m) {
            member = m;
            return Client.newHazelcastClient();
        }).then(function (c) {
            client = c;
        });
    });

    afterEach(function () {
        client.shutdown();
        return RC.shutdownCluster(cluster.id);
    });

    it('should receive membership events when single member restarted', function () {
        let newMember;
        const addedPromise = DeferredPromise();
        const removedPromise = DeferredPromise();

        client.clusterService.addMembershipListener({
            memberAdded: addedPromise.resolve,
            memberRemoved: removedPromise.resolve
        });

        return RC.shutdownMember(cluster.id, member.uuid)
            .then(function () {
                return RC.startMember(cluster.id);
            }).then(function (m) {
                newMember = m;
                return removedPromise.promise;
            }).then(function (membershipEvent) {
                expect(membershipEvent.eventType).to.equal(MemberEvent.REMOVED);
                expect(membershipEvent.member.uuid).to.equal(member.uuid);
            }).then(function () {
                return addedPromise.promise;
            }).then(function (membershipEvent) {
                expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
                expect(membershipEvent.member.uuid).to.equal(newMember.uuid);
                const members = Array.from(client.clusterService.getMembers()).map(function (m) {
                    return m.uuid;
                });
                expect(members).to.includes(newMember.uuid);
                expect(members.length).to.equal(1);
            });
    });

    it('should receive membership events when multiple member restarted', function () {
        let addedCount = 0;
        let removedCount = 0;
        const addedPromise = DeferredPromise();
        const removedPromise = DeferredPromise();

        const added = [];
        const removed = [];

        const membershipListener = {
            memberAdded: function (membershipEvent) {
                addedCount++;
                added.push(membershipEvent.member);
                if (addedCount === 2) {
                    addedPromise.resolve();
                }
            },
            memberRemoved: function (membershipEvent) {
                removed.push(membershipEvent.member);
                removedCount++;
                if (removedCount === 2) {
                    removedPromise.resolve();
                }
            }
        };

        let newMember1;
        let newMember2;
        let member2;
        return RC.startMember(cluster.id).then(function (m) {
            member2 = m;
            client.clusterService.addMembershipListener(membershipListener);
            return RC.shutdownMember(cluster.id, member.uuid);
        }).then(function () {
            return RC.shutdownMember(cluster.id, member2.uuid);
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function (m) {
            newMember1 = m;
            return RC.startMember(cluster.id);
        }).then(function (m) {
            newMember2 = m;
            return removedPromise.promise;
        }).then(function () {
            expect(removed[0].uuid).to.equal(member.uuid);
            expect(removed[1].uuid).to.equal(member2.uuid);
        }).then(function () {
            return addedPromise.promise;
        }).then(function () {
            expect(added[0].uuid).to.equal(newMember1.uuid);
            expect(added[1].uuid).to.equal(newMember2.uuid);
            const members = Array.from(client.clusterService.getMembers()).map(function (m) {
                return m.uuid;
            });
            expect(members).to.includes(newMember1.uuid);
            expect(members).to.includes(newMember2.uuid);
            expect(members.length).to.equal(2);
        });
    });
});
