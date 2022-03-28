/* eslint-disable mocha/no-skipped-tests */
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

const { Lang } = require('../../../remote_controller/remote_controller_types');
const RC = require('../../../RC');
const TestUtil = require('../../../../TestUtil');
const CompactUtil = require('../serialization/compact/CompactUtil');

const chai = require('chai');
const { HazelcastSqlException } = require('../../../../../lib');

chai.should();

describe('CompactSqlTest', function () {
    let client;
    let cluster;
    let member;
    let someMap;
    let mapName;

    const testFactory = new TestUtil.TestFactory();
    const COMPACT_AND_JET_ENABLED_WITH_SERIALIZER_CONFIG = `
        <hazelcast xmlns="http://www.hazelcast.com/schema/config"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.hazelcast.com/schema/config
            http://www.hazelcast.com/schema/config/hazelcast-config-5.0.xsd">
            <network>
                <port>0</port>
            </network>
            <serialization>
                <compact-serialization enabled="true">
                        <registered-classes>
                        <class
                            type-name="example.serialization.EmployeeDTO"
                            serializer="example.serialization.EmployeeDTOSerializer"
                            >
                            example.serialization.EmployeeDTO
                        </class>
                </registered-classes>
                </compact-serialization>
            </serialization>
            <jet enabled="true"></jet>
        </hazelcast>
    `;

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
        cluster = await testFactory.createClusterForParallelTests(null, COMPACT_AND_JET_ENABLED_WITH_SERIALIZER_CONFIG);
        member = await RC.startMember(cluster.id);
    });

    afterEach(async function () {
        if (someMap) {
            await someMap.clear();
        }
        if (client) {
            await client.shutdown();
        }
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    it('should throw an error when compact is used, schema is not known and lazy deserialization is used', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compact: {
                    serializers: [new CompactUtil.EmployeeSerializer()]
                }
            }
        }, member);
        TestUtil.markServerVersionAtLeast(this, client, '5.0');
        mapName = TestUtil.randomString(10);
        someMap = await client.getMap(mapName);

        await TestUtil.createMappingForCompact(
            'double',
            {age: 'integer', id: 'bigint'},
            client,
            mapName,
            'EmployeeDTO'
        );

        await RC.executeOnController(cluster.id, `
            var someMap = instance_0.getMap('${mapName}');
            var EmployeeDTO = Java.type('example.serialization.EmployeeDTO');
            someMap.put(0.0, new EmployeeDTO(12, 1));
            someMap.put(1.0, new EmployeeDTO(15, 2));
            someMap.put(2.0, new EmployeeDTO(17, 3));
        `, Lang.JAVASCRIPT);

        const result = await TestUtil.getSql(client).execute(`SELECT this FROM ${mapName}`, undefined, {
            returnRawResult: true
        });

        for await (const row of result) {
            (() => row.getObject('this')).should.throw(HazelcastSqlException,
                'You tried to deserialize an SQL row which includes a compact serializable object');
        }
    });

    it('should work when compact is used, schema is not known and lazy deserialization is not used', async function () {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compact: {
                    serializers: [new CompactUtil.EmployeeSerializer()]
                }
            }
        }, member);
        TestUtil.markServerVersionAtLeast(this, client, '5.0');
        mapName = TestUtil.randomString(10);
        someMap = await client.getMap(mapName);

        await TestUtil.createMappingForCompact(
            'double',
            {age: 'integer', id: 'bigint'},
            client,
            mapName,
            'EmployeeDTO'
        );

        await RC.executeOnController(cluster.id, `
            var someMap = instance_0.getMap('${mapName}');
            var EmployeeDTO = Java.type('example.serialization.EmployeeDTO');
            someMap.put(0.0, new EmployeeDTO(12, 1));
            someMap.put(1.0, new EmployeeDTO(15, 2));
            someMap.put(2.0, new EmployeeDTO(17, 3));
        `, Lang.JAVASCRIPT);

        const result = await TestUtil.getSql(client).execute(`SELECT this FROM ${mapName}`, undefined);

        // eslint-disable-next-line no-unused-vars
        for await (const row of result) {
            // no-op
        }
    });
});

