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
chai.use(sinonChai);

const { ConnectionRegistryImpl } = require('../../../lib/network/ConnectionManager');
const { ConnectionStrategyConfigImpl, ReconnectMode } = require('../../../lib/config/ConnectionStrategyConfig');
const { RoundRobinLB } = require('../../../lib/util/RoundRobinLB');
const { UuidUtil } = require('../../../lib/util/UuidUtil');
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

        it('should not call nextDataMember() or next() on load balancer ' +
            'when load balancer does not support data members and data member is requested ', function () {
            const loadBalancerStub = {};
            loadBalancerStub.canGetNextDataMember = sandbox.fake.returns(false);
            loadBalancerStub.next = sandbox.spy();
            loadBalancerStub.nextDataMember = sandbox.spy();

            const connectionRegistry = new ConnectionRegistryImpl(
                new ConnectionStrategyConfigImpl(),
                true,
                loadBalancerStub,
                {}
            );

            connectionRegistry.getRandomConnection(true);

            expect(loadBalancerStub.next.called).to.be.false;
            expect(loadBalancerStub.nextDataMember.called).to.be.false;
        });

        it('should call load balancer\'s next() when in smart mode', function () {
            const loadBalancerStub = {};
            loadBalancerStub.next = sandbox.fake.returns(null);
            loadBalancerStub.nextDataMember = sandbox.spy();

            const connectionRegistry = new ConnectionRegistryImpl(
                new ConnectionStrategyConfigImpl(),
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
                new ConnectionStrategyConfigImpl(),
                true,
                loadBalancerStub,
                {}
            );

            connectionRegistry.getRandomConnection(false);

            expect(loadBalancerStub.nextDataMember.called).to.be.false;
            expect(loadBalancerStub.next.called).to.be.true;
        });

        it('should call load balancer\'s nextDataMember() when in smart mode and dataMember is needed', function () {
            const loadBalancerStub = {};
            loadBalancerStub.next = sandbox.spy();
            loadBalancerStub.nextDataMember = sandbox.fake.returns(null);
            loadBalancerStub.canGetNextDataMember = sandbox.fake.returns(true);

            const connectionRegistry = new ConnectionRegistryImpl(
                new ConnectionStrategyConfigImpl(),
                true,
                loadBalancerStub,
                {}
            );

            connectionRegistry.getRandomConnection(true);

            expect(loadBalancerStub.nextDataMember.called).to.be.true;
            expect(loadBalancerStub.next.called).to.be.false;
        });

        it('should use member uuid returned by load balancer to get connection in smart mode', function () {
            const member = {
                uuid: UuidUtil.generate()
            };

            const loadBalancerStub = {};
            loadBalancerStub.next = sandbox.fake.returns(member);

            const connectionRegistry = new ConnectionRegistryImpl(
                new ConnectionStrategyConfigImpl(),
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
                    new ConnectionStrategyConfigImpl(),
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

        it('should return data member connection when one exists and when data member is requested, [dummy mode]',
            function () {
                const firstUUID = UuidUtil.generate();
                const secondUUID = UuidUtil.generate();
                const thirdUUID = UuidUtil.generate();

                const loadBalancerStub = {next: sandbox.spy(), nextDataMember: sandbox.spy()};
                const clusterServiceStub = {};
                clusterServiceStub.getMember = sandbox.stub();

                clusterServiceStub.getMember.withArgs(firstUUID.toString()).returns({
                    liteMember: true
                });
                clusterServiceStub.getMember.withArgs(secondUUID.toString()).returns({
                    liteMember: false
                });
                clusterServiceStub.getMember.withArgs(thirdUUID.toString()).returns({
                    liteMember: true
                });

                const connectionRegistry = new ConnectionRegistryImpl(
                    new ConnectionStrategyConfigImpl(),
                    false,
                    loadBalancerStub,
                    clusterServiceStub
                );

                const secondConnection = {};
                const firstConnection = {};
                connectionRegistry.setConnection(firstUUID, firstConnection);
                connectionRegistry.setConnection(secondUUID, secondConnection);
                connectionRegistry.setConnection(thirdUUID, {});

                const connection = connectionRegistry.getRandomConnection();
                const otherConnection = connectionRegistry.getRandomConnection();
                const dataMemberConnection = connectionRegistry.getRandomConnection(true);

                expect(connection).to.be.equal(firstConnection);
                expect(otherConnection).to.be.equal(firstConnection);
                expect(dataMemberConnection).to.be.equal(secondConnection);

                expect(loadBalancerStub.next.called).to.be.false;
                expect(loadBalancerStub.nextDataMember.called).to.be.false;
            }
        );

        it('should return null if there is no data member connection and data member is requested, [dummy mode]',
            function () {
                const firstUUID = UuidUtil.generate();
                const secondUUID = UuidUtil.generate();

                const loadBalancerStub = {next: sandbox.spy(), nextDataMember: sandbox.spy()};
                const clusterServiceStub = {};
                clusterServiceStub.getMember = sandbox.stub();

                clusterServiceStub.getMember.withArgs(firstUUID.toString()).returns({
                    liteMember: true
                });
                clusterServiceStub.getMember.withArgs(secondUUID.toString()).returns({
                    liteMember: true
                });

                const connectionRegistry = new ConnectionRegistryImpl(
                    new ConnectionStrategyConfigImpl(),
                    false,
                    loadBalancerStub,
                    clusterServiceStub
                );

                const secondConnection = {};
                const firstConnection = {};
                connectionRegistry.setConnection(firstUUID, firstConnection);
                connectionRegistry.setConnection(secondUUID, secondConnection);

                const connection = connectionRegistry.getRandomConnection();
                const otherConnection = connectionRegistry.getRandomConnection();
                const dataMemberConnection = connectionRegistry.getRandomConnection(true);

                expect(connection).to.be.equal(firstConnection);
                expect(otherConnection).to.be.equal(firstConnection);
                expect(dataMemberConnection).to.be.equal(null);

                expect(loadBalancerStub.next.called).to.be.false;
                expect(loadBalancerStub.nextDataMember.called).to.be.false;
            }
        );
    });

    describe('checkIfInvocationAllowed', function () {
        it('should return null when connection state is INITIALIZED_ON_CLUSTER and there are some active connections',
            function () {
                const connectionRegistry = new ConnectionRegistryImpl(
                    new ConnectionStrategyConfigImpl(),
                    false,
                    new RoundRobinLB()
                );

                connectionRegistry.setConnectionState(connectionState.INITIALIZED_ON_CLUSTER);
                connectionRegistry.setConnection(UuidUtil.generate(), {});

                expect(connectionRegistry.checkIfInvocationAllowed()).to.be.equal(null);
            }
        );

        it('should return ClientOfflineError when connection state is INITIAL and with async start', function () {
            const connectionStrategyConfig = new ConnectionStrategyConfigImpl();
            connectionStrategyConfig.asyncStart = true;

            const connectionRegistry = new ConnectionRegistryImpl(
                connectionStrategyConfig,
                false,
                new RoundRobinLB()
            );

            connectionRegistry.setConnectionState(connectionState.INITIAL);

            expect(connectionRegistry.checkIfInvocationAllowed()).to.be.instanceof(ClientOfflineError);
        });

        it('should return IOError when connection state is INITIAL and without async start', function () {
            const connectionStrategyConfig = new ConnectionStrategyConfigImpl();
            connectionStrategyConfig.asyncStart = false;

            const connectionRegistry = new ConnectionRegistryImpl(
                connectionStrategyConfig,
                false,
                new RoundRobinLB()
            );

            connectionRegistry.setConnectionState(connectionState.INITIAL);

            expect(connectionRegistry.checkIfInvocationAllowed()).to.be.instanceof(IOError);
        });

        it('should return ClientOfflineError when reconnect mode is async, connection state is INITIALIZED_ON_CLUSTER '
            + 'and there are no connections', function () {
            const connectionStrategyConfig = new ConnectionStrategyConfigImpl();
            connectionStrategyConfig.reconnectMode = ReconnectMode.ASYNC;

            const connectionRegistry = new ConnectionRegistryImpl(
                connectionStrategyConfig,
                false,
                new RoundRobinLB()
            );

            connectionRegistry.setConnectionState(connectionState.INITIALIZED_ON_CLUSTER);

            expect(connectionRegistry.checkIfInvocationAllowed()).to.be.instanceof(ClientOfflineError);
        });
    });
});
