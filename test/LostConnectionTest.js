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
const { Client } = require('../.');
const Util = require('./Util');

describe('LostConnectionTest', function () {

    let cluster, oldMember, client;

    before(function () {
        return RC.createCluster(null, null).then(function (res) {
            cluster = res;
        }).then(function () {
            return RC.startMember(cluster.id);
        }).then(function (m) {
            oldMember = m;
        }).then(function () {
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                properties: {
                    'hazelcast.client.heartbeat.interval': 500,
                    'hazelcast.client.heartbeat.timeout': 2000
                }
            });
        }).then(function (cl) {
            client = cl;
        });
    });

    after(function () {
        client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('M2 starts, M1 goes down, client connects to M2', function (done) {
        this.timeout(32000);
        let newMember;
        const membershipListener = {
            memberAdded: (membershipEvent) => {
                RC.shutdownMember(cluster.id, oldMember.uuid).then(function () {
                    return Util.promiseWaitMilliseconds(4000);
                }).then(function () {
                    try {
                        const address = client.getConnectionManager().getRandomConnection().getRemoteAddress();
                        expect(address.host).to.equal(newMember.host);
                        expect(address.port).to.equal(newMember.port);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            }
        };

        client.clusterService.addMembershipListener(membershipListener);
        RC.startMember(cluster.id).then(function (m) {
            newMember = m;
        });
    });
});
