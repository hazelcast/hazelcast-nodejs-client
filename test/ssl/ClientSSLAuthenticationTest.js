var chai = require("chai");
var expect = chai.expect;
var fs = require('fs');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var Client = require("../../.").Client;
var Controller = require('./../RC');
var Config = require('../..').Config;
var Promise = require('bluebird');
var markEnterprise = require('../Util').markEnterprise;

var serverKnowsClient = [true, false];
var clientKnowsServer = [true, false];
var mutualAuthRequired = [true, false];

describe('SSL Client Authentication Test', function () {
    var cluster;
    var member;
    var client;

    var maRequiredXML = __dirname + '/hazelcast-ma-required.xml';
    var maOptionalXML = __dirname + '/hazelcast-ma-optional.xml';

    afterEach(function () {
        if (client)
            client.shutdown();
        return Controller.shutdownCluster(cluster.id);
    });

    function createMemberWithXML(xmlFile) {
        return Controller.createCluster(null, fs.readFileSync(xmlFile, 'utf8')).then(function(cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        }).then(function (m) {
            member = m;
            return Promise.resolve();
        });
    }

    function createClientConfigWithSSLOpts(key, ca) {
        var sslOpts = {
            servername: 'foo.bar.com',
            rejectUnauthorized: true,
            cert: fs.readFileSync(__dirname + key),
            ca: fs.readFileSync(__dirname + ca)
        };
        var cfg = new Config.ClientConfig();
        cfg.networkConfig.sslOptions = sslOpts;
        return cfg;
    }

    it('ma:required, they both know each other should connect', function () {
        return createMemberWithXML(maRequiredXML).then(function () {
            return Client.newHazelcastClient(createClientConfigWithSSLOpts('/client1.pem', '/server1.pem'));
        }).then(function(cl) {
            client = cl;
        })
    });

    it('ma:required, server knows client, client does not know server should fail', function () {
        return createMemberWithXML(maRequiredXML).then(function () {
            return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('/client1.pem', '/server2.pem'))).to.throw;
        });
    });

    it('ma:required, server does not know client, client knows server should fail', function () {
        return createMemberWithXML(maRequiredXML).then(function () {
            return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('/client2.pem', '/server1.pem'))).to.throw;
        });
    });

    it('ma:required, neither one knows the other should fail', function () {
        return createMemberWithXML(maRequiredXML).then(function () {
            return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('/client2.pem', '/server2.pem'))).to.throw;
        });
    });

    it('ma:optional, they both know each other should connect', function () {
        return createMemberWithXML(maOptionalXML).then(function () {
            return Client.newHazelcastClient(createClientConfigWithSSLOpts('/client1.pem', '/server1.pem'));
        }).then(function(cl) {
            client = cl;
        });
    });

    it('ma:optional, server knows client, client does not know server should fail', function () {
        return createMemberWithXML(maRequiredXML).then(function () {
            return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('/client1.pem', '/server2.pem'))).to.throw;
        });
    });

    it('ma:optional, server does not know client, client knows server should connect', function () {
        return createMemberWithXML(maOptionalXML).then(function () {
            return Client.newHazelcastClient(createClientConfigWithSSLOpts('/client2.pem', '/server1.pem'));
        }).then(function(cl) {
            client = cl;
        })
    });

    it('ma:optional, neither knows the otherr should fail', function () {
        return createMemberWithXML(maRequiredXML).then(function () {
            return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('/client2.pem', '/server2.pem'))).to.throw;
        });
    });
});
