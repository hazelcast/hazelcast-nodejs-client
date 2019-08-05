/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var HazelcastClient = require('../.').Client;
var Controller = require('./RC');
var expect = require('chai').expect;
var DeferredPromise = require('../lib/Util').DeferredPromise;
var MemberAttributeOperationType = require('../.').MemberAttributeOperationType;
var MemberEvent = require('../lib/invocation/ClusterService').MemberEvent;
var Config = require('../.').Config;

describe('ClientClusterRestartEventTest', function () {
    var cluster;
    var client;
    var member;

    beforeEach(function () {
        return Controller.createCluster(null, null).then(function (res) {
            cluster = res;
            return Controller.startMember(cluster.id)
        }).then(function (res) {
            member = res;
            return HazelcastClient.newHazelcastClient();
        }).then(function (res) {
            client = res;
        });
    });

    afterEach(function () {
        client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    it('test single member restart', function () {
        let newMember;
        this.timeout(20000);
        var AddedPromise = DeferredPromise();
        var RemovedPromise = DeferredPromise();

        var membershipListener = {
            memberAdded: function (membershipEvent) {
                AddedPromise.resolve(membershipEvent);
            },
            memberRemoved: function (membershipEvent) {
                RemovedPromise.resolve(membershipEvent);
            }
        };

        client.clusterService.addMembershipListener(membershipListener);
        return Controller.shutdownMember(cluster.id, member.uuid)
            .then(function () {
                return Controller.startMember(cluster.id);
            }).then(function (m) {
                newMember = m;
                return RemovedPromise.promise;
            }).then(function (membershipEvent) {
                console.log(membershipEvent);
                expect(membershipEvent.eventType).to.equal(MemberEvent.REMOVED);
                expect(membershipEvent.member.uuid).to.equal(member.uuid);
            }).then(function () {
                return AddedPromise.promise;
            }).then(function (membershipEvent) {
                console.log(membershipEvent);
                expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
                expect(membershipEvent.member.uuid).to.equal(newMember.uuid);
                const members = Array.from(client.clusterService.getMembers()).map(function (m) {
                    return m.uuid;
                });
                expect(members).to.includes(newMember.uuid);
                expect(members.length).to.equal(1);
            });
    });

    it('test multi member restart', function () {
        let newMember1, newMember2;
        var AddedCount = 0;
        var RemovedCount = 0;
        this.timeout(32000);
        var AddedPromise = DeferredPromise();
        var RemovedPromise = DeferredPromise();

        var added = [];
        var removed = [];

        var membershipListener = {
            memberAdded: function (membershipEvent) {
                AddedCount++;
                added.push(membershipEvent.member);
                if (AddedCount === 2)
                    AddedPromise.resolve();
            },
            memberRemoved: function (membershipEvent) {
                removed.push(membershipEvent.member);
                RemovedCount++;
                if (RemovedCount === 2)
                    RemovedPromise.resolve();
            }
        };

        var member2;
        return Controller.startMember(cluster.id).then(function (m) {
            member2 = m;
            client.clusterService.addMembershipListener(membershipListener);
            return Controller.shutdownMember(cluster.id, member.uuid);
        }).then(function () {
            return Controller.shutdownMember(cluster.id, member2.uuid);
        }).then(function () {
            return Controller.startMember(cluster.id);
        }).then(function (m) {
            newMember1 = m;
            return Controller.startMember(cluster.id);
        }).then(function (m) {
            newMember2 = m;
            return RemovedPromise.promise;
        }).then(function () {
            expect(removed[0].uuid).to.equal(member.uuid);
            expect(removed[1].uuid).to.equal(member2.uuid);
        }).then(function () {
            return AddedPromise.promise;
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
