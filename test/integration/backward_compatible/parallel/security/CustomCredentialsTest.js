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
const TestUtil = require('../../../../TestUtil');
const fs = require('fs');
const RC = require('../../../RC');
const {SimpleCredentials} = require('./SimpleCredentials');
const {IllegalStateError} = require('../../../../../lib');

describe('CustomCredentialsTest', function () {
    let cluster;
    let member;
    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        TestUtil.markEnterprise(this);

        cluster = await testFactory.createClusterForParallelTests(null,
            fs.readFileSync(__dirname + '/hazelcast_custom_credentials.xml', 'utf8'));
        member = await RC.startMember(cluster.id);
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    afterEach(async function () {
        await testFactory.shutdownAllClients();
    });

    it('should connect with valid custom credentials', async function () {
        const client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            customCredentials: new SimpleCredentials('dummy-username', 'dummy-password')
        }, member);
        expect(client.getLifecycleService().isRunning()).to.be.true;
    });

    it('should not connect with invalid custom credentials', async function () {
        await expect(testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            customCredentials: new SimpleCredentials('dummy-username', 'not-a-dummy-password'),
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: 1000
                }
            }
        }, member)).to.be.rejectedWith(IllegalStateError);
    });
});
