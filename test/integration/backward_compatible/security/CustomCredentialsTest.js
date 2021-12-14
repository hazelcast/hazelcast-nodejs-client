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
const {SimpleCredentials} = require('./SimpleCredentials');
const {IllegalStateError} = require('../../../../lib');
const {Client} = require('../../../../lib');

describe('CustomCredentialsTest', function () {
    let cluster;
    let client;

    before(async function () {
        TestUtil.markEnterprise(this);

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
            customCredentials: new SimpleCredentials('dummy-username', 'dummy-password')
        });
        expect(client.getLifecycleService().isRunning()).to.be.true;
    });

    it('should not connect with invalid custom credentials', async function () {
        await expect(Client.newHazelcastClient({
            clusterName: cluster.id,
            customCredentials: new SimpleCredentials('dummy-username', 'not-a-dummy-password'),
            connectionStrategy: {
                connectionRetry: {
                    clusterConnectTimeoutMillis: 1000
                }
            }
        })).to.be.rejectedWith(IllegalStateError);
    });
});
