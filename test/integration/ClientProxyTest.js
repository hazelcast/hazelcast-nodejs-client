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

const { expect, assert } = require('chai');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const RC = require('./RC');
const { Client } = require('../../');
const { MapProxy } = require('../../lib/proxy/MapProxy');
const { ClientConnectionManager } = require('../../lib/network/ClientConnectionManager');
const { ClientConnection } = require('../../lib/network/ClientConnection');
const { ProxyManager } = require('../../lib/proxy/ProxyManager');
const { ILogger } = require('../../lib/logging/ILogger');
const { LoggingService } = require('../../lib/logging/LoggingService');

describe('ClientProxyTest', function () {

    let cluster;
    let client;
    let map;
    let list;

    afterEach(async function () {
        sandbox.restore();
        if (map && list) {
            await map.destroy();
            await list.destroy();
            await client.shutdown();
            await RC.terminateCluster(cluster.id);
        }
    });

    it('client without active connection should return unknown version', function () {
        const connectionManagerStub = sandbox.stub(ClientConnectionManager.prototype);
        connectionManagerStub.getActiveConnections.returns({});

        const proxyManagerStub = sandbox.stub(ProxyManager.prototype);

        const loggingServiceStub = sandbox.stub(LoggingService.prototype);
        const loggerStub = sandbox.stub(ILogger);
        loggingServiceStub.getLogger.returns(loggerStub);

        const clientStub = sandbox.stub(Client.prototype);
        clientStub.getConnectionManager.returns(connectionManagerStub);
        clientStub.getLoggingService.returns(loggingServiceStub);

        const mapProxy = new MapProxy(
            'mockMapService',
            'mockMap',
            clientStub.getLoggingService().getLogger(),
            clientStub.clientConfig,
            proxyManagerStub,
            clientStub.getPartitionService(),
            clientStub.getInvocationService(),
            clientStub.getSerializationService(),
            clientStub.getConnectionManager(),
            clientStub.getListenerService(),
            clientStub.getClusterService()
        );
        assert.equal(mapProxy.getConnectedServerVersion(), -1);
    });

    it('client with a 4.1 server connection should return the version', function () {

        const connectionStub = sandbox.stub(ClientConnection.prototype);
        connectionStub.getConnectedServerVersion.returns('40100');

        const connectionManagerStub = sandbox.stub(ClientConnectionManager.prototype);
        connectionManagerStub.getActiveConnections.returns({
            'localhost': connectionStub
        });

        const proxyManagerStub = sandbox.stub(ProxyManager.prototype);

        const loggingServiceStub = sandbox.stub(LoggingService.prototype);
        const loggerStub = sandbox.stub(ILogger);
        loggingServiceStub.getLogger.returns(loggerStub);

        const clientStub = sandbox.stub(Client.prototype);
        clientStub.getConnectionManager.returns(connectionManagerStub);
        clientStub.getLoggingService.returns(loggingServiceStub);

        const mapProxy = new MapProxy(
            'mockMapService',
            'mockMap',
            clientStub.getLoggingService().getLogger(),
            clientStub.clientConfig,
            proxyManagerStub,
            clientStub.getPartitionService(),
            clientStub.getInvocationService(),
            clientStub.getSerializationService(),
            clientStub.getConnectionManager(),
            clientStub.getListenerService(),
            clientStub.getClusterService()
        );

        assert.equal(mapProxy.getConnectedServerVersion(), 40100);
    });

    it('proxies with the same name should be different for different services', async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });

        map = await client.getMap('Furkan');
        list = await client.getList('Furkan');

        expect(list.getServiceName()).to.be.equal('hz:impl:listService');
        expect(map.getServiceName()).to.be.equal('hz:impl:mapService');
    });
});
