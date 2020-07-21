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
const assert = require('chai').assert;
const sandbox = sinon.createSandbox();

const Controller = require('./RC');
const MapProxy = require('../lib/proxy/MapProxy').MapProxy;
const ConnectionManager = require('../lib/network/ClientConnectionManager').ClientConnectionManager;
const ClientConnection = require('../lib/network/ClientConnection').ClientConnection;
const HazelcastClient = require('../.').Client;

describe('Generic proxy test', function () {

    let cluster, client, map, list;

    afterEach(function () {
        sandbox.restore();
        if (map && list) {
            return map.destroy()
                .then(function () {
                    return list.destroy();
                })
                .then(function () {
                    client.shutdown();
                    return Controller.terminateCluster(cluster.id);
                });
        }
    });

    it('Client without active connection should return unknown version', function () {
        const connectionManagerStub = sandbox.stub(ConnectionManager.prototype);
        connectionManagerStub.getActiveConnections.returns({});
        const clientStub = sandbox.stub(HazelcastClient.prototype);
        clientStub.getConnectionManager.returns(connectionManagerStub);

        const mapProxy = new MapProxy(clientStub, 'mockMapService', 'mockMap');
        assert.equal(mapProxy.getConnectedServerVersion(), -1);
    });

    it('Client with a 3.7 server connection should return the version', function () {
        const connectionStub = sandbox.stub(ClientConnection.prototype);
        connectionStub.getConnectedServerVersion.returns('30700');
        const connectionManagerStub = sandbox.stub(ConnectionManager.prototype);
        connectionManagerStub.getActiveConnections.returns({
            'localhost': connectionStub
        });
        const clientStub = sandbox.stub(HazelcastClient.prototype);
        clientStub.getConnectionManager.returns(connectionManagerStub);

        const mapProxy = new MapProxy(clientStub, 'mockMapService', 'mockMap');
        assert.equal(mapProxy.getConnectedServerVersion(), 30700);
    });

    it('Proxies with the same name should be different for different services', function () {
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient({
                clusterName: cluster.id
            });
        }).then(function (res) {
            client = res;
            return client.getMap('Furkan').then(function (m) {
                map = m;
                return client.getList('Furkan');
            }).then(function (l) {
                list = l;
                expect(list.getServiceName()).to.be.equal('hz:impl:listService');
                expect(map.getServiceName()).to.be.equal('hz:impl:mapService');
            });
        });
    });
});
