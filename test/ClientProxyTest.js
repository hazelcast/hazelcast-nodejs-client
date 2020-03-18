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

var Controller = require('./RC');
var expect = require('chai').expect;

var MapProxy = require('../lib/proxy/MapProxy').MapProxy;
var ConnectionManager = require('../lib/invocation/ClientConnectionManager').ClientConnectionManager;
var ClientConnection = require('../lib/invocation/ClientConnection').ClientConnection;
var HazelcastClient = require('../.').Client;
var sinon = require('sinon');
var assert = require('chai').assert;
var sandbox = sinon.createSandbox();

describe('Generic proxy test', function () {
    var cluster;
    var client;
    var map;
    var list;

    afterEach(function () {
            sandbox.restore();
            if (map && list) {
                map.destroy();
                list.destroy();
                client.shutdown();
                return Controller.shutdownCluster(cluster.id);
            }
        }
    );

    it('Client without active connection should return unknown version', function () {
        var connectionManagerStub = sandbox.stub(ConnectionManager.prototype);
        connectionManagerStub.getActiveConnections.returns({});
        var clientStub = sandbox.stub(HazelcastClient.prototype);
        clientStub.getConnectionManager.returns(connectionManagerStub);

        var mapProxy = new MapProxy(clientStub, 'mockMapService', 'mockMap');
        assert.equal(mapProxy.getConnectedServerVersion(), -1);
    });

    it('Client with a 3.7 server connection should return the version', function () {
        var connectionStub = sandbox.stub(ClientConnection.prototype);
        connectionStub.getConnectedServerVersion.returns('30700');
        var connectionManagerStub = sandbox.stub(ConnectionManager.prototype);
        connectionManagerStub.getActiveConnections.returns({
            'localhost': connectionStub
        });
        var clientStub = sandbox.stub(HazelcastClient.prototype);
        clientStub.getConnectionManager.returns(connectionManagerStub);

        var mapProxy = new MapProxy(clientStub, 'mockMapService', 'mockMap');
        assert.equal(mapProxy.getConnectedServerVersion(), 30700);
    });

    it('Proxies with the same name should be different for different services', function () {
        return Controller.createCluster().then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        }).then(function () {
            return HazelcastClient.newHazelcastClient();
        }).then(function (res) {
            client = res;
            return client.getMap('Furkan').then(function (m) {
                map = m;
                return client.getList('Furkan');
            }).then(function (l) {
                list = l;
                expect(list.getServiceName()).to.be.equal('hz:impl:listService');
            });
        });
    });
})
