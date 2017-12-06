/*
 * Copyright (c) 2008-2017, Hazelcast, Inc. All Rights Reserved.
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
var markEnterprise = require('../Util').markEnterprise;


var authorizedSslConfig = new Config.ClientConfig();
authorizedSslConfig.networkConfig.sslOptions = {rejectUnauthorized: true,
    ca: [ fs.readFileSync(__dirname + '/server1.pem') ],
    servername:'foo.bar.com'
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
            markEnterprise(this);

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
            markEnterprise(this);

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
