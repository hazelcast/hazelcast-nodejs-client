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
const { CompactSerializer, CompactReader, CompactWriter } = require('../../../../../../lib');
const Long = require('long');
const { Lang } = require('../../../../remote_controller/remote_controller_types');

describe('CompactSerialization', function () {

    class EmployeeDTO {
        constructor(age, id) {
            this.age = age; // int32
            this.id = id; // int64
        }
    }

    class EmployeeDTOSerializer {
        constructor() {
            this.hzClassName = 'EmployeeDTO'; // used to match a js object to serialize with this serializer
            this.hzTypeName = 'example.serialization.EmployeeDTO'; // used to match schema's typeName with serializer
        }

        read(reader) {
            const age = reader.readInt32('age');
            const id = reader.readInt64('id');
            return new EmployeeDTO(age, id);
        }

        write(writer, instance) {
            writer.writeInt32('age', instance.age);
            writer.writeInt64('id', instance.id);
        }
    }

    const testFactory = new TestUtil.TestFactory();

    describe('CompactSerializers with Server No Config Test', function () {

        let cluster;
        let client;
        let mapName;
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
            const member = await RC.startMember(cluster.id);
            client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [new EmployeeDTOSerializer()]
                }
            }, member);
            mapName = TestUtil.randomString(10);
        });

        after(async function () {
            await testFactory.shutdownAll();
        });

        it('should read server side data', async function() {
            const expectedAge = 23;
            const expectedId = 456;

            const script = `
                var EmployeeDTO = Java.type('example.serialization.EmployeeDTO');
                var map = instance_0.getMap("${mapName}");
                map.set(1.0, new EmployeeDTO(${expectedAge}, ${expectedId}));
            `;
            await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
            const map = await client.getMap(mapName);
            const value = await map.get(1);
            value.should.be.instanceof(EmployeeDTO);
            value.age.should.be.equal(expectedAge);
            value.id.equals(expectedId).should.be.true;
        });

        it('should write correct data', async function() {
            const expectedAge = 23;
            const expectedId = Long.fromNumber(456);

            const map = await client.getMap(mapName);
            await map.set(1, new EmployeeDTO(expectedAge, expectedId));

            const script = `
                var map = instance_0.getMap("${mapName}");
                var value = map.get(1.0);
                result = value.getInt32("age").toString() + value.getInt64("id").toString();
            `;
            const response = await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);

            const resultString = response.result.toString();

            resultString.should.be.eq('23456');
        });
    });

    describe('CompactSerializers with Server Explicit Config Test', function () {

        let cluster;
        let client;
        let mapName;

        const COMPACT_ENABLED_WITH_SERIALIZER_XML = `
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
                            <class type-name="example.serialization.EmployeeDTO" serializer="example.serialization.EmployeeDTOSerializer">
                                example.serialization.EmployeeDTO
                            </class>
                    </registered-classes>
                    </compact-serialization>
                </serialization>
            </hazelcast>
        `;

        before(async function () {
            cluster = await testFactory.createClusterForParallelTests(undefined, COMPACT_ENABLED_WITH_SERIALIZER_XML);
            const member = await RC.startMember(cluster.id);
            client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [new EmployeeDTOSerializer()]
                }
            }, member);
            mapName = TestUtil.randomString(10);
        });

        after(async function () {
            await testFactory.shutdownAll();
        });

        it('should read server side compact data', async function() {
            const expectedAge = 23;
            const expectedId = 456;

            const script = `
                var EmployeeDTO = Java.type('example.serialization.EmployeeDTO');
                var map = instance_0.getMap("${mapName}");
                map.set(1.0, new EmployeeDTO(${expectedAge}, ${expectedId}));
            `;
            await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
            const map = await client.getMap(mapName);
            const value = await map.get(1);
            value.should.be.instanceof(EmployeeDTO);
            value.age.should.be.equal(expectedAge);
            value.id.equals(expectedId).should.be.true;
        });

        it('should write correct data', async function() {
            const expectedAge = 23;
            const expectedId = Long.fromNumber(456);

            const map = await client.getMap(mapName);
            await map.set(1, new EmployeeDTO(expectedAge, expectedId));

            const script = `
                var map = instance_0.getMap("${mapName}");
                var value = map.get(1.0);
                result = value.class.toString();
            `;
            const response = await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);

            const resultString = response.result.toString();

            resultString.should.be.eq('23456');
        });
    });
});

