/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
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
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

const RC = require('../../../RC');
const { IllegalStateError } = require('../../../../../lib');
const TestUtil = require('../../../../TestUtil');

describe.skip('ClientSSLAuthenticationTest', function () {
    let cluster;

    const maRequiredXML = __dirname + '/hazelcast-ma-required.xml';
    const maOptionalXML = __dirname + '/hazelcast-ma-optional.xml';
    const testFactory = new TestUtil.TestFactory();

    before(function () {
        TestUtil.markEnterprise(this);
    });

    async function createMemberWithXML(serverXML) {
        cluster = await testFactory.createClusterForParallelTests(null, fs.readFileSync(serverXML, 'utf8'));
        return RC.startMember(cluster.id);
    }

    function createClientConfigWithBasicSSLOptionsFactory(key, cert, ca, port) {
        return {
            clusterName: cluster.id,
            network: {
                clusterMembers: [`127.0.0.1:${port}`],
                ssl: {
                    enabled: true,
                    sslOptionsFactoryProperties: {
                        servername: 'foo.bar.com',
                        rejectUnauthorized: true,
                        caPath: path.resolve(__dirname, ca),
                        keyPath: path.resolve(__dirname, key),
                        certPath: path.resolve(__dirname, cert)
                    }
                }
            },
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: 1000
                }
            }
        };
    }

    function createClientConfigWithSSLOpts(key, cert, ca, port) {
        const sslOpts = {
            servername: 'foo.bar.com',
            rejectUnauthorized: true,
            ca: fs.readFileSync(path.join(__dirname, ca)),
            key: fs.readFileSync(path.join(__dirname, key)),
            cert: fs.readFileSync(path.join(__dirname, cert))
        };
        return {
            clusterName: cluster.id,
            network: {
                clusterMembers: [`127.0.0.1:${port}`],
                ssl: {
                    enabled: true,
                    sslOptions: sslOpts
                }
            },
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: 1000
                }
            }
        };
    }

    [false, true].forEach((value) => {
        let createClientConfigFn;
        let title;
        if (value) {
            createClientConfigFn = createClientConfigWithBasicSSLOptionsFactory;
            title = 'via BasicSSLOptionsFactory';
        } else {
            createClientConfigFn = createClientConfigWithSSLOpts;
            title = 'via programmatic configuration';
        }

        describe(title, function () {
            afterEach(async function () {
                await RC.terminateCluster(cluster.id);
            });

            after(async function () {
                await testFactory.shutdownAll();
            });

            it('ma:required, they both know each other should connect', async function () {
                const member = await createMemberWithXML(maRequiredXML);
                const client = await testFactory.newHazelcastClientForParallelTests(createClientConfigFn(
                    './client1-key.pem', './client1-cert.pem', './server1-cert.pem', member.port
                ));
                await client.shutdown();
            });

            it('ma:required, server knows client, client does not know server should fail', async function () {
                const member = await createMemberWithXML(maRequiredXML);
                await expect(testFactory.newHazelcastClientForParallelTests(createClientConfigFn(
                    './client1-key.pem', './client1-cert.pem', './server2-cert.pem', member.port
                ))).to.be.rejectedWith(IllegalStateError);
            });

            it('ma:required, server does not know client, client knows server should fail', async function () {
                const member = await createMemberWithXML(maRequiredXML);
                await expect(testFactory.newHazelcastClientForParallelTests(createClientConfigFn(
                    './client2-key.pem', './client2-cert.pem', './server1-cert.pem', member.port
                ))).to.be.rejectedWith(IllegalStateError);
            });

            it('ma:required, neither one knows the other should fail', async function () {
                const member = await createMemberWithXML(maRequiredXML);
                await expect(testFactory.newHazelcastClientForParallelTests(createClientConfigFn(
                    './client2-key.pem', './client2-cert.pem', './server2-cert.pem', member.port
                ))).to.be.rejectedWith(IllegalStateError);
            });

            it('ma:optional, they both know each other should connect', async function () {
                const member = await createMemberWithXML(maOptionalXML);
                const client = await testFactory.newHazelcastClientForParallelTests(createClientConfigFn(
                    './client1-key.pem', './client1-cert.pem', './server1-cert.pem', member.port
                ));
                await client.shutdown();
            });

            it('ma:optional, server knows client, client does not know server should fail', async function () {
                const member = await createMemberWithXML(maOptionalXML);
                await expect(testFactory.newHazelcastClientForParallelTests(createClientConfigFn(
                    './client1-key.pem', './client1-cert.pem', './server2-cert.pem', member.port
                ))).to.be.rejectedWith(IllegalStateError);
            });

            it('ma:optional, server does not know client, client knows server should fail', async function () {
                const member = await createMemberWithXML(maOptionalXML);
                await expect(testFactory.newHazelcastClientForParallelTests(createClientConfigFn(
                    './client2-key.pem', './client2-cert.pem', './server1-cert.pem', member.port
                ))).to.be.rejectedWith(IllegalStateError);
            });

            it('ma:optional, neither knows the other should fail', async function () {
                const member = await createMemberWithXML(maOptionalXML);
                await expect(testFactory.newHazelcastClientForParallelTests(createClientConfigFn(
                    './client2-key.pem', './client2-cert.pem', './server2-cert.pem', member.port
                ))).to.be.rejectedWith(IllegalStateError);
            });
        });
    });
});
