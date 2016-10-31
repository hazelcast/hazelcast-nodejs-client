var chai = require("chai");
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var HazelcastClient = require("../../lib/index.js").Client;
var Controller = require('./../RC');
var Config = require('../..').Config;
var Util = require('./../Util');
var Promise = require('bluebird');
var fs = require('fs');
var _fillMap = require('../Util').fillMap;


var authorizedSslConfig = new Config.ClientConfig();
authorizedSslConfig.networkConfig.sslOptions = {rejectUnauthorized: true,
    ca: [ fs.readFileSync(__dirname + '/hazelcast.pem') ],
    servername:'Hazelcast, Inc'
};

var unauthorizedSslConfig = new Config.ClientConfig();
unauthorizedSslConfig.networkConfig.sslOptions = {rejectUnauthorized: false};

var configParams = [
    authorizedSslConfig,
    unauthorizedSslConfig
];

configParams.forEach(function (cfg) {

    describe("SSL rejectUnauthorized:" + cfg.networkConfig.sslOptions.rejectUnauthorized, function () {

        var cluster;
        var client;

        before(function () {
            if(!process.env.HAZELCAST_ENTERPRISE_KEY){
                this.skip();
            }
            this.timeout(10000);
            return Controller.createCluster(null, fs.readFileSync(__dirname + '/hazelcast-ssl.xml', 'utf8')).then(function (response) {
                cluster = response;
                return Controller.startMember(cluster.id);
            }).then(function (member) {
                return HazelcastClient.newHazelcastClient(cfg).then(function (hazelcastClient) {
                    client = hazelcastClient;
                });
            });
        });

        after(function () {
            client.shutdown();
            return Controller.shutdownCluster(cluster.id);
        });

        it('isRunning', function () {
            return expect(client.lifecycleService.isRunning()).to.be.true;
        });

        it('basic map size', function () {
            map = client.getMap('test');
            return _fillMap(map).then(function () {
                return map.size().then(function (size) {
                    expect(size).to.equal(10);
                });
            })
        });
    });
});
