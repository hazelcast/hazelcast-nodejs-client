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

const { expect } = require('chai');
const RC = require('../../RC');
const TestUtil = require('../../../TestUtil');

describe('ClientLabelTest', function () {
    let cluster;
    let client;
    let member;

    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        cluster = await testFactory.createClusterForParallelTests();
        member = await RC.startMember(cluster.id);
    });

    afterEach(async function () {
        await client.shutdown();
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('labels should be received on member side', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            clientLabels: ['testLabel']
        }, member);

        const script = 'var client = instance_0.getClientService().getConnectedClients().iterator().next();\n' +
            'result = client.getLabels().iterator().next();\n';
        const res = await RC.executeOnController(cluster.id, script, 1);
        expect(res.result).to.not.be.null;
        expect(res.result.toString()).to.equal('testLabel');
    });
});
