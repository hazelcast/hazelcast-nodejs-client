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
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

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

        it('should return first active connection in non-smart mode', function () {
            const loadBalancerStub = sandbox.stub(RoundRobinLB.prototype);
            const connectionRegistry = new ConnectionRegistryImpl(
                new ConnectionStrategyConfigImpl(),
                false,
                loadBalancerStub
            );

            const firstConnection = new sinon.createStubInstance(Connection);
            connectionRegistry.setConnection(UuidUtil.generate(), firstConnection);
            connectionRegistry.setConnection(UuidUtil.generate(), new sinon.createStubInstance(Connection));
            connectionRegistry.setConnection(UuidUtil.generate(), new sinon.createStubInstance(Connection));

            const randomConnection = connectionRegistry.getRandomConnection();

            expect(randomConnection).to.be.equal(firstConnection);
            expect(loadBalancerStub.next.called).to.be.false;
        });
    });

    describe('checkIfInvocationAllowed', function () {
        it('returns null when ConnectionState is INITIALIZED_ON_CLUSTER and there are some active connections',
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

        it('returns ClientOfflineError when ConnectionState is INITIAL and asyncStart is true', function () {
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

        it('returns IOError when ConnectionState is INITIAL and asyncStart is false', function () {
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

        it('returns ClientOfflineError in async reconnect mode, when ' +
            'there are no connections, and with INITIALIZED_ON_CLUSTER ConnectionState', function () {
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
