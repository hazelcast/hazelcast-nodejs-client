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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const fs = require('fs');

const RC = require('./../RC');
const { Client, IllegalStateError } = require("../../");
const { markEnterprise } = require('../Util');

describe('ClientSSLTest', function () {

    let cluster;
    let client;
    let serverConfig;

    before(function () {
        markEnterprise(this);
    });

    beforeEach(function () {
        this.timeout(20000);
        serverConfig = fs.readFileSync(__dirname + '/hazelcast-ssl.xml', 'utf8');
    });

    afterEach(function () {
        this.timeout(20000);
        if (client) {
            client.shutdown();
            client = null;
        }
        return RC.terminateCluster(cluster.id);
    });

    function createCluster(sConfig) {
        return RC.createCluster(null, sConfig).then(function (response) {
            cluster = response;
            return RC.startMember(cluster.id);
        });
    }

    it('should not be able to connect to the server with invalid certificate', function () {
        const sConfig = serverConfig
            .replace('[serverCertificate]', 'com/hazelcast/nio/ssl-mutual-auth/server1.keystore')
            .replace('[password]', 'password');
        return createCluster(sConfig).then(function () {
            return expect(Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    clusterMembers: ['127.0.0.1:5701'],
                    ssl: {
                        enabled: true
                    }
                },
                connectionStrategy: {
                    connectionRetry: {
                        clusterConnectTimeoutMillis: 1000
                    }
                }
            })).to.be.rejectedWith(IllegalStateError);
        })
    });

    it('should be able to connect to the server with valid certificate', function () {
        const sConfig = serverConfig
            .replace('[serverCertificate]', 'com/hazelcast/nio/ssl/letsencrypt.jks')
            .replace('[password]', '123456');
        return createCluster(sConfig).then(function () {
            return Client.newHazelcastClient({
                clusterName: cluster.id,
                network: {
                    clusterMembers: ['127.0.0.1:5701'],
                    ssl: {
                        enabled: true
                    }
                }
            });
        }).then(function (hazelcastClient) {
            client = hazelcastClient;
            return expect(client.lifecycleService.isRunning()).to.be.true;
        });
    });
});

