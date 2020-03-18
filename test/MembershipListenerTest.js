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

var HazelcastClient = require('../.').Client;
var Controller = require('./RC');
var expect = require('chai').expect;
var DeferredPromise = require('../lib/Util').DeferredPromise;
var MemberAttributeOperationType = require('../.').MemberAttributeOperationType;
var MemberEvent = require('../lib/invocation/ClusterService').MemberEvent;

describe('MembershipListener', function () {
    this.timeout(20000);
    var cluster;
    var member;
    var client;
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

    it('sees member added event', function () {
        var newMember;
        var listenerCalledResolver = DeferredPromise();

        var membershipListener = {
            memberAdded: function (membershipEvent) {
                listenerCalledResolver.resolve(membershipEvent);
            }
        };
        client.clusterService.addMembershipListener(membershipListener);

        return Controller.startMember(cluster.id).then(function (res) {
            newMember = res;
            return listenerCalledResolver.promise;
        }).then(function (membershipEvent) {
            expect(membershipEvent.member.address.host).to.equal(newMember.host);
            expect(membershipEvent.member.address.port).to.equal(newMember.port);
            expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
            expect(membershipEvent.members).to.equal(client.clusterService.getMembers());
        });
    });

    it('sees member added event and other listener\'s event ', function () {
        var newMember;
        var err = undefined;
        var listenerCalledResolver = DeferredPromise();
        var listenedSecondListener = false;

        var membershipListener = {
            memberAdded: function (membershipEvent) {
                listenerCalledResolver.resolve(membershipEvent);
            }
        };

        var membershipListener2 = {
            memberAdded: function (membershipEvent) {
                listenedSecondListener = true;
            }
        };
        client.clusterService.addMembershipListener(membershipListener);
        client.clusterService.addMembershipListener(membershipListener2);

        return Controller.startMember(cluster.id).then(function (res) {
            newMember = res;
            return listenerCalledResolver.promise;
        }).then(function (membershipEvent) {
            expect(membershipEvent.member.address.host).to.equal(newMember.host);
            expect(membershipEvent.member.address.port).to.equal(newMember.port);
            expect(membershipEvent.eventType).to.equal(MemberEvent.ADDED);
            expect(membershipEvent.members).to.equal(client.clusterService.getMembers());
            expect(listenedSecondListener).to.be.true;
        });

    });

    it('if same listener is added twice, gets same event twice', function () {
        var newMember;
        var counter = 0;

        var membershipListener = {
            memberAdded: function () {
                counter++;
            }
        };
        client.clusterService.addMembershipListener(membershipListener);
        client.clusterService.addMembershipListener(membershipListener);

        return Controller.startMember(cluster.id).then(function (m) {
            newMember = m;
            expect(counter).to.equal(2);
        });
    });

    it('sees member removed event', function () {
        var newMember;
        var listenerCalledResolver = DeferredPromise();

        var membershipListener = {
            memberRemoved: function (membershipEvent) {
                listenerCalledResolver.resolve(membershipEvent);
            }
        };

        client.clusterService.addMembershipListener(membershipListener);

        return Controller.startMember(cluster.id).then(function (res) {
            newMember = res;
            return Controller.shutdownMember(cluster.id, newMember.uuid);
        }).then(function () {
            return listenerCalledResolver.promise;
        }).then(function (membershipEvent) {
            expect(membershipEvent.member.address.host).to.equal(newMember.host);
            expect(membershipEvent.member.address.port).to.equal(newMember.port);
            expect(membershipEvent.eventType).to.equal(MemberEvent.REMOVED);
            expect(membershipEvent.members).to.equal(client.clusterService.getMembers());
        });
    });

    it('sees member attribute change put event', function () {
        var attributeChangePromise = new DeferredPromise();

        var membershipListener = {
            memberAttributeChanged: function (memberAttributeEvent) {
                attributeChangePromise.resolve(memberAttributeEvent);
            }
        };
        client.clusterService.addMembershipListener(membershipListener);

        var script = 'function attrs() { ' +
            'return instance_0.getCluster().getLocalMember().setIntAttribute("test", 123); }; result=attrs();';
        return Controller.executeOnController(cluster.id, script, 1).then(function () {
            return attributeChangePromise.promise;
        }).then(function (memberAttributeEvent) {
            expect(memberAttributeEvent.operationType === MemberAttributeOperationType.PUT);
            expect(memberAttributeEvent.member.uuid).to.equal(member.uuid);
            expect(memberAttributeEvent.key).to.equal('test');
            expect(memberAttributeEvent.value).to.equal('123');
        });
    });

    it('sees member attribute change remove event', function () {
        var attributeRemovePromise = new DeferredPromise();
        var attributeAddPromise = new DeferredPromise();
        var membershipListener = {
            memberAttributeChanged: function (memberAttributeEvent) {
                if (memberAttributeEvent.operationType === MemberAttributeOperationType.PUT) {
                    attributeAddPromise.resolve(memberAttributeEvent);
                } else if (memberAttributeEvent.operationType === MemberAttributeOperationType.REMOVE) {
                    attributeRemovePromise.resolve(memberAttributeEvent);
                } else {
                    attributeAddPromise.reject(undefined);
                }
            }
        };
        client.clusterService.addMembershipListener(membershipListener);

        var addScript = 'function attrs() { ' +
            'return instance_0.getCluster().getLocalMember().setIntAttribute("test", 123); }; result=attrs();';
        var removeScript = 'function attrs() { ' +
            'return instance_0.getCluster().getLocalMember().removeAttribute("test"); }; result=attrs();';
        return Controller.executeOnController(cluster.id, addScript, 1).then(function () {
            return attributeAddPromise.promise;
        }).then(function () {
            return Controller.executeOnController(cluster.id, removeScript, 1);
        }).then(function () {
            return attributeRemovePromise.promise;
        }).then(function (memberAttributeEvent) {
            expect(memberAttributeEvent.operationType === MemberAttributeOperationType.REMOVE);
            expect(memberAttributeEvent.member.uuid).to.equal(member.uuid);
            expect(memberAttributeEvent.key, 'test3');
        });
    });
});
