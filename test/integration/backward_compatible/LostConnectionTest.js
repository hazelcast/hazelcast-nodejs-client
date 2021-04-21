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

describe('LostConnectionTest', function () {

    let cluster;
    let oldMember;
    let client;

    before(async function () {
        cluster = await RC.createCluster(null, null);
        oldMember = await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            properties: {
                'hazelcast.client.heartbeat.interval': 500,
                'hazelcast.client.heartbeat.timeout': 2000
            }
        });
    });

    after(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('M2 starts, M1 goes down, client connects to M2', function (done) {
        let newMember;
        const membershipListener = {
            memberAdded: () => {
                RC.shutdownMember(cluster.id, oldMember.uuid).then(() => {
                    return TestUtil.promiseWaitMilliseconds(4000);
                }).then(() => {
                    try {
                        const address = TestUtil.getRandomConnection(client).getRemoteAddress();
                        expect(address.host).to.equal(newMember.host);
                        expect(address.port).to.equal(newMember.port);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            }
        };

        client.getCluster().addMembershipListener(membershipListener);
        RC.startMember(cluster.id)
            .then((m) => {
                newMember = m;
            })
            .catch(done);
    });
});
