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
const TestUtil = require('../../../TestUtil');
const fs = require('fs');
const RC = require('../../RC');
const {IllegalStateError} = require('../../../../lib');
const {SimpleCredentials} = require('./SimpleCredentials');
const {TokenEncoding} = require('../../../../lib/security/TokenEncoding');
const {Client} = require('../../../../lib');

describe('SecurityTest', function () {
    describe('username password credentials', function () {
        let cluster;
        let client;

        before(async function () {
            TestUtil.markEnterprise(this);
            TestUtil.markClientVersionAtLeast(this, '4.2.1');

            cluster = await RC.createCluster(null,
                fs.readFileSync(__dirname + '/hazelcast_username_password_credentials.xml', 'utf8'));
            await RC.startMember(cluster.id);
        });

        after(async function () {
            if (!cluster) {
                return;
            }
            await RC.terminateCluster(cluster.id);
        });

        afterEach(async function () {
            if (!client) {
                return;
            }
            await client.shutdown();
            client = null;
        });

        it('should connect with valid username and password', async function () {
            client = await Client.newHazelcastClient({
                clusterName: cluster.id,
                security: {
                    usernamePassword: {
                        username: 'dummy-username',
                        password: 'dummy-password',
                    }
                }
            });
            expect(client.getLifecycleService().isRunning()).to.be.true;
        });

        it('should not connect with invalid username and password', async function () {
            await expect(Client.newHazelcastClient({
                clusterName: cluster.id,
                security: {
                    usernamePassword: {
                        username: 'dummy-username',
                        password: 'not-a-dummy-password',
                    }
                },
                connectionStrategy: {
                    connectionRetry: {
                        clusterConnectTimeoutMillis: 1000
                    }
                }
            })).to.be.rejectedWith(IllegalStateError);
        });
    });

    describe('token credentials', function () {
        let cluster;
        let client;

        before(async function () {
            TestUtil.markEnterprise(this);
            TestUtil.markClientVersionAtLeast(this, '4.2.1');

            cluster = await RC.createCluster(null,
                fs.readFileSync(__dirname + '/hazelcast_token_credentials.xml', 'utf8'));
            await RC.startMember(cluster.id);
        });

        after(async function () {
            if (!cluster) {
                return;
            }
            await RC.terminateCluster(cluster.id);
        });

        afterEach(async function () {
            if (!client) {
                return;
            }
            await client.shutdown();
            client = null;
        });

        it('should connect with valid token', async function () {
            client = await Client.newHazelcastClient({
                clusterName: cluster.id,
                security: {
                    token: {
                        token: 'dG9rZW4=',
                        encoding: TokenEncoding.BASE64
                    }
                }
            });
            expect(client.getLifecycleService().isRunning()).to.be.true;
        });

        it('should not connect with invalid token', async function () {
            await expect(Client.newHazelcastClient({
                clusterName: cluster.id,
                security: {
                    token: {
                        token: 'dG9rZW4=',
                        encoding: TokenEncoding.ASCII
                    }
                },
                connectionStrategy: {
                    connectionRetry: {
                        clusterConnectTimeoutMillis: 1000
                    }
                }
            })).to.be.rejectedWith(IllegalStateError);
        });
    });

    describe('custom credentials', function () {
        let cluster;
        let client;

        before(async function () {
            TestUtil.markEnterprise(this);
            TestUtil.markClientVersionAtLeast(this, '4.2.1');

            cluster = await RC.createCluster(null,
                fs.readFileSync(__dirname + '/hazelcast_custom_credentials.xml', 'utf8'));
            await RC.startMember(cluster.id);
        });

        after(async function () {
            if (!cluster) {
                return;
            }
            await RC.terminateCluster(cluster.id);
        });

        afterEach(async function () {
            if (!client) {
                return;
            }
            await client.shutdown();
            client = null;
        });

        it('should connect with valid custom credentials', async function () {
            client = await Client.newHazelcastClient({
                clusterName: cluster.id,
                security: {
                    custom: new SimpleCredentials('dummy-username', 'dummy-password'),
                }
            });
            expect(client.getLifecycleService().isRunning()).to.be.true;
        });

        it('should not connect with invalid custom credentials', async function () {
            await expect(Client.newHazelcastClient({
                clusterName: cluster.id,
                security: {
                    custom: new SimpleCredentials('dummy-username', 'not-a-dummy-password'),
                },
                connectionStrategy: {
                    connectionRetry: {
                        clusterConnectTimeoutMillis: 1000
                    }
                }
            })).to.be.rejectedWith(IllegalStateError);
        });
    });
});
