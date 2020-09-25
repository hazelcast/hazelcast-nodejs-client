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
chai.should();
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const {
    Client,
    ClientConfigImpl,
    ClientNotActiveError,
    TargetDisconnectedError
} = require('../../');
const { Invocation, InvocationService } = require('../../lib/invocation/InvocationService');
const { ListenerService } = require('../../lib/listener/ListenerService');
const { PartitionServiceImpl } = require('../../lib/PartitionService');
const { LifecycleServiceImpl } = require('../../lib/LifecycleService');
const { LoggingService } = require('../../lib/logging/LoggingService');
const { ClientMessage } = require('../../lib/protocol/ClientMessage');
const { ClientConnection } = require('../../lib/network/ClientConnection');
const { deferredPromise } = require('../../lib/util/Util');

describe('InvocationServiceTest', function () {

    let service;

    function mockClient(config) {
        const clientStub = sandbox.stub(Client.prototype);
        clientStub.getConfig.returns(config);
        const listenerServiceStub = sandbox.stub(ListenerService.prototype);
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

    function preparePendingInvocationWithClosedConn() {
        const config = new ClientConfigImpl();
        const clientStub = mockClient(config);
        service = new InvocationService(clientStub);
        clientStub.getInvocationService.returns(service);
        service.start();

        const messageStub = sandbox.stub(ClientMessage.prototype);
        messageStub.getCorrelationId.returns(0);
        const invocation = new Invocation(clientStub, messageStub);
        const connStub = sandbox.stub(ClientConnection.prototype);
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

    it('should start clean resource task and register listener when client is smart and acks are enabled', function () {
        const config = new ClientConfigImpl();
        const client = mockClient(config);

        service = new InvocationService(client);
        service.start();

        expect(service.cleanResourcesTask).to.be.not.undefined;
        expect(client.getListenerService().registerListener.calledOnce).to.be.true;
    });

    it('should not start clean resource task and register listener when client is unisocket', function () {
        const config = new ClientConfigImpl();
        config.network.smartRouting = false;
        const client = mockClient(config);

        service = new InvocationService(client);
        service.start();

        expect(service.cleanResourcesTask).to.be.undefined;
        expect(client.getListenerService().registerListener.notCalled).to.be.true;
    });

    it('should not start clean resource task and register listener when acks are disabled', function () {
        const config = new ClientConfigImpl();
        config.backupAckToClientEnabled = false;
        const client = mockClient(config);

        service = new InvocationService(client);
        service.start();

        expect(service.cleanResourcesTask).to.be.undefined;
        expect(client.getListenerService().registerListener.notCalled).to.be.true;
    });

    it('should reject pending invocations on shut down', async function () {
        const invocation = preparePendingInvocationWithClosedConn();

        invocation.invocationService.shutdown();

        await expect(invocation.deferred.promise).to.be.rejectedWith(ClientNotActiveError);
    });

    it('should reject pending invocations with closed connections when clean resource task runs', async function () {
        const invocation = preparePendingInvocationWithClosedConn();

        await expect(invocation.deferred.promise).to.be.rejectedWith(TargetDisconnectedError);
    });
});
