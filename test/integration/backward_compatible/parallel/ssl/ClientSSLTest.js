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

const RC = require('../../../RC');
const { IllegalStateError } = require('../../../../../lib');
const TestUtil = require('../../../../TestUtil');

describe('ClientSSLTest', function () {
    let cluster;
    let client;
    let serverConfig;

    const testFactory = new TestUtil.TestFactory();

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

    after(async function () {
        await testFactory.cleanUp();
    });

    async function createClusterAndMember(sConfig) {
        cluster = await testFactory.createClusterForParallelTest(null, sConfig);
        return RC.startMember(cluster.id);
    }

    it('should not be able to connect to the server with invalid certificate', async function () {
        serverConfig = fs.readFileSync(__dirname + '/hazelcast-ssl.xml', 'utf8');
        const sConfig = serverConfig
            .replace('[serverCertificate]', 'com/hazelcast/nio/ssl-mutual-auth/server1.keystore')
            .replace('[password]', 'password');
        const member = await createClusterAndMember(sConfig);

        await expect(testFactory.newHazelcastClientForParallelTest({
            clusterName: cluster.id,
            network: {
                ssl: {
                    enabled: true
                }
            },
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: 1000
                }
            }
        }, member)).to.be.rejectedWith(IllegalStateError);
    });

    it('should be able to connect to the server with valid certificate', async function () {
        serverConfig = fs.readFileSync(__dirname + '/hazelcast-default-ca.xml', 'utf8');
        const sConfig = serverConfig
            .replace(/\[serverCertificate]/g, __dirname + '/keystore.jks')
            .replace('[password]', '123456');
        const member = await createClusterAndMember(sConfig);
        client = await testFactory.newHazelcastClientForParallelTest({
            clusterName: cluster.id,
            network: {
                ssl: {
                    enabled: true
                }
            }
        }, member);

        expect(client.lifecycleService.isRunning()).to.be.true;
    });
});

