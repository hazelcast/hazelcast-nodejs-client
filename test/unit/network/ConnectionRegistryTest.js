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
const net = require('net');
const sandbox = sinon.createSandbox();

const {
    ConnectionRegistryImpl,
    ClientConnectionManager
} = require('../../../lib/network/ClientConnectionManager');
const { ClientConnection } = require('../../../lib/network/ClientConnection');
const { ConnectionStrategyConfigImpl, ReconnectMode } = require('../../../lib/config/ConnectionStrategyConfig');
const { RoundRobinLB } = require('../../../lib/util/RoundRobinLB');
const { RandomLB } = require('../../../lib/util/RandomLB');
const { UuidUtil } = require('../../../lib/util/UuidUtil');
const { ClientConfigImpl } = require('../../../lib/config/Config');
const { DefaultLogger } = require('../../../lib/logging/DefaultLogger');
const { AddressImpl } = require('../../../lib/core/Address');
const { ClientOfflineError, IOError } = require('../../../lib/core/HazelcastError');
const { LifecycleServiceImpl } = require('../../../lib/LifecycleService');

describe('ConnectionRegistryTest', function () {

    let connectionManagerStub;
    let lifecycleManagerStub;
    let loggerStub;
    let addressStub;

    const defaultConfig = new ClientConfigImpl();
    const connectionState = {
        INITIAL: 0,
        CONNECTED_TO_CLUSTER: 1,
        INITIALIZED_ON_CLUSTER: 2
    };

    beforeEach(function () {
        connectionManagerStub = sandbox.stub(ClientConnectionManager.prototype);
        lifecycleManagerStub = sandbox.stub(LifecycleServiceImpl.prototype);
        loggerStub = sandbox.stub(DefaultLogger.prototype);
        addressStub = sandbox.stub(AddressImpl.prototype);
    });

    afterEach(function () {
        sandbox.restore();
    });

    function getNewConnection(connectionId) {
        return new ClientConnection(
            connectionManagerStub,
            defaultConfig,
            loggerStub,
            addressStub,
            new net.Socket(),
            connectionId,
            lifecycleManagerStub
        );
    }

    it('getRandomConnection should use load balancer in smart mode', function () {
        const loadBalancerStub = sandbox.stub(RoundRobinLB.prototype);
        const connectionRegistry = new ConnectionRegistryImpl(
            new ConnectionStrategyConfigImpl(),
            true,
            loadBalancerStub
        );
        connectionRegistry.getRandomConnection();
        expect(loadBalancerStub.next.calledOnce).to.be.true;
    });

    it('getRandomConnection should return first active connection in non-smart mode', function () {
        const loadBalancerStub = sandbox.stub(RandomLB.prototype);
        const connectionRegistry = new ConnectionRegistryImpl(
            new ConnectionStrategyConfigImpl(),
            false,
            loadBalancerStub
        );
        const firstConnection = getNewConnection(1);
        connectionRegistry.setConnection(UuidUtil.generate(), firstConnection);
        connectionRegistry.setConnection(UuidUtil.generate(), getNewConnection(2));
        connectionRegistry.setConnection(UuidUtil.generate(), getNewConnection(3));

        const randomConnection = connectionRegistry.getRandomConnection();
        expect(randomConnection).to.be.equal(firstConnection);
    });

    it('checkIfInvocationAllowed returns null when connection state is INITIALIZED_ON_CLUSTER' +
            ' and there are some active connections', function () {
        const loadBalancerStub = sandbox.stub(RandomLB.prototype);
        const connectionRegistry = new ConnectionRegistryImpl(
            new ConnectionStrategyConfigImpl(),
            false,
            loadBalancerStub
        );
        connectionRegistry.setConnectionState(connectionState.INITIALIZED_ON_CLUSTER);
        connectionRegistry.setConnection(UuidUtil.generate(), getNewConnection(1));

        const invocationAllowed = connectionRegistry.checkIfInvocationAllowed();
        expect(invocationAllowed).to.be.equal(null);
    });

    it('checkIfInvocationAllowed returns ClientOfflineError when connection state is INITIAL and asyncStart is true', function () {
        const loadBalancerStub = sandbox.stub(RandomLB.prototype);
        const connectionStrategyConfig = new ConnectionStrategyConfigImpl();
        connectionStrategyConfig.asyncStart = true;
        const connectionRegistry = new ConnectionRegistryImpl(
            connectionStrategyConfig,
            false,
            loadBalancerStub
        );
        connectionRegistry.setConnectionState(connectionState.INITIAL);

        const invocationAllowed = connectionRegistry.checkIfInvocationAllowed();
        expect(invocationAllowed).to.be.instanceof(ClientOfflineError);
    });

    it('checkIfInvocationAllowed returns IOError when connection state is INITIAL and asyncStart is false', function () {
        const loadBalancerStub = sandbox.stub(RandomLB.prototype);
        const connectionStrategyConfig = new ConnectionStrategyConfigImpl();
        connectionStrategyConfig.asyncStart = false;
        const connectionRegistry = new ConnectionRegistryImpl(
            connectionStrategyConfig,
            false,
            loadBalancerStub
        );
        connectionRegistry.setConnectionState(connectionState.INITIAL);

        const invocationAllowed = connectionRegistry.checkIfInvocationAllowed();
        expect(invocationAllowed).to.be.instanceof(IOError);
    });

    it('checkIfInvocationAllowed returns ClientOfflineError in async reconnect mode, when ' +
            'there are no connections, and with INITIALIZED_ON_CLUSTER connection state', function () {
        const loadBalancerStub = sandbox.stub(RandomLB.prototype);
        const connectionStrategyConfig = new ConnectionStrategyConfigImpl();
        connectionStrategyConfig.reconnectMode = ReconnectMode.ASYNC;
        const connectionRegistry = new ConnectionRegistryImpl(
            connectionStrategyConfig,
            false,
            loadBalancerStub
        );
        connectionRegistry.setConnectionState(connectionState.INITIALIZED_ON_CLUSTER);

        const invocationAllowed = connectionRegistry.checkIfInvocationAllowed();
        expect(invocationAllowed).to.be.instanceof(ClientOfflineError);
    });

});
