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
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { Client, ClientConfigImpl } = require('../../');
const { InvocationService } = require('../../lib/invocation/InvocationService');
const { ListenerService } = require('../../lib/listener/ListenerService');
const { PartitionServiceImpl } = require('../../lib/PartitionService');
const { LoggingService } = require('../../lib/logging/LoggingService');

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
        return clientStub;
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
});
