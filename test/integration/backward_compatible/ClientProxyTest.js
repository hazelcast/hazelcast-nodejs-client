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
const RC = require('../RC');
const { Client } = require('../../../');

describe('ClientProxyTest', function () {
    let cluster;
    let client;

    before(async function () {
        cluster = await RC.createCluster();
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({ clusterName: cluster.id });
    });

    after(async function () {
        await client.shutdown();
        await RC.terminateCluster(cluster.id);
    });

    it('proxies with the same name should be different for different services', async function () {
        const map = await client.getMap('Furkan');
        const list = await client.getList('Furkan');

        expect(list.getServiceName()).to.be.equal('hz:impl:listService');
        expect(map.getServiceName()).to.be.equal('hz:impl:mapService');
    });
});
