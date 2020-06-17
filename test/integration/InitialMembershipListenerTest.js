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

const expect = require('chai').expect;
const Client = require('../../.').Client;
const Config = require('../../.').Config;
const Controller = require('../RC');
const Util = require('../../lib/Util');

describe('InitialMembershipListenerTest', function () {

    this.timeout(32000);

    let cluster;
    let initialMember;
    let client;

    beforeEach(function () {
       return Controller.createCluster(null, null)
           .then((c) => {
               cluster = c;
               return Controller.startMember(cluster.id);
           })
           .then((m) => {
               initialMember = m;
           })
    });

    afterEach(function () {
        if (client != null) {
            client.shutdown();
        }

        return Controller.terminateCluster(cluster.id);
    });

    it('receives available member when added before client start', function (done) {
        const config = new Config.ClientConfig();
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

        config.clusterName = cluster.id;
        config.listeners.addMembershipListener(membershipListener);

        Client.newHazelcastClient(config)
            .then((c) => {
                client = c;
            })
    });

    it('receives available member when added after client start', function (done) {
        const config = new Config.ClientConfig();
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

        config.clusterName = cluster.id;
        Client.newHazelcastClient(config)
            .then((c) => {
                client = c;

                client.getClusterService().addMembershipListener(membershipListener);
            });
    });

    it('receives events after initial event', function (done) {
        let newMember;
        let newMemberResolved = Util.DeferredPromise();

        const config = new Config.ClientConfig();
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

        config.clusterName = cluster.id;
        config.listeners.addMembershipListener(membershipListener);

        Client.newHazelcastClient(config)
            .then((c) => {
                client = c;

                return Controller.startMember(cluster.id);
            })
            .then((m) => {
                newMember = m;
                newMemberResolved.resolve();
            })
            .catch((e) => {
                done(e);
            });
    });

});
