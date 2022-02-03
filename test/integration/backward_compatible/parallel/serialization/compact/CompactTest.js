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
const { EmployeeDTOSerializer } = require('./CompactUtil');
const { CompactStreamSerializer } = require('../../../../../../lib/serialization/compact/CompactStreamSerializer');

describe('CompactTest', function () {
    const getCompactUtil = () => require('./CompactUtil');
    const getFieldKind = () => require('../../../../../../lib/serialization/generic_record/FieldKind').FieldKind;
    let compactUtil;
    let fieldKind;

    const testFactory = new TestUtil.TestFactory();

    let cluster;
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
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
        compactUtil = getCompactUtil();
        fieldKind = getFieldKind();
        cluster = await testFactory.createClusterForParallelTests(undefined, COMPACT_ENABLED_ZERO_CONFIG_XML);
        member = await RC.startMember(cluster.id);
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    afterEach(async function () {
        await testFactory.shutdownAllClients();
    });

    beforeEach(function () {
        mapName = TestUtil.randomString(10);
    });

    const shouldReadAndWrite = async (obj, serializers) => {
        const client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: serializers
            }
        }, member);

        const client2 = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: serializers
            }
        }, member);

        const map = await client.getMap(mapName);
        await map.put(1, obj);

        const map2 = await client2.getMap(mapName);
        const readObj = await map2.get(1);

        readObj.should.deep.equal(obj);
    };

    it('should work with basic test', async function () {
        await shouldReadAndWrite(
            new compactUtil.EmployeeDTO(30, Long.fromString('102310312')), [new compactUtil.EmployeeDTOSerializer()]
        );
    });

    it('should be able to read and write all fields', async function () {
        await shouldReadAndWrite(
            new compactUtil.Flexible(compactUtil.referenceObjects),
            [new compactUtil.FlexibleSerializer(compactUtil.supportedFieldKinds), new compactUtil.EmployeeSerializer()]
        );
    });

    it('should be able to read and write empty class', async function () {
        // Clear serializer list
        CompactStreamSerializer.classNameToSerializersMap.clear();
        await shouldReadAndWrite(new compactUtil.Flexible({}), []);
    });

    it('should be able to read and write class with only variable size fields', async function () {
        const fields = {};
        for (const field of compactUtil.varSizeFields) {
            const fieldName = fieldKind[field];
            fields[fieldName] = compactUtil.referenceObjects[fieldName];
        }
        await shouldReadAndWrite(
            new compactUtil.Flexible(fields),
            [new compactUtil.FlexibleSerializer(compactUtil.varSizeFields), new compactUtil.EmployeeSerializer()]
        );
    });

    it('should be able to read and write class with only fixed size fields', async function () {
        const fields = {};
        for (const field of compactUtil.fixedSizeFields) {
            const fieldName = fieldKind[field];
            fields[fieldName] = compactUtil.referenceObjects[fieldName];
        }
        await shouldReadAndWrite(
            new compactUtil.Flexible(fields),
            [new compactUtil.FlexibleSerializer(compactUtil.fixedSizeFields), new compactUtil.EmployeeSerializer()]
        );
    });

    [['small', 1], ['medium', 20], ['large', 42]].forEach(([size, elementCount]) => {
        it(`should read and write ${size} object`, async function () {
            const referenceObjects = {
                [fieldKind[fieldKind.ARRAY_OF_STRING]]: new Array(elementCount).fill(0)
                    .map(i => TestUtil.randomString((i + 1) * 100)),
                [fieldKind[fieldKind.INT32]]: 32,
                [fieldKind[fieldKind.STRING]]: 'test',
            };

            referenceObjects[fieldKind[fieldKind.ARRAY_OF_STRING]].push(null);
            await shouldReadAndWrite(
                new compactUtil.Flexible(referenceObjects),
                [new compactUtil.FlexibleSerializer([fieldKind.ARRAY_OF_STRING, fieldKind.INT32, fieldKind.STRING])]
            );
        });
    });

    [0, 1, 8, 10, 100, 1000].forEach((elementCount) => {
        it(`should read and write bool array with size ${elementCount}`, async function () {
            const referenceObjects = {
                [fieldKind[fieldKind.ARRAY_OF_BOOLEAN]]: new Array(elementCount).fill(0).map(() => Math.random() > 0.5),
            };

            await shouldReadAndWrite(
                new compactUtil.Flexible(referenceObjects), [new compactUtil.FlexibleSerializer([fieldKind.ARRAY_OF_BOOLEAN])]
            );
        });

        it(`should read and write bool array with size ${elementCount}`, async function () {
            const referenceObjects = {
                [fieldKind[fieldKind.ARRAY_OF_BOOLEAN]]: new Array(elementCount).fill(0).map(() => Math.random() > 0.5),
            };

            await shouldReadAndWrite(
                new compactUtil.Flexible(referenceObjects), [new compactUtil.FlexibleSerializer([fieldKind.ARRAY_OF_BOOLEAN])]
            );
        });

        it('should read and write with multiple boolean fields', async function () {
            const allFields = {};
            const fieldNames = new Array(elementCount);
            for (let i = 0; i < elementCount; i++) {
                allFields[i] = Math.random() > 0.5;
                fieldNames[i] = i.toString();
            }

            class Serializer {
                constructor(fieldNames) {
                    this.hzClassName = 'Flexible';
                    this.fieldNames = fieldNames;
                }

                read(reader) {
                    const fields = {};
                    for (const fieldName of this.fieldNames) {
                        fields[fieldName] = reader.readBoolean(fieldName);
                    }
                    return new compactUtil.Flexible(fields);
                }

                write(writer, obj) {
                    for (const fieldName of this.fieldNames) {
                        writer.writeBoolean(fieldName, obj[fieldName]);
                    }
                }
            }

            await shouldReadAndWrite(new compactUtil.Flexible(allFields), [new Serializer(fieldNames)]);
        });
    });

    it('should allow basic query', async function () {
        const client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new EmployeeDTOSerializer()]
            }
        }, member);

        const client2 = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new EmployeeDTOSerializer()]
            }
        }, member);

        const map = await client.getMap(mapName);

        for (let i = 0; i < 100; i++) {
            const employee = new compactUtil.EmployeeDTO(i, Long.fromString('102310312'));
            await map.put(i, employee);
        }

        const map2 = await client2.getMap(mapName);
        const size = (await map2.keySetWithPredicate(Predicates.sql('age > 19'))).length;

        size.should.be.equal(80);
    });
});

