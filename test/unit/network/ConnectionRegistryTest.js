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

const sinonChai = require('sinon-chai');
const chai = require('chai');
const sinon = require('sinon');

const sandbox = sinon.createSandbox();
const expect = chai.expect;
const should = chai.should();
chai.use(sinonChai);

const { ConnectionRegistryImpl } = require('../../../lib/network/ConnectionManager');
const { ReconnectMode } = require('../../../lib/config/ConnectionStrategyConfig');
const { RoundRobinLB } = require('../../../lib/util/RoundRobinLB');
const { UuidUtil } = require('../../../lib/util/UuidUtil');
const Util = require('../../../lib/util/Util');
const { ClientOfflineError, IOError } = require('../../../lib/core/HazelcastError');

describe('ConnectionRegistryTest', function () {
    const connectionState = {
        INITIAL: 0,
        CONNECTED_TO_CLUSTER: 1,
        INITIALIZED_ON_CLUSTER: 2
    };

    afterEach(function () {
        sandbox.restore();
    });

    describe('getRandomConnection', function () {
        it('should call load balancer\'s next() when in smart mode', function () {
            const loadBalancerStub = {};
            loadBalancerStub.next = sandbox.fake.returns(null);
            loadBalancerStub.nextDataMember = sandbox.spy();

            const connectionRegistry = new ConnectionRegistryImpl(
                false,
                ReconnectMode.ON,
                true,
                loadBalancerStub,
                {}
            );

            connectionRegistry.getRandomConnection();

            expect(loadBalancerStub.next.called).to.be.true;
            expect(loadBalancerStub.nextDataMember.called).to.be.false;
        });

        it('should call load balancer\'s next() when in smart mode and dataMember is not needed', function () {
            const loadBalancerStub = {};
            loadBalancerStub.next = sandbox.fake.returns(null);
            loadBalancerStub.nextDataMember = sandbox.spy();

            const connectionRegistry = new ConnectionRegistryImpl(
                false,
                ReconnectMode.ON,
                true,
                loadBalancerStub,
                {}
            );

            connectionRegistry.getRandomConnection(false);

            expect(loadBalancerStub.nextDataMember.called).to.be.false;
            expect(loadBalancerStub.next.called).to.be.true;
        });

        it('should use member uuid returned by load balancer to get connection in smart mode', function () {
            const member = {
                uuid: UuidUtil.generate()
            };

            const loadBalancerStub = {};
            loadBalancerStub.next = sandbox.fake.returns(member);

            const connectionRegistry = new ConnectionRegistryImpl(
                false,
                ReconnectMode.ON,
                true,
                loadBalancerStub,
                {}
            );

            sandbox.spy(connectionRegistry, 'getConnection');

            connectionRegistry.getRandomConnection();

            expect(connectionRegistry.getConnection).to.have.been.calledOnceWithExactly(member.uuid);
        });

        it('should return first active connection in non-smart mode without using load balancer',
            function () {
                const loadBalancerStub = {next: sandbox.spy(), nextDataMember: sandbox.spy()};
                const connectionRegistry = new ConnectionRegistryImpl(
                    false,
                    ReconnectMode.ON,
                    false,
                    loadBalancerStub,
                    {}
                );

                const firstConnection = {};
                connectionRegistry.setConnection(UuidUtil.generate(), firstConnection);
                connectionRegistry.setConnection(UuidUtil.generate(), {});
                connectionRegistry.setConnection(UuidUtil.generate(), {});

                const connection = connectionRegistry.getRandomConnection();
                const otherConnection = connectionRegistry.getRandomConnection();
                const anotherConnection = connectionRegistry.getRandomConnection();

                expect(connection).to.be.equal(firstConnection);
                expect(otherConnection).to.be.equal(firstConnection);
                expect(anotherConnection).to.be.equal(firstConnection);

                expect(loadBalancerStub.next.called).to.be.false;
                expect(loadBalancerStub.nextDataMember.called).to.be.false;
            }
        );
    });

    describe('checkIfInvocationAllowed', function () {
        it('should return null when connection state is INITIALIZED_ON_CLUSTER and there are some active connections',
            function () {
                const connectionRegistry = new ConnectionRegistryImpl(
                    false,
                    ReconnectMode.ON,
                    false,
                    new RoundRobinLB(),
                    {}
                );

                connectionRegistry.setConnectionState(connectionState.INITIALIZED_ON_CLUSTER);
                connectionRegistry.setConnection(UuidUtil.generate(), {});

                expect(connectionRegistry.checkIfInvocationAllowed()).to.be.equal(null);
            }
        );

        it('should return ClientOfflineError when connection state is INITIAL and with async start', function () {
            const connectionRegistry = new ConnectionRegistryImpl(
                true,
                ReconnectMode.ON,
                false,
                new RoundRobinLB(),
                {}
            );

            connectionRegistry.setConnectionState(connectionState.INITIAL);

            expect(connectionRegistry.checkIfInvocationAllowed()).to.be.instanceof(ClientOfflineError);
        });

        it('should return IOError when connection state is INITIAL and without async start', function () {
            const connectionRegistry = new ConnectionRegistryImpl(
                false,
                ReconnectMode.ON,
                false,
                new RoundRobinLB(),
                {}
            );

            connectionRegistry.setConnectionState(connectionState.INITIAL);

            expect(connectionRegistry.checkIfInvocationAllowed()).to.be.instanceof(IOError);
        });

        it('should return ClientOfflineError when reconnect mode is async, connection state is INITIALIZED_ON_CLUSTER '
            + 'and there are no connections', function () {
                const connectionRegistry = new ConnectionRegistryImpl(
                    false,
                    ReconnectMode.ASYNC,
                    false,
                    new RoundRobinLB(),
                    {}
                );

                connectionRegistry.setConnectionState(connectionState.INITIALIZED_ON_CLUSTER);

                expect(connectionRegistry.checkIfInvocationAllowed()).to.be.instanceof(ClientOfflineError);
            });
    });

    describe('getConnectionForSql', function () {
        afterEach(function () {
            sandbox.restore();
        });

        it('should return the connection to the member returned from memberOfLargerSameVersionGroup in smart mode', function () {
            const fakeClusterService = {
                getMembers: () => {}
            };
            const connectionRegistry = new ConnectionRegistryImpl(false, ReconnectMode.ON, true, {}, fakeClusterService);
            const fakeMember = {uuid: UuidUtil.generate()};
            const memberConnection = {};

            sandbox.replace(Util, 'memberOfLargerSameVersionGroup', sandbox.fake.returns(fakeMember));

            // add connection to the member
            connectionRegistry.setConnection(fakeMember.uuid, memberConnection);
            const connection = connectionRegistry.getConnectionForSql();
            connection.should.be.eq(memberConnection);
        });

        it('should return the first connection to a data member in dummy mode', function () {
            const fakeLiteMember = {uuid: UuidUtil.generate(), liteMember: true};
            const fakeDataMember = {uuid: UuidUtil.generate(), liteMember: false};
            const fakeDataMember2 = {uuid: UuidUtil.generate(), liteMember: false};

            const fakeClusterService = {
                members: {
                    [fakeLiteMember.uuid.toString()]: fakeLiteMember,
                    [fakeDataMember.uuid.toString()]: fakeDataMember,
                    [fakeDataMember2.uuid.toString()]: fakeDataMember2,
                },
                getMember: function (memberId) { // arrow function won't work here
                    return this.members[memberId];
                }
            };

            const connectionRegistry = new ConnectionRegistryImpl(false, ReconnectMode.ON, false, {}, fakeClusterService);

            // add connections
            const firstDataMemberConnection = {};
            connectionRegistry.setConnection(fakeDataMember.uuid, firstDataMemberConnection);
            connectionRegistry.setConnection(fakeDataMember2.uuid, {});
            connectionRegistry.setConnection(fakeLiteMember.uuid, {});

            const connection = connectionRegistry.getConnectionForSql();
            connection.should.be.eq(firstDataMemberConnection);
        });

        it('should return the first connection if no data members found in dummy mode', function () {
            const fakeLiteMember = {uuid: UuidUtil.generate(), liteMember: true};
            const fakeLiteMember2 = {uuid: UuidUtil.generate(), liteMember: true};

            const fakeClusterService = {
                members: {
                    [fakeLiteMember.uuid.toString()]: fakeLiteMember,
                    [fakeLiteMember2.uuid.toString()]: fakeLiteMember2,
                },
                getMember: function (memberId) { // arrow function won't work here
                    return this.members[memberId];
                }
            };

            const connectionRegistry = new ConnectionRegistryImpl(false, ReconnectMode.ON, false, {}, fakeClusterService);

            // add connections
            const firstConnection = {};
            connectionRegistry.setConnection(fakeLiteMember.uuid, firstConnection);
            connectionRegistry.setConnection(fakeLiteMember2.uuid, {});

            const connection = connectionRegistry.getConnectionForSql();
            connection.should.be.eq(firstConnection);
        });

        it('should return null if no connection exists', function () {
            const connectionRegistry = new ConnectionRegistryImpl(false, ReconnectMode.ON, false, {}, {
                getMembers: () => []
            });

            const connection = connectionRegistry.getConnectionForSql();
            should.equal(connection, null);

            const connectionRegistry2 = new ConnectionRegistryImpl(false, ReconnectMode.ON, true, {}, {
                getMembers: () => []
            });
            const connection2 = connectionRegistry2.getConnectionForSql();
            should.equal(connection2, null);
        });
    });
});
