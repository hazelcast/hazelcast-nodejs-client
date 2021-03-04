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
const { Connection } = require('../../../lib/network/Connection');
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
        it('should use load balancer in smart mode', function () {
            const loadBalancerStub = sandbox.stub(RoundRobinLB.prototype);
            const connectionRegistry = new ConnectionRegistryImpl(
                new ConnectionStrategyConfigImpl(),
                true,
                loadBalancerStub
            );

            connectionRegistry.getRandomConnection();

            expect(loadBalancerStub.next.called).to.be.true;
        });

        it('should use member uuid returned by load balancer to get connection in smart mode', function () {
            const loadBalancerStub = sandbox.stub(RoundRobinLB.prototype);

            const member = {
                uuid: UuidUtil.generate()
            };
            const connectionRegistry = new ConnectionRegistryImpl(
                new ConnectionStrategyConfigImpl(),
                true,
                loadBalancerStub
            );

            const spy = sandbox.spy(ConnectionRegistryImpl.prototype, 'getConnection');
            loadBalancerStub.next.returns(member);

            connectionRegistry.getRandomConnection();

            expect(spy).to.have.been.calledOnceWithExactly(member.uuid);
        });

        it('should return first active connection in non-smart mode without using load balancer',
            function () {
                const loadBalancerStub = sandbox.stub(RoundRobinLB.prototype);
                const connectionRegistry = new ConnectionRegistryImpl(
                    new ConnectionStrategyConfigImpl(),
                    false,
                    loadBalancerStub
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
                connectionRegistry.setConnection(UuidUtil.generate(), new sinon.createStubInstance(Connection));

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
         + 'and there are no connections',
        function () {
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
