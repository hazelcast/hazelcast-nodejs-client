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
chai.should();

const RC = require('../../../../RC');
const TestUtil = require('../../../../../TestUtil');

const COMPACT_ENABLED_XML = `
    <hazelcast xmlns="http://www.hazelcast.com/schema/config"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.hazelcast.com/schema/config
        http://www.hazelcast.com/schema/config/hazelcast-config-5.0.xsd">
        <network>
            <port>0</port>
        </network>
        <serialization>
            <compact-serialization enabled="true" />
        </serialization>
    </hazelcast>
`;

describe('CompactSerializersLiveTest', function () {
    let cluster;
    let client;

    const testFactory = new TestUtil.TestFactory();

    before(async function () {
        cluster = await testFactory.createClusterForParallelTests(undefined, undefined);
        const member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id
        }, member);
    });

    after(async function () {
        await testFactory.shutdownAll();
    });
});
