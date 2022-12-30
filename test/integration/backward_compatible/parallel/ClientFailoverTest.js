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
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const RC = require('../../RC');
const {
    ClientOfflineError,
    InvalidConfigurationError,
    IllegalStateError,
    Client
} = require('../../../../lib');
const { deferredPromise } = require('../../../../lib/util/Util');
const TestUtil = require('../../../TestUtil');

function createClusterConfig({ clusterName, partitionCount }) {
    partitionCount = partitionCount || 271;
    return `<?xml version="1.0" encoding="UTF-8"?>
            <hazelcast xmlns="http://www.hazelcast.com/schema/config"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.hazelcast.com/schema/config
                http://www.hazelcast.com/schema/config/hazelcast-config-4.0.xsd">
                <cluster-name>${clusterName}</cluster-name>
                <properties>
                    <property name="hazelcast.partition.count">${partitionCount}</property>
                </properties>
                <network>
                    <port>0</port>
                </network>
            </hazelcast>`;
}

function createClientConfig({ clusterName, lifecycleListener, connectTimeoutMs, clusterMembers }) {
    const config = {
        clusterName: clusterName,
    };

    if (clusterMembers !== undefined) {
        config.network = { clusterMembers };
    }
    if (lifecycleListener !== undefined) {
        config.lifecycleListeners = [lifecycleListener];
    }
    if (connectTimeoutMs !== undefined) {
        config.connectionStrategy = {
            connectionRetry: {
                clusterConnectTimeoutMillis: connectTimeoutMs
            }
        };
    }
    return config;
}

const testFactory = new TestUtil.TestFactory();

/**
 * Tests blue/green failover support for OSS.
 */
describe('ClientFailoverTest - community', function () {
    let member;

    before(function () {
        TestUtil.markCommunity(this);
        TestUtil.markClientVersionAtLeast(this, '4.1');
    });

    beforeEach(async function () {
        const cluster1 = await testFactory.createClusterKeepClusterNameForParallelTests(null,
            createClusterConfig({ clusterName: 'dev1' }));
        member = await RC.startMember(cluster1.id);
        await testFactory.createClusterKeepClusterNameForParallelTests(null,
            createClusterConfig({ clusterName: 'dev2' }));
    });

    afterEach(async function () {
        await testFactory.shutdownAll();
    });

    it('should reject when connecting to community cluster', async function () {
        await expect(testFactory.newHazelcastFailoverClientForParallelTests({
            tryCount: 1,
            clientConfigs: [
                createClientConfig({ clusterName: 'dev1', clusterMembers: [`127.0.0.1:${member.port}`] }),
                createClientConfig({ clusterName: 'dev2', clusterMembers: [`127.0.0.1:${member.port}`] })
            ]
        })).to.be.rejectedWith(IllegalStateError);
    });
});

/**
 * Tests blue/green failover support for EE.
 */
describe('ClientFailoverTest - enterprise', function () {
    let cluster1;
    let member1;
    let member2;
    let client;

    before(function () {
        TestUtil.markEnterprise(this);
        TestUtil.markClientVersionAtLeast(this, '4.1');
    });

    beforeEach(async function () {
        cluster1 = await testFactory.createClusterKeepClusterNameForParallelTests(null,
            createClusterConfig({ clusterName: 'dev1' }));
        member1 = await RC.startMember(cluster1.id);
        const cluster2 = await testFactory.createClusterKeepClusterNameForParallelTests(null,
            createClusterConfig({ clusterName: 'dev2' }));
        member2 = await RC.startMember(cluster2.id);
    });

    afterEach(async function () {
        await testFactory.shutdownAll();
    });

    it('should be able to connect to enterprise cluster', async function () {
        client = await testFactory.newHazelcastFailoverClientForParallelTests({
            tryCount: 1,
            clientConfigs: [
                createClientConfig({
                    clusterName: 'dev1', clusterMembers: [`127.0.0.1:${member1.port}`]
                })
            ]
        });
    });

    it('should shut down when tryCount is reached', async function () {
        // shut down dev1, but keep dev2 alive
        await RC.terminateCluster(cluster1.id);

        // should not switch to the alive cluster, but instead fail
        await expect(testFactory.newHazelcastFailoverClientForParallelTests({
            tryCount: 0, // no retries
            clientConfigs: [
                createClientConfig({
                    clusterName: 'dev1',
                    connectTimeoutMs: 1000,
                    clusterMembers: [`127.0.0.1:${member1.port}`]
                }),
                createClientConfig({
                    clusterName: 'dev2',
                    connectTimeoutMs: 1000,
                    clusterMembers: [`127.0.0.1:${member2.port}`]
                })
            ]
        })).to.be.rejectedWith(IllegalStateError);
    });

    it('should retry read ops when switched to next cluster', async function () {
        let clusterChanged = false;
        const clusterChangedDeferred = deferredPromise();
        const lifecycleListener = (state) => {
            if (state === 'CHANGED_CLUSTER') {
                clusterChangedDeferred.resolve();
                clusterChanged = true;
            }
        };
        client = await testFactory.newHazelcastFailoverClientForParallelTests({
            tryCount: 1,
            clientConfigs: [
                createClientConfig({
                    clusterName: 'dev1',
                    lifecycleListener,
                    connectTimeoutMs: 1000,
                    clusterMembers: [`127.0.0.1:${member1.port}`]
                }),
                createClientConfig({
                    clusterName: 'dev2',
                    lifecycleListener,
                    connectTimeoutMs: 1000,
                    clusterMembers: [`127.0.0.1:${member2.port}`]
                })
            ]
        });

        const map = await client.getMap('test');
        let getErr;
        const getFn = () => {
            map.get('foo')
                .then(() => {
                    if (!clusterChanged) {
                        getFn();
                    }
                })
                .catch((err) => {
                    getErr = err;
                });
        };
        process.nextTick(getFn);
        await RC.terminateCluster(cluster1.id);
        await clusterChangedDeferred.promise;

        expect(getErr).to.be.undefined;
        expect(client.getCluster().getMembers()).to.have.lengthOf(1);
        expect(client.getCluster().getMembers()[0].uuid.toString()).to.be.equal(member2.uuid);
    });

    it('should reject with offline error when retrying read ops while switching in async mode', async function () {
        const config = createClientConfig({
            clusterName: 'dev1',
            connectTimeoutMs: 1000,
            clusterMembers: [`127.0.0.1:${member1.port}`]
        });
        config.connectionStrategy.reconnectMode = 'ASYNC';
        client = await testFactory.newHazelcastFailoverClientForParallelTests({
            // default tryCount is Number.MAX_SAFE_INTEGER
            clientConfigs: [config]
        });

        const map = await client.getMap('test');
        const getErrDeferred = deferredPromise();
        let getErr;
        const getFn = () => {
            map.get('foo')
                .then(getFn)
                .catch((err) => {
                    getErr = err;
                    getErrDeferred.resolve();
                });
        };
        process.nextTick(getFn);
        await RC.terminateCluster(cluster1.id);
        await getErrDeferred.promise;

        expect(getErr).to.be.instanceOf(ClientOfflineError);
    });

    it('should shutdown when switching to cluster with different partition count', async function () {
        const cluster3 = await testFactory.createClusterKeepClusterNameForParallelTests(null,
            createClusterConfig({ clusterName: 'dev3', partitionCount: 42 }));
        const member3 = await RC.startMember(cluster3.id);

        const shutdownTriggeredDeferred = deferredPromise();
        const lifecycleListener = (state) => {
            if (state === 'SHUTDOWN') {
                shutdownTriggeredDeferred.resolve();
            }
        };
        client = await testFactory.newHazelcastFailoverClientForParallelTests({
            tryCount: 1,
            clientConfigs: [
                createClientConfig({
                    clusterName: 'dev1',
                    lifecycleListener,
                    connectTimeoutMs: 1000,
                    clusterMembers: [`127.0.0.1:${member1.port}`]
                }),
                createClientConfig({
                    clusterName: 'dev3',
                    lifecycleListener,
                    connectTimeoutMs: 1000,
                    clusterMembers: [`127.0.0.1:${member3.port}`]
                })
            ]
        });

        expect(client.getCluster().getMembers()).to.have.lengthOf(1);
        expect(client.getCluster().getMembers()[0].uuid.toString()).to.be.equal(member1.uuid);

        await RC.terminateCluster(cluster1.id);

        await shutdownTriggeredDeferred.promise;
    });

    it('should throw when starting with invalid failover config', function () {
        expect(() => Client.newHazelcastFailoverClient({
            tryCount: 1,
            clientConfigs: [
                {
                    clusterName: 'dev1',
                    backupAckToClientEnabled: true
                },
                {
                    clusterName: 'dev2',
                    // the following difference is invalid
                    backupAckToClientEnabled: false
                }
            ]
        })).to.throw(InvalidConfigurationError);
    });
});
