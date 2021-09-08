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

const { expect } = require('chai');
const RC = require('../../../RC');
const TestUtil = require('../../../../TestUtil');

describe('RepairingTask', function () {
    let cluster;
    let client;
    let member;

    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        cluster = await testFactory.createClusterForParallelTest();
        member = await RC.startMember(cluster.id);
    });

    afterEach(async function () {
        if (client != null) {
            await client.shutdown();
        }
    });

    after(async function () {
        await testFactory.cleanUp();
    });

    async function startClientWithReconciliationInterval(interval) {
        client = await testFactory.newHazelcastClientForParallelTest({
            clusterName: cluster.id,
            nearCaches: {
                'test': {}
            },
            properties: {
                'hazelcast.invalidation.reconciliation.interval.seconds': interval
            }
        }, member);
    }

    it('throws when reconciliation interval is set to below 30 seconds', async function () {
        await startClientWithReconciliationInterval(2);
        return expect(client.getRepairingTask.bind(client)).to.throw();
    });

    it('reconciliation interval is used when set to 50', async function () {
        await startClientWithReconciliationInterval(50);
        return expect(client.getRepairingTask().reconcilliationInterval).to.equal(50000);
    });

    it('no reconciliation task is run when interval is set to 0', async function () {
        await startClientWithReconciliationInterval(0);
        return expect(client.getRepairingTask().antientropyTaskHandle).to.be.undefined;
    });
});
