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
    var member , member2;

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
        this.timeout(20000);
        var listenerCalledResolverA = DeferredPromise();
        var listenerCalledResolverR = DeferredPromise();

        var membershipListener = {
            memberAdded: function (membershipEvent) {
                console.log('Added Event');
                listenerCalledResolverA.resolve(membershipEvent);
            },
            memberRemoved: function (membershipEvent) {
                console.log('Removed Event');
                listenerCalledResolverR.resolve(membershipEvent);
            }
        };

        client.clusterService.addMembershipListener(membershipListener);

        return Controller.shutdownMember(cluster.id, member.uuid)
            .then(function () {
                return Controller.startMember(cluster.id);
            }).then(function (mem) {
                //mem tut
                return this.member = mem;
            }).then(function () {
                return listenerCalledResolverR.promise;
            }).then(function (membershipEvent) {
                console.log(membershipEvent);
                // expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
                expect(membershipEvent.eventType).to.equal(MemberEvent.REMOVED);
                console.log('removed');
                 // expect(membershipEvent.members).contains(this.member);
                  expect(membershipEvent.members.length).to.equal(1);
            }).then(function () {
                return listenerCalledResolverA.promise;
            }).then(function (membershipEvent) {
                console.log(membershipEvent);
                expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
                console.log('added');
            });
    });


    it('test multi member restart', function () {
        var countA = 0;
        var countR = 0;
        this.timeout(20000);
        var listenerCalledResolverA = DeferredPromise();
        var listenerCalledResolverR = DeferredPromise();
        var membershipListener = {
             memberAdded: function (membershipEvent) {
                 console.log('Added Event');
                 countA++;
                 if(countA === 2)
                 listenerCalledResolverA.resolve(membershipEvent);
             },
             memberRemoved: function (membershipEvent) {
                 console.log('Removed Event');
                 countR++;
                 if(countR === 2)
                 listenerCalledResolverR.resolve(membershipEvent);
             }
         };
        client.clusterService.addMembershipListener(membershipListener);
        return Controller.startMember(cluster.id).then(function () {
            return Controller.shutdownMember(cluster.id, member.uuid);
        }).then(function () {
            return Controller.shutdownMember(cluster.id,member2.uuid);
        }).then(function () {
            return Controller.startMember(cluster.id);
        }).then(function () {
            return Controller.startMember(cluster.id);
        }).then(function () {
            return listenerCalledResolverR.promise;
        }).then(function (membershipEvent) {
            console.log(membershipEvent);
            expect(membershipEvent.eventType).to.equal(membershipEvent.REMOVED);
            console.log('removed for multi member');
        }).then(function () {
            return listenerCalledResolverA.promise;
        }).then(function (membershipEvent) {
            console.log(membershipEvent);
            expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
            console.log('added for multi member');
        });

    });

});
