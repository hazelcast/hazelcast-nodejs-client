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

var chai = require("chai");
var expect = chai.expect;
var fs = require('fs');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var Client = require("../../.").Client;
var Controller = require('./../RC');
var Config = require('../..').Config;
var HzErrors = require('../..').HazelcastErrors;
var markEnterprise = require('../Util').markEnterprise;
var Path = require('path');
var Util = require('../Util');

describe('SSL Client Authentication Test', function () {
    var cluster;
    var member;

    var maRequiredXML = __dirname + '/hazelcast-ma-required.xml';
    var maOptionalXML = __dirname + '/hazelcast-ma-optional.xml';

    before(function () {
        markEnterprise(this);
    });

    function createMemberWithXML(serverXML) {
        return Controller.createCluster(null, fs.readFileSync(serverXML, 'utf8')).then(function (cl) {
            cluster = cl;
            return Controller.startMember(cluster.id);
        }).then(function (m) {
            member = m;
        });
    }

    function createClientConfigWithSSLOptsUsingProgrammaticConfiguration(key, cert, ca) {
        var sslOpts = {
            servername: 'foo.bar.com',
            rejectUnauthorized: true,
            ca: fs.readFileSync(Path.join(__dirname, ca)),
            key: fs.readFileSync(Path.join(__dirname, key)),
            cert: fs.readFileSync(Path.join(__dirname, cert))
        };
        var cfg = new Config.ClientConfig();
        cfg.networkConfig.sslConfig.enabled = true;
        cfg.networkConfig.sslConfig.sslOptions = sslOpts;
        cfg.networkConfig.connectionAttemptLimit = 1;
        cfg.networkConfig.connectionTimeout = 1000;
        return cfg;
    }

    function createClientConfigWithSSLOptsUsingBasicSSLOptionsFactory(key, cert, ca) {
        var cfg = new Config.ClientConfig();
        cfg.networkConfig.sslConfig.enabled = true;
        cfg.networkConfig.sslConfig.sslOptionsFactoryConfig = {
            exportedName: 'BasicSSLOptionsFactory'
        };
        cfg.networkConfig.sslConfig.sslOptionsFactoryProperties = {
            caPath: Path.resolve(__dirname, ca),
            keyPath: Path.resolve(__dirname, key),
            certPath: Path.resolve(__dirname, cert),
            rejectUnauthorized: true,
            servername: 'foo.bar.com'
        };
        cfg.networkConfig.connectionAttemptLimit = 1;
        return cfg;
    }

    [false, true].forEach(function (value) {
        if (value) {
            var createClientConfigWithSSLOpts = createClientConfigWithSSLOptsUsingBasicSSLOptionsFactory;
            var title = 'via BasicSSLOptionsFactory';
        } else {
            var createClientConfigWithSSLOpts = createClientConfigWithSSLOptsUsingProgrammaticConfiguration;
            var title = 'via programmatic configuration';
        }

        describe(title, function () {

            before(function () {
                markEnterprise(this);
                Util.markServerVersionAtLeast(this, null, '3.8.1');
            });

            afterEach(function () {
                return Controller.shutdownCluster(cluster.id);
            });

            it('ma:required, they both know each other should connect', function () {
                return createMemberWithXML(maRequiredXML).then(function () {
                    return Client.newHazelcastClient(createClientConfigWithSSLOpts('./client1-key.pem', './client1-cert.pem', './server1-cert.pem'));
                }).then(function (client) {
                    client.shutdown();
                });
            });

            it('ma:required, server knows client, client does not know server should fail', function () {
                return createMemberWithXML(maRequiredXML).then(function () {
                    return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('./client1-key.pem', './client1-cert.pem', './server2-cert.pem')))
                        .to.be.rejectedWith(HzErrors.IllegalStateError);
                });
            });

            it('ma:required, server does not know client, client knows server should fail', function () {
                return createMemberWithXML(maRequiredXML).then(function () {
                    return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('./client2-key.pem', './client2-cert.pem',
                        './server1-cert.pem'))).to.be.rejectedWith(HzErrors.IllegalStateError);
                });
            });

            it('ma:required, neither one knows the other should fail', function () {
                return createMemberWithXML(maRequiredXML).then(function () {
                    return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('./client2-key.pem', './client2-cert.pem',
                        './server2-cert.pem'))).to.be.rejectedWith(HzErrors.IllegalStateError);
                });
            });

            it('ma:optional, they both know each other should connect', function () {
                return createMemberWithXML(maOptionalXML).then(function () {
                    return Client.newHazelcastClient(createClientConfigWithSSLOpts('./client1-key.pem', './client1-cert.pem', './server1-cert.pem'));
                }).then(function (client) {
                    client.shutdown();
                });
            });

            it('ma:optional, server knows client, client does not know server should fail', function () {
                return createMemberWithXML(maOptionalXML).then(function () {
                    return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('./client1-key.pem', './client1-cert.pem', './server2-cert.pem')))
                        .to.be.rejectedWith(HzErrors.IllegalStateError);
                });
            });

            it('ma:optional, server does not know client, client knows server should fail', function () {
                return createMemberWithXML(maOptionalXML).then(function () {
                    return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('./client2-key.pem', './client2-cert.pem', './server1-cert.pem')))
                        .to.be.rejectedWith(HzErrors.IllegalStateError);
                });
            });

            it('ma:optional, neither knows the other should fail', function () {
                return createMemberWithXML(maOptionalXML).then(function () {
                    return expect(Client.newHazelcastClient(createClientConfigWithSSLOpts('./client2-key.pem', './client2-cert.pem', './server2-cert.pem')))
                        .to.be.rejectedWith(HzErrors.IllegalStateError);
                });
            });
        });
    });

});
