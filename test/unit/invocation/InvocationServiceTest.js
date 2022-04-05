/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
    Client,
    ClientConfigImpl,
    ClientNotActiveError,
    TargetDisconnectedError
} = require('../../../');
const { Invocation, InvocationService } = require('../../../lib/invocation/InvocationService');
const { ListenerService } = require('../../../lib/listener/ListenerService');
const { PartitionServiceImpl } = require('../../../lib/PartitionService');
const { LifecycleServiceImpl } = require('../../../lib/LifecycleService');
const { LoggingService } = require('../../../lib/logging/LoggingService');
const { ClientMessage } = require('../../../lib/protocol/ClientMessage');
const { Connection } = require('../../../lib/network/Connection');
const { ConnectionManager } = require('../../../lib/network/ConnectionManager');
const { deferredPromise } = require('../../../lib/util/Util');

describe('InvocationServiceTest', function () {
    let service;

    function mockClient(config) {
        const clientStub = sandbox.stub(Client.prototype);
        clientStub.getConfig.returns(config);
        const connectionManagerStub = sandbox.stub(ConnectionManager.prototype);
        clientStub.getConnectionManager.returns(connectionManagerStub);
        const listenerServiceStub = sandbox.stub(ListenerService.prototype);
        listenerServiceStub.registerListener.returns(Promise.resolve('mock-uuid'));
        clientStub.getListenerService.returns(listenerServiceStub);
        const partitionServiceStub = sandbox.stub(PartitionServiceImpl.prototype);
        clientStub.getPartitionService.returns(partitionServiceStub);
        const loggingServiceStub = sandbox.stub(LoggingService.prototype);
        clientStub.getLoggingService.returns(loggingServiceStub);
        const lifecycleServiceStub = sandbox.stub(LifecycleServiceImpl.prototype);
        lifecycleServiceStub.isRunning.returns(true);
        clientStub.getLifecycleService.returns(lifecycleServiceStub);
        return clientStub;
    }

    async function preparePendingInvocationWithClosedConn() {
        const config = new ClientConfigImpl();
        const client = mockClient(config);
        service = new InvocationService(
            client.getConfig(),
            client.getLoggingService().getLogger(),
            client.getPartitionService(),
            client.getErrorFactory(),
            client.getLifecycleService()
        );

        client.getInvocationService.returns(service);
        await service.start(client.getListenerService(), client.getConnectionManager());

        const messageStub = sandbox.stub(ClientMessage.prototype);
        messageStub.getCorrelationId.returns(0);
        const invocation = new Invocation(service, messageStub);
        const connStub = sandbox.stub(Connection.prototype);
        connStub.isAlive.returns(false);
        invocation.sendConnection = connStub;
        invocation.deferred = deferredPromise();
        service.pending.set(0, invocation);

        return invocation;
    }

    afterEach(function () {
        sandbox.restore();
        if (service != null) {
            service.shutdown();
        }
    });

    it('should start clean resource task and register listener for smart client and enabled acks', async function () {
        const config = new ClientConfigImpl();
        const client = mockClient(config);

        service = new InvocationService(
            client.getConfig(),
            client.getLoggingService().getLogger(),
            client.getPartitionService(),
            client.getErrorFactory(),
            client.getLifecycleService()
        );
        await service.start(client.getListenerService(), client.getConnectionManager());

        expect(service.cleanResourcesTask).to.be.not.undefined;
        expect(client.getListenerService().registerListener.calledOnce).to.be.true;
    });

    it('should start clean resource task without listener registration for unisocket client', async function () {
        const config = new ClientConfigImpl();
        config.network.smartRouting = false;
        const client = mockClient(config);

        service = new InvocationService(
            client.getConfig(),
            client.getLoggingService().getLogger(),
            client.getPartitionService(),
            client.getErrorFactory(),
            client.getLifecycleService()
        );
        await service.start(client.getListenerService(), client.getConnectionManager());

        expect(service.cleanResourcesTask).to.be.not.undefined;
        expect(client.getListenerService().registerListener.notCalled).to.be.true;
    });

    it('should start clean resource task without listener registration for disabled acks', async function () {
        const config = new ClientConfigImpl();
        config.backupAckToClientEnabled = false;
        const client = mockClient(config);

        service = new InvocationService(
            client.getConfig(),
            client.getLoggingService().getLogger(),
            client.getPartitionService(),
            client.getErrorFactory(),
            client.getLifecycleService()
        );
        await service.start(client.getListenerService(), client.getConnectionManager());

        expect(service.cleanResourcesTask).to.be.not.undefined;
        expect(client.getListenerService().registerListener.notCalled).to.be.true;
    });

    it('should reject pending invocations on shutdown', async function () {
        const invocation = await preparePendingInvocationWithClosedConn();

        invocation.invocationService.shutdown();

        await expect(invocation.deferred.promise).to.be.rejectedWith(ClientNotActiveError);
    });

    it('should reject pending invocations with closed connections when clean resource task runs', async function () {
        const invocation = await preparePendingInvocationWithClosedConn();

        await expect(invocation.deferred.promise).to.be.rejectedWith(TargetDisconnectedError);
    });
});
