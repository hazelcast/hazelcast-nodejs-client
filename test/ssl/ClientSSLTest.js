/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

var chai = require('chai');
chai.use(require('chai-as-promised'));
var expect = chai.expect;
var fs = require('fs');
var Promise = require('bluebird');
var path = require('path');
var Util = require('../Util');

var markEnterprise = require('../Util').markEnterprise;
var Controller = require('./../RC');

var HazelcastClient = require("../../").Client;
var Errors = require('../..').HazelcastErrors;
var Config = require('../..').Config;

describe("Client with SSL enabled", function () {

    var cluster;
    var client;
    var serverConfig;

    beforeEach(function () {
        this.timeout(20000);
        markEnterprise(this);
        Util.markServerVersionAtLeast(this, null, '3.8.1');
        serverConfig = fs.readFileSync(__dirname + '/hazelcast-ssl.xml', 'utf8');
    });

    afterEach(function () {
        this.timeout(20000);
        markEnterprise(this);
        Util.markServerVersionAtLeast(this, null, '3.8.1');
        if (client) {
            client.shutdown();
            client = null;
        }
        return Controller.shutdownCluster(cluster.id);
    });

    function createCluster(sConfig) {
        return Controller.createCluster(null, sConfig).then(function (response) {
            cluster = response;
            return Controller.startMember(cluster.id);
        });
    }

    it('should not be able to connect to the server with invalid certificate', function () {
        var sConfig = serverConfig
            .replace('[serverCertificate]', 'com/hazelcast/nio/ssl-mutual-auth/server1.keystore')
            .replace('[password]', 'password');
        return createCluster(sConfig).then(function () {
            var clientConfig = new Config.ClientConfig();
            clientConfig.networkConfig.sslConfig.enabled = true;
            return expect(HazelcastClient.newHazelcastClient(clientConfig)).to.be.rejectedWith(Errors.IllegalStateError);
        })
    });

    it('should be able to connect to the server with valid certificate', function () {
        var sConfig = serverConfig
            .replace('[serverCertificate]', 'com/hazelcast/nio/ssl/letsencrypt.jks')
            .replace('[password]', '123456');
        return createCluster(sConfig).then(function () {
            var clientConfig = new Config.ClientConfig();
            clientConfig.networkConfig.sslConfig.enabled = true;
            return HazelcastClient.newHazelcastClient(clientConfig);
        }).then(function (hazelcastClient) {
            client = hazelcastClient;
            return expect(client.lifecycleService.isRunning()).to.be.true;
        });
    });
});

