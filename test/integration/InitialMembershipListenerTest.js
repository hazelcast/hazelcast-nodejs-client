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

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const RC = require('../RC');
const { Client } = require('../../.');
const { deferredPromise } = require('../../lib/util/Util');

describe('InitialMembershipListenerTest', function () {

    this.timeout(32000);

    let cluster;
    let initialMember;
    let client;

    beforeEach(async function () {
        cluster = await RC.createCluster(null, null);
        initialMember = await RC.startMember(cluster.id);
    });

    afterEach(async function () {
        if (client != null) {
            await client.shutdown();
        }
        return RC.terminateCluster(cluster.id);
    });

    it('should receive available member when added before client start', function (done) {
        const config = {
            clusterName: cluster.id,
            membershipListeners: [
                {
                    init: (event) => {
                        const members = event.members;
                        expect(members).to.have.lengthOf(1);
                        const member = members[0];
                        expect(member.address.host).to.equal(initialMember.host);
                        expect(member.address.port).to.equal(initialMember.port);
                        done();
                    }
                }
            ]
        };

        Client.newHazelcastClient(config)
            .then((c) => {
                client = c;
            })
            .catch(done);
    });

    it('should receive available member when added after client start', function (done) {
        const membershipListener = {
            init: (event) => {
                const members = event.members;
                expect(members).to.have.lengthOf(1);
                const member = members[0];
                expect(member.address.host).to.equal(initialMember.host);
                expect(member.address.port).to.equal(initialMember.port);
                done();
            }
        };

        Client.newHazelcastClient({ clusterName: cluster.id })
            .then((c) => {
                client = c;
                client.getClusterService().addMembershipListener(membershipListener);
            })
            .catch(done);
    });

    it('should receive events after initial event', function (done) {
        let newMember;
        const newMemberResolved = deferredPromise();

        const membershipListener = {
            init: (event) => {
                const members = event.members;
                expect(members).to.have.lengthOf(1);
                const member = members[0];
                expect(member.address.host).to.equal(initialMember.host);
                expect(member.address.port).to.equal(initialMember.port);
            },
            memberAdded: (event) => {
                newMemberResolved.promise
                    .then(() => {
                        const member = event.member;
                        expect(member.address.host).to.equal(newMember.host);
                        expect(member.address.port).to.equal(newMember.port);
                        done();
                    })
                    .catch((e) => {
                        done(e);
                    });
            }
        };
        const config = {
            clusterName: cluster.id,
            membershipListeners: [membershipListener]
        };

        Client.newHazelcastClient(config)
            .then((c) => {
                client = c;
                return RC.startMember(cluster.id);
            })
            .then((m) => {
                newMember = m;
                newMemberResolved.resolve();
            })
            .catch(done);
    });
});
