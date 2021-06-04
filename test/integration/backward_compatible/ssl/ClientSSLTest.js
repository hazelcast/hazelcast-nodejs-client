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

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const fs = require('fs');

const RC = require('../../RC');
const { Client, IllegalStateError } = require('../../../../');
const TestUtil = require('../../../TestUtil');

describe('ClientSSLTest', function () {

    let cluster;
    let client;
    let serverConfig;

    before(function () {
        TestUtil.markEnterprise(this);
    });

    afterEach(async function () {
        if (client) {
            await client.shutdown();
            client = null;
        }
        return RC.terminateCluster(cluster.id);
    });

    async function createCluster(sConfig) {
        cluster = await RC.createCluster(null, sConfig);
        return RC.startMember(cluster.id);
    }

    it('should not be able to connect to the server with invalid certificate', async function () {
        serverConfig = fs.readFileSync(__dirname + '/hazelcast-ssl.xml', 'utf8');
        const sConfig = serverConfig
            .replace('[serverCertificate]', 'com/hazelcast/nio/ssl-mutual-auth/server1.keystore')
            .replace('[password]', 'password');
        await createCluster(sConfig);

        await expect(Client.newHazelcastClient({
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
    });

    it('should be able to connect to the server with valid certificate', async function () {
        serverConfig = fs.readFileSync(__dirname + '/hazelcast-default-ca.xml', 'utf8');
        const sConfig = serverConfig
            .replace(/\[serverCertificate]/g, __dirname + '/keystore.jks')
            .replace('[password]', '123456');
        await createCluster(sConfig);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id,
            network: {
                clusterMembers: ['127.0.0.1:5701'],
                ssl: {
                    enabled: true
                }
            }
        });

        expect(client.lifecycleService.isRunning()).to.be.true;
    });
});

