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
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const RC = require('../../RC');
const { Client } = require('../../../../lib');
const { LifecycleServiceImpl } = require('../../../../lib/LifecycleService');
const { RepairingTask } = require('../../../../lib/nearcache/RepairingTask');
const { NearCacheManager } = require('../../../../lib/nearcache/NearCacheManager');
const { ProxyManager } = require('../../../../lib/proxy/ProxyManager');
const { Statistics } = require('../../../../lib/statistics/Statistics');
const { CPSubsystemImpl } = require('../../../../lib/CPSubsystem');
const { ConnectionManager } = require('../../../../lib/network/ConnectionManager');
const { InvocationService } = require('../../../../lib/invocation/InvocationService');
const TestUtil = require('../../../TestUtil');

describe('ClientShutdownTest', function () {
    let cluster;
    const testFactory = new TestUtil.TestFactory();

    afterEach(async function () {
        sandbox.restore();
        await testFactory.cleanUp();
    });

    it('client should call shutdown on failed start', async function () {
        sandbox.spy(Client.prototype, 'shutdown');

        await expect(testFactory.newHazelcastClientForParallelTest({
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: 100,
                    initialBackoffMillis: 100
                }
            }
        })).to.be.rejected;

        expect(Client.prototype.shutdown.calledOnce).to.be.true;
    });

    it('client should stop services and release resources on shutdown', async function () {
        sandbox.spy(LifecycleServiceImpl.prototype, 'onShutdownStart');
        sandbox.spy(LifecycleServiceImpl.prototype, 'onShutdownFinished');
        sandbox.spy(RepairingTask.prototype, 'shutdown');
        sandbox.spy(NearCacheManager.prototype, 'destroyAllNearCaches');
        sandbox.spy(ProxyManager.prototype, 'destroy');
        sandbox.spy(Statistics.prototype, 'stop');
        sandbox.spy(CPSubsystemImpl.prototype, 'shutdown');
        sandbox.spy(ConnectionManager.prototype, 'shutdown');
        sandbox.spy(InvocationService.prototype, 'shutdown');

        cluster = await testFactory.createClusterForParallelTest();
        const member = await RC.startMember(cluster.id);

        const client = await testFactory.newHazelcastClientForParallelTest({
            clusterName: cluster.id
        }, member);
        // force ReparingTask initialization
        client.getRepairingTask();
        await client.shutdown();

        expect(LifecycleServiceImpl.prototype.onShutdownStart.calledOnce).to.be.true;
        expect(LifecycleServiceImpl.prototype.onShutdownFinished.calledOnce).to.be.true;
        expect(RepairingTask.prototype.shutdown.calledOnce).to.be.true;
        expect(NearCacheManager.prototype.destroyAllNearCaches.calledOnce).to.be.true;
        expect(ProxyManager.prototype.destroy.calledOnce).to.be.true;
        expect(Statistics.prototype.stop.calledOnce).to.be.true;
        expect(CPSubsystemImpl.prototype.shutdown.calledOnce).to.be.true;
        expect(ConnectionManager.prototype.shutdown.calledOnce).to.be.true;
        expect(InvocationService.prototype.shutdown.calledOnce).to.be.true;
    });
});
