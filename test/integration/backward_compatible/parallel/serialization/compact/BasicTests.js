/* eslint-disable */
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
const Long = require('long');
const { Predicates } = require('../../../../../../lib/core');
const { EmployeeDTOSerializer, EmployeeDTO } = require('./Employee');

describe('CompactBasicTests', function () {

    const testFactory = new TestUtil.TestFactory();

    let cluster;
    let client, client2;
    let mapName;
    let member;
    const COMPACT_ENABLED_ZERO_CONFIG_XML = `
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


    before(async function () {
        cluster = await testFactory.createClusterForParallelTests(undefined, COMPACT_ENABLED_ZERO_CONFIG_XML);
        member = await RC.startMember(cluster.id);
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new EmployeeDTOSerializer()]
            }
        }, member);

        client2 = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new EmployeeDTOSerializer()]
            }
        }, member);
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    beforeEach(() => {
        mapName = TestUtil.randomString(10);
    });

    it('should work with basic test', async function() {
        const employee = new EmployeeDTO(30, Long.fromString('102310312'));
        const map = await client.getMap(mapName);
        await map.put(1, employee);

        const map2 = await client2.getMap(mapName);
        const employee2 = await map2.get(1);

        employee2.should.deep.equal(employee);
    });

    it('should work with basic query', async function() {
        const map = await client.getMap(mapName);

        for (let i = 0; i < 100; i++) {
            const employee = new EmployeeDTO(i, Long.fromString('102310312'));
            await map.put(i, employee);
        }

        const map2 = await client2.getMap(mapName);
        const size = (await map2.keySetWithPredicate(Predicates.sql('age > 19'))).length;

        size.should.be.equal(80);
    });
});

