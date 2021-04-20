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

    async function closeTwoMembersOutOfThreeAndTestListener(done, isSmart, membersToClose, turnoffMember) {
        const members = await Promise.all([
            RC.startMember(cluster.id),
            RC.startMember(cluster.id),
            RC.startMember(cluster.id)
        ]);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                smartRouting: isSmart
            },
            properties: {
                'hazelcast.client.heartbeat.interval': 1000,
                'hazelcast.client.heartbeat.timeout': 3000
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
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        await map.addEntryListener(listener, 'keyx', true);
        await Promise.all([
            turnoffMember(cluster.id, members[membersToClose[0]].uuid),
            turnoffMember(cluster.id, members[membersToClose[1]].uuid)
        ]);

        await TestUtil.promiseWaitMilliseconds(8000);
        return map.put('keyx', 'valx');
    }

    [true, false].forEach((isSmart) => {

        /**
         * We use three members to simulate all configurations where connection is closed to;
         *  - ownerconnection
         *  - connection that has the local listener that will react to map.put event
         *  - the other unrelated connection
         */

        it('kill two members [1,2], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [1, 2], RC.terminateMember).catch(done);
        });

        it('kill two members [0,1], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [0, 1], RC.terminateMember).catch(done);
        });

        it('kill two members [0,2], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [0, 2], RC.terminateMember).catch(done);
        });

        it('shutdown two members [1,2], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [1, 2], RC.shutdownMember).catch(done);
        });

        it('shutdown two members [0,1], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [0, 1], RC.shutdownMember).catch(done);
        });

        it('shutdown two members [0,2], listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            closeTwoMembersOutOfThreeAndTestListener(done, isSmart, [0, 2], RC.shutdownMember).catch(done);
        });

        it('restart member, listener still receives map.put event [smart=' + isSmart + ']', function (done) {
            async function testListener(done) {
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
                            done();
                        } catch (err) {
                            done(err);
                        }
                    }
                };
                await map.addEntryListener(listener, 'keyx', true);

                await RC.terminateMember(cluster.id, member.uuid);
                await RC.startMember(cluster.id);

                await TestUtil.promiseWaitMilliseconds(8000);
                return map.put('keyx', 'valx');
            }

            testListener(done).catch(done);
        });
    });
});
