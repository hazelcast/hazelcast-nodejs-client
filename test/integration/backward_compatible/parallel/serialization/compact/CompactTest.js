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
const should = chai.should();

const RC = require('../../../../RC');
const TestUtil = require('../../../../../TestUtil');
const Long = require('long');
const {A, ASerializer} = require('./Class');
const B = require('./SameNamedClass').A;
const BSerializer = require('./SameNamedClass').ASerializer;
const { Predicates, HazelcastSerializationError } = require('../../../../../../lib/core');

describe('CompactTest', function () {
    const testFactory = new TestUtil.TestFactory();

    let cluster;
    let mapName;
    let member;

    let supportedFieldKinds;
    let variableSizeFieldKinds;
    let arrayOfNullableFieldKinds;

    let CompactUtil;
    let FieldKind;
    let CompactStreamSerializer;

    try {
        CompactUtil = require('./CompactUtil');
        FieldKind = require('../../../../../../lib/serialization/generic_record/FieldKind').FieldKind;
        CompactStreamSerializer = require('../../../../../../lib/serialization/compact/CompactStreamSerializer')
        .CompactStreamSerializer;
        variableSizeFieldKinds = CompactUtil.varSizeFields;
        supportedFieldKinds = CompactUtil.supportedFieldKinds;
        arrayOfNullableFieldKinds = CompactUtil.arrayOfNullableFieldKinds;
    } catch (e) {
        variableSizeFieldKinds = [];
        supportedFieldKinds = [];
    }

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
        variableSizeFieldKinds = CompactUtil.varSizeFields;
        supportedFieldKinds = CompactUtil.supportedFieldKinds;
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

    const putEntry = async (mapName, fieldKind, value) => {
        const client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new CompactUtil.FlexibleSerializer([fieldKind]), new CompactUtil.EmployeeSerializer()]
            }
        }, member);

        const map = await client.getMap(mapName);
        const fields = {[FieldKind[fieldKind]]: value};
        await map.set('key', new CompactUtil.Flexible(fields));
        return map;
    };

    it('should work with basic test', async function () {
        await shouldReadAndWrite(
            new CompactUtil.EmployeeDTO(30, Long.fromString('102310312')), [new CompactUtil.EmployeeDTOSerializer()]
        );
    });

    it('should be able to read and write all fields', async function () {
        await shouldReadAndWrite(
            new CompactUtil.Flexible(CompactUtil.referenceObjects),
            [new CompactUtil.FlexibleSerializer(CompactUtil.supportedFieldKinds), new CompactUtil.EmployeeSerializer()]
        );
    });

    it('should be able to read and write empty class', async function () {
        // Clear serializer list
        CompactStreamSerializer.classToSerializersMap.clear();
        await shouldReadAndWrite(new CompactUtil.Flexible({}), []);
    });

    it('should be able to read and write class with only variable size fields', async function () {
        const fields = {};
        for (const field of CompactUtil.varSizeFields) {
            const fieldName = FieldKind[field];
            fields[fieldName] = CompactUtil.referenceObjects[fieldName];
        }
        await shouldReadAndWrite(
            new CompactUtil.Flexible(fields),
            [new CompactUtil.FlexibleSerializer(CompactUtil.varSizeFields), new CompactUtil.EmployeeSerializer()]
        );
    });

    it('should be able to read and write class with only fixed size fields', async function () {
        const fields = {};
        for (const field of CompactUtil.fixedSizeFields) {
            const fieldName = FieldKind[field];
            fields[fieldName] = CompactUtil.referenceObjects[fieldName];
        }
        await shouldReadAndWrite(
            new CompactUtil.Flexible(fields),
            [new CompactUtil.FlexibleSerializer(CompactUtil.fixedSizeFields), new CompactUtil.EmployeeSerializer()]
        );
    });

    [['small', 1], ['medium', 20], ['large', 42]].forEach(([size, elementCount]) => {
        it(`should read and write ${size} object`, async function () {
            const referenceObjects = {
                [FieldKind[FieldKind.ARRAY_OF_STRING]]: new Array(elementCount).fill(0)
                    .map(i => TestUtil.randomString((i + 1) * 100)),
                [FieldKind[FieldKind.INT32]]: 32,
                [FieldKind[FieldKind.STRING]]: 'test',
            };

            referenceObjects[FieldKind[FieldKind.ARRAY_OF_STRING]].push(null);
            await shouldReadAndWrite(
                new CompactUtil.Flexible(referenceObjects),
                [new CompactUtil.FlexibleSerializer([FieldKind.ARRAY_OF_STRING, FieldKind.INT32, FieldKind.STRING])]
            );
        });
    });

    [0, 1, 8, 10, 100, 1000].forEach((elementCount) => {
        it(`should read and write bool array with size ${elementCount}`, async function () {
            const referenceObjects = {
                [FieldKind[FieldKind.ARRAY_OF_BOOLEAN]]: new Array(elementCount).fill(0).map(() => Math.random() > 0.5),
            };

            await shouldReadAndWrite(
                new CompactUtil.Flexible(referenceObjects), [new CompactUtil.FlexibleSerializer([FieldKind.ARRAY_OF_BOOLEAN])]
            );
        });

        it(`should read and write bool array with size ${elementCount}`, async function () {
            const referenceObjects = {
                [FieldKind[FieldKind.ARRAY_OF_BOOLEAN]]: new Array(elementCount).fill(0).map(() => Math.random() > 0.5),
            };

            await shouldReadAndWrite(
                new CompactUtil.Flexible(referenceObjects), [new CompactUtil.FlexibleSerializer([FieldKind.ARRAY_OF_BOOLEAN])]
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
                    this.hzClass = CompactUtil.Flexible;
                    this.fieldNames = fieldNames;
                }

                read(reader) {
                    const fields = {};
                    for (const fieldName of this.fieldNames) {
                        fields[fieldName] = reader.readBoolean(fieldName);
                    }
                    return new CompactUtil.Flexible(fields);
                }

                write(writer, obj) {
                    for (const fieldName of this.fieldNames) {
                        writer.writeBoolean(fieldName, obj[fieldName]);
                    }
                }
            }

            await shouldReadAndWrite(new CompactUtil.Flexible(allFields), [new Serializer(fieldNames)]);
        });
    });

    supportedFieldKinds.forEach(fieldKind => {
        it(`should read and write with one field. Field: ${FieldKind[fieldKind]}`, async function() {
            const fieldName = FieldKind[fieldKind];
            const value = CompactUtil.referenceObjects[fieldName];

            const map = await putEntry(mapName, +fieldKind, value);
            const obj = await map.get('key');
            obj[fieldName].should.be.deep.eq(value);
        });
    });

    variableSizeFieldKinds.forEach(fieldKind => {
        it(`should be able write null and then read variable size fields. Field: ${FieldKind[fieldKind]}`, async function() {
            const fieldName = FieldKind[fieldKind];

            const map = await putEntry(mapName, +fieldKind, null);
            const obj = await map.get('key');
            should.equal(obj[fieldName], null);
        });
    });

    arrayOfNullableFieldKinds.forEach(fieldKind => {
        it(`should be able read and write a field that is an array of nullables. Field: ${FieldKind[fieldKind]}`,
            async function() {
            const fieldName = FieldKind[fieldKind];
            const value = [null, ...CompactUtil.referenceObjects[fieldName], null];
            value.splice(2, 0, null);

            const map = await putEntry(mapName, +fieldKind, value);
            const obj = await map.get('key');
            obj[fieldName].should.be.deep.eq(value);
        });
    });

    supportedFieldKinds.forEach(fieldKind => {
        it(`should throw when field name does not exist. Field: ${FieldKind[fieldKind]}`, async function() {
            const fieldName = FieldKind[fieldKind];
            const value = CompactUtil.referenceObjects[fieldName];

            await putEntry(mapName, +fieldKind, value);
            const client2 = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [new CompactUtil.FlexibleSerializer([fieldKind], {
                        [FieldKind[fieldKind]]: 'not-a-field'
                    }), new CompactUtil.EmployeeSerializer()]
                }
            }, member);

            const map = await client2.getMap(mapName);
            const error = await TestUtil.getRejectionReasonOrThrow(async () => {
                await map.get('key');
            });
            error.should.be.instanceOf(HazelcastSerializationError);
            error.message.includes('No field with name').should.be.true;
        });
    });

    it('should allow basic query', async function () {
        const client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new CompactUtil.EmployeeDTOSerializer()]
            }
        }, member);

        const client2 = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new CompactUtil.EmployeeDTOSerializer()]
            }
        }, member);

        const map = await client.getMap(mapName);

        for (let i = 0; i < 100; i++) {
            const employee = new CompactUtil.EmployeeDTO(i, Long.fromString('102310312'));
            await map.put(i, employee);
        }

        const map2 = await client2.getMap(mapName);
        const size = (await map2.keySetWithPredicate(Predicates.sql('age > 19'))).length;

        size.should.be.equal(80);
    });

    it('should work with same-named different classes by giving different typenames', async function() {
        A.name.should.be.eq(B.name);
        await shouldReadAndWrite(new A(1), [new ASerializer(), new BSerializer()]);
        await shouldReadAndWrite(new B('1'), [new ASerializer(), new BSerializer()]);
    });
});

