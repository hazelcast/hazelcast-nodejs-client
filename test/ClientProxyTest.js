var MapProxy = require('../lib/proxy/MapProxy').MapProxy;
var ConnectionManager = require('../lib/invocation/ClientConnectionManager').ClientConnectionManager;
var ClientConnection = require('../lib/invocation/ClientConnection').ClientConnection;
var HazelcastClient = require('../.').Client;
var sinon = require('sinon');
var assert = require('chai').assert;
var sandbox = sinon.createSandbox();

describe('Generic proxy test', function() {

    afterEach(function() {
        sandbox.restore();
    });

    it('Client without active connection should return unknown version', function() {
        var connectionManagerStub = sandbox.stub(ConnectionManager.prototype);
        connectionManagerStub.getActiveConnections.returns({});
        var clientStub = sandbox.stub(HazelcastClient.prototype);
        clientStub.getConnectionManager.returns(connectionManagerStub);

        var mapProxy = new MapProxy(clientStub, 'mockMapService', 'mockMap');
        assert.equal(mapProxy.getConnectedServerVersion(), -1);
    });

    it('Client with a 3.7 server connection should return the version', function() {
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
})
