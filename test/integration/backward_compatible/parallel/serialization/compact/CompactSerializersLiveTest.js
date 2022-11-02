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

const chai = require('chai');
chai.should();

const RC = require('../../../../RC');
const TestUtil = require('../../../../../TestUtil');
const Long = require('long');
const { Lang } = require('../../../../remote_controller/remote_controller_types');
const CompactUtil = require('./CompactUtil');

describe('CompactSerializersLiveTest', function () {
    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
        if ((await TestUtil.compareServerVersionWithRC(RC, '5.1.0')) < 0) {
            this.skip();
        }
        // Compact serialization 5.2 server is not compatible with clients older than 5.2
        if ((await TestUtil.compareServerVersionWithRC(RC, '5.2.0')) >= 0 && !TestUtil.isClientVersionAtLeast('5.2.0')) {
            this.skip();
        }
        // Compact serialization 5.2 server configuration changes
        if ((await TestUtil.compareServerVersionWithRC(RC, '5.2.0')) < 0) {
            COMPACT_ENABLED_ZERO_CONFIG_XML = COMPACT_ENABLED_ZERO_CONFIG_XML
            .replace('<compact-serialization/>', '<compact-serialization enabled="true"/>');
            COMPACT_ENABLED_WITH_SERIALIZER_XML = COMPACT_ENABLED_WITH_SERIALIZER_XML_BETA;
        }
    });

    const testFactory = new TestUtil.TestFactory();

    let COMPACT_ENABLED_ZERO_CONFIG_XML = `
        <hazelcast xmlns="http://www.hazelcast.com/schema/config"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.hazelcast.com/schema/config
            http://www.hazelcast.com/schema/config/hazelcast-config-5.0.xsd">
            <network>
                <port>0</port>
            </network>
            <serialization>
                <compact-serialization/>
            </serialization>
        </hazelcast>
    `;

    const COMPACT_ENABLED_WITH_SERIALIZER_XML_BETA = `
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
                                <class type-name="example.serialization.EmployeeDTO"
                                            serializer="example.serialization.EmployeeDTOSerializer">
                                    example.serialization.EmployeeDTO
                                </class>
                            </registered-classes>
                    </compact-serialization>
                </serialization>
            </hazelcast>
        `;

    let COMPACT_ENABLED_WITH_SERIALIZER_XML = `
            <hazelcast xmlns="http://www.hazelcast.com/schema/config"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.hazelcast.com/schema/config
                http://www.hazelcast.com/schema/config/hazelcast-config-5.0.xsd">
                <network>
                    <port>0</port>
                </network>
                <serialization>
                    <compact-serialization>
                        <serializers>
                            <serializer>example.serialization.EmployeeDTOSerializer</serializer>
                        </serializers>
                    </compact-serialization>
                </serialization>
            </hazelcast>
        `;

    [
        {name: 'Explicit config', config: COMPACT_ENABLED_WITH_SERIALIZER_XML},
        {name: 'Zero config', config: COMPACT_ENABLED_ZERO_CONFIG_XML}
    ].forEach(({name, config}) => {
        describe(`CompactSerializers with config: ${name}`, function () {
            let cluster;
            let client;
            let mapName;

            before(async function () {
                cluster = await testFactory.createClusterForParallelTests(undefined, config);
                const member = await RC.startMember(cluster.id);
                client = await testFactory.newHazelcastClientForParallelTests({
                    clusterName: cluster.id,
                    serialization: {
                        compact: {
                            serializers: [new CompactUtil.EmployeeDTOSerializer()]
                        }
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
                // Test result can be changed by configuration
                if (name == 'Zero config') {
                    value.should.be.instanceof(CompactUtil.EmployeeDTO);
                    value.age.should.be.equal(expectedAge);
                    value.id.equals(expectedId).should.be.true;
                } else {
                    value.schema.typeName.should.be.equal('employee');
                    value.values['age'].should.be.equal(expectedAge);
                    value.values['id'].equals(expectedId).should.be.true;
                }
            });

            it('should write correct data', async function() {
                const expectedAge = 23;
                const expectedId = Long.fromNumber(456);

                const map = await client.getMap(mapName);
                await map.set(1, new CompactUtil.EmployeeDTO(expectedAge, expectedId));

                const script = `
                    var map = instance_0.getMap("${mapName}");
                    var value = map.get(1.0);
                    result = value.getClass().getName() + value.age.toString() + value.id.toString();
                `;
                const response = await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);

                const resultString = response.result.toString();
                // due to class loader, server gets the class object itself not generic record
                resultString.should.be.eq('example.serialization.EmployeeDTO23456');
            });
        });
    });
});

