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
const path = require('path');

const RC = require('../../RC');
const { Client, ConsistencyLostError } = require('../../../../');

describe('PNCounterConsistencyTest', function () {

    let cluster;
    let client;

    beforeEach(async function () {
        cluster = await RC.createCluster(null,
            fs.readFileSync(path.resolve(__dirname, 'hazelcast_crdtreplication_delayed.xml'), 'utf8'));
        await RC.startMember(cluster.id);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    afterEach(async function () {
        await client.shutdown();
        return RC.terminateCluster(cluster.id);
    });

    it('target replica killed, no replica is up-to-date, get operation throws ConsistencyLostError', async function () {
        const pnCounter = await client.getPNCounter('pncounter');
        await pnCounter.getAndAdd(3);
        const currentReplicaAddress = pnCounter.currentTargetReplicaAddress;
        await RC.terminateMember(cluster.id, currentReplicaAddress.uuid.toString());

        await expect(pnCounter.addAndGet(10)).to.be.rejectedWith(ConsistencyLostError);
    });

    it('target replica killed, no replica is up-to-date, get operation proceeds after calling reset', async function () {
        const pnCounter = await client.getPNCounter('pncounter');
        await pnCounter.getAndAdd(3);
        const currentReplicaAddress = pnCounter.currentTargetReplicaAddress;
        await RC.terminateMember(cluster.id, currentReplicaAddress.uuid.toString());
        await pnCounter.reset();
        await pnCounter.addAndGet(10);
    });
});
