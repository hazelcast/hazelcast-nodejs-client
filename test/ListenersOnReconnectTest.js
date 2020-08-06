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

const Controller = require('./RC');
const expect = require('chai').expect;
const HazelcastClient = require('../.').Client;
const Util = require('./Util');
const Promise = require('bluebird');

describe('ListenersOnReconnectTest', function () {

    this.timeout(40000);
    let client;
    const members = [];
    let cluster;
    let map;

    beforeEach(function () {
        return Controller.createCluster(null, null).then(function (cl) {
            cluster = cl;
        });
    });

    afterEach(function () {
        return map.destroy().then(function () {
            client.shutdown();
            return Controller.terminateCluster(cluster.id);
        });
    });

    function closeTwoMembersOutOfThreeAndTestListener(done, isSmart, membersToClose, turnoffMember) {
        Controller.startMember(cluster.id).then(function (m) {
            members[0] = m;
            return Controller.startMember(cluster.id);
        }).then(function (m) {
            members[1] = m;
            return Controller.startMember(cluster.id);
        }).then(function (m) {
            members[2] = m;
            return HazelcastClient.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    smartRouting: isSmart
                },
                properties: {
                    'hazelcast.client.heartbeat.interval': 1000,
                    'hazelcast.client.heartbeat.timeout': 3000
                }
            });
        }).then(function (cl) {
            client = cl;
            return client.getMap('testmap');
        }).then(function (mp) {
            map = mp;
            const listener = {
                added: (entryEvent) => {
                    try {
                        expect(entryEvent.name).to.equal('testmap');
                        expect(entryEvent.key).to.equal('keyx');
                        expect(entryEvent.value).to.equal('valx');
                        expect(entryEvent.oldValue).to.be.equal(null);
                        expect(entryEvent.mergingValue).to.be.equal(null);
                        expect(entryEvent.member).to.not.be.equal(null);
                        done();
                    } catch (err) {
                        done(err);
                    }
                }
            };
            return map.addEntryListener(listener, 'keyx', true);
        }).then(function () {
            return Promise.all([
                turnoffMember(cluster.id, members[membersToClose[0]].uuid),
                turnoffMember(cluster.id, members[membersToClose[1]].uuid)
            ]);
        }).then(function () {
            return Util.promiseWaitMilliseconds(5000);
        }).then(function () {
            return map.put('keyx', 'valx');
        });
    }

    [true, false].forEach(function (isSmart) {

        /**
         * We use three members to simulate all configurations where connection is closed to;
         *  - ownerconnection
         *  - connection that has the local listener that will react to map.put event
         *  - the other unrelated connection
         */

        it('kill two members [1,2], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [1, 2], Controller.terminateMember);
        });

        it('kill two members [0,1], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [0, 1], Controller.terminateMember);
        });

        it('kill two members [0,2], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [0, 2], Controller.terminateMember);
        });

        it('shutdown two members [1,2], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [1, 2], Controller.shutdownMember);
        });

        it('shutdown two members [0,1], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [0, 1], Controller.shutdownMember);
        });

        it('shutdown two members [0,2], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [0, 2], Controller.shutdownMember);
        });

        it('restart member, listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            let member;
            Controller.startMember(cluster.id).then(function (m) {
                member = m;
                return HazelcastClient.newHazelcastClient({
                    clusterName: cluster.id,
                    network: {
                        smartRouting: isSmart
                    },
                    properties: {
                        'hazelcast.client.heartbeat.interval': 1000
                    }
                });
            }).then(function (cl) {
                client = cl;
                return client.getMap('testmap');
            }).then(function (mp) {
                map = mp;
                const listener = {
                    added: (entryEvent) => {
                        try {
                            expect(entryEvent.name).to.equal('testmap');
                            expect(entryEvent.key).to.equal('keyx');
                            expect(entryEvent.value).to.equal('valx');
                            expect(entryEvent.oldValue).to.be.equal(null);
                            expect(entryEvent.mergingValue).to.be.equal(null);
                            expect(entryEvent.member).to.not.be.equal(null);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                return map.addEntryListener(listener, 'keyx', true);
            }).then(function () {
                return Controller.terminateMember(cluster.id, member.uuid);
            }).then(function () {
                return Controller.startMember(cluster.id);
            }).then(function () {
                return Util.promiseWaitMilliseconds(5000);
            }).then(function () {
                return map.put('keyx', 'valx');
            });
        });
    });
});
