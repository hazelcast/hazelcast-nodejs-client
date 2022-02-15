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
const { A, ASerializer } = require('./Class');
const B = require('./SameNamedClass').A;
const BSerializer = require('./SameNamedClass').ASerializer;
const { Predicates, HazelcastSerializationError } = require('../../../../../../lib/core');

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

describe('CompactTest', function () {
    let cluster;
    let mapName;
    let member;

    let supportedFields;
    let varSizeFields;
    let arrayOfNullableFields;
    let nullableFixedSizeFields;
    let fixedSizeFields;
    let arrayOfNullableFixedSizeFields;

    let CompactUtil;
    let FieldKind;
    let CompactStreamSerializer;

    const testFactory = new TestUtil.TestFactory();

    try {
        CompactUtil = require('./CompactUtil');
        FieldKind = require('../../../../../../lib/serialization/generic_record/FieldKind').FieldKind;
        CompactStreamSerializer = require('../../../../../../lib/serialization/compact/CompactStreamSerializer')
            .CompactStreamSerializer;

        varSizeFields = CompactUtil.varSizeFields;
        supportedFields = CompactUtil.supportedFields;
        arrayOfNullableFields = CompactUtil.arrayOfNullableFields;
        nullableFixedSizeFields = CompactUtil.nullableFixedSizeFields;
        fixedSizeFields = CompactUtil.fixedSizeFields;
        arrayOfNullableFixedSizeFields = Object.values(CompactUtil.fixedSizedArrayToNullableFixedSizeArray);
    } catch (e) {
        varSizeFields = [];
        supportedFields = [];
        nullableFixedSizeFields = [];
        fixedSizeFields = [];
        arrayOfNullableFields = [];
        arrayOfNullableFixedSizeFields = [];
    }

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
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

    const putEntry = async (
        mapName, fieldKind, value, readerFieldNameMap = {}, writerFieldNameMap = {}, useDefaultValue = false
    ) => {
        const client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [
                    new CompactUtil.FlexibleSerializer([fieldKind], readerFieldNameMap, writerFieldNameMap, useDefaultValue),
                    new CompactUtil.EmployeeSerializer()
                ]
            }
        }, member);

        const map = await client.getMap(mapName);
        const baseName = FieldKind[fieldKind];
        const fieldName = Object.prototype.hasOwnProperty.call(writerFieldNameMap, baseName) ?
            writerFieldNameMap[baseName] : baseName;
        const fields = { [fieldName]: {value: value} };
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
            [new CompactUtil.FlexibleSerializer(supportedFields), new CompactUtil.EmployeeSerializer()]
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
                [FieldKind[FieldKind.ARRAY_OF_STRING]]: {value: new Array(elementCount).fill(0)
                    .map(i => TestUtil.randomString((i + 1) * 100))},
                [FieldKind[FieldKind.INT32]]: {value: 32},
                [FieldKind[FieldKind.STRING]]: {value: 'test'},
            };

            referenceObjects[FieldKind[FieldKind.ARRAY_OF_STRING]].value.push(null);
            await shouldReadAndWrite(
                new CompactUtil.Flexible(referenceObjects),
                [new CompactUtil.FlexibleSerializer([FieldKind.ARRAY_OF_STRING, FieldKind.INT32, FieldKind.STRING])]
            );
        });
    });

    [0, 1, 8, 10, 100, 1000].forEach((elementCount) => {
        it(`should read and write bool array with size ${elementCount}`, async function () {
            const referenceObjects = {
                [FieldKind[FieldKind.ARRAY_OF_BOOLEAN]]: {value: new Array(elementCount).fill(0).map(() => Math.random() > 0.5)},
            };

            await shouldReadAndWrite(
                new CompactUtil.Flexible(referenceObjects), [new CompactUtil.FlexibleSerializer([FieldKind.ARRAY_OF_BOOLEAN])]
            );
        });

        it(`should read and write bool array with size ${elementCount}`, async function () {
            const referenceObjects = {
                [FieldKind[FieldKind.ARRAY_OF_BOOLEAN]]: {value: new Array(elementCount).fill(0).map(() => Math.random() > 0.5)},
            };

            await shouldReadAndWrite(
                new CompactUtil.Flexible(referenceObjects), [new CompactUtil.FlexibleSerializer([FieldKind.ARRAY_OF_BOOLEAN])]
            );
        });

        it('should read and write with multiple boolean fields', async function () {
            const allFields = {};
            const fieldNames = new Array(elementCount);
            for (let i = 0; i < elementCount; i++) {
                allFields[i] = {value: Math.random() > 0.5};
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
                        fields[fieldName] = {value: reader.readBoolean(fieldName)};
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

    varSizeFields.forEach(fieldKind => {
        it(`should be able write null and then read variable size fields. Field: ${FieldKind[fieldKind]}`, async function () {
            const fieldName = FieldKind[fieldKind];

            const map = await putEntry(mapName, +fieldKind, null);
            const obj = await map.get('key');
            should.equal(obj[fieldName], null);
        });
    });

    arrayOfNullableFields.forEach(fieldKind => {
        it(`should be able read and write a field that is an array of nullables. Field: ${FieldKind[fieldKind]}`,
            async function () {
                const fieldName = FieldKind[fieldKind];
                const value = [null, ...CompactUtil.referenceObjects[fieldName].value, null];
                value.splice(2, 0, null);

                const map = await putEntry(mapName, +fieldKind, value);
                const obj = await map.get('key');
                obj[fieldName].should.be.deep.eq(value);
            });
    });

    supportedFields.forEach(fieldKind => {
        it(`should throw when field name does not exist. Field: ${FieldKind[fieldKind]}`, async function () {
            const fieldName = FieldKind[fieldKind];
            const value = CompactUtil.referenceObjects[fieldName].value;

            await putEntry(mapName, +fieldKind, value);
            const client2 = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [new CompactUtil.FlexibleSerializer([fieldKind], {
                        [fieldName]: 'not-a-field'
                    }), new CompactUtil.EmployeeSerializer()]
                }
            }, member);

            const map = await client2.getMap(mapName);
            const error = await TestUtil.getRejectionReasonOrThrow(async () => {
                await map.get('key');
            });
            error.should.be.instanceOf(HazelcastSerializationError);
            error.message.includes('No field with the name').should.be.true;
        });

        it(`should read and write with one field. Field: ${FieldKind[fieldKind]}`, async function () {
            const fieldName = FieldKind[fieldKind];
            const value = CompactUtil.referenceObjects[fieldName].value;

            const map = await putEntry(mapName, +fieldKind, value);
            const obj = await map.get('key');
            obj[fieldName].should.be.deep.eq(value);
        });

        it(`should throw when a field is tried to be read with a wrong reader method. Field: ${FieldKind[fieldKind]}`,
            async function () {
                const fieldName = FieldKind[fieldKind];
                const wrongFieldKind = supportedFields[
                    (supportedFields.indexOf(fieldKind) + 1) % supportedFields.length
                ];
                const value = CompactUtil.referenceObjects[fieldName].value;

                await putEntry(mapName, +fieldKind, value, undefined, {
                    [fieldName]: 'someField'
                });
                const client2 = await testFactory.newHazelcastClientForParallelTests({
                    clusterName: cluster.id,
                    serialization: {
                        compactSerializers: [new CompactUtil.FlexibleSerializer([wrongFieldKind], {
                            [FieldKind[wrongFieldKind]]: 'someField'
                        }), new CompactUtil.EmployeeSerializer()]
                    }
                }, member);

                const map = await client2.getMap(mapName);
                const error = await TestUtil.getRejectionReasonOrThrow(async () => {
                    await map.get('key');
                });
                const regex = /(Mismatched field kinds)|(The kind of field \S+ must be one of)/;
                error.should.be.instanceOf(HazelcastSerializationError);
                regex.test(error.message).should.be.true;
            });

        it(`should not read default value when field exist. Field: ${FieldKind[fieldKind]}`, async function() {
            const fieldName = FieldKind[fieldKind];
            const value = CompactUtil.referenceObjects[fieldName].value;

            const map = await putEntry(mapName, +fieldKind, value, undefined, undefined, true);
            const obj = await map.get('key');
            obj[fieldName].should.be.deep.eq(value);
        });

        it(`should read default value when field names do not match. Field: ${FieldKind[fieldKind]}`, async function() {
            const fieldName = FieldKind[fieldKind];
            const value = CompactUtil.referenceObjects[fieldName].value;

            const map = await putEntry(mapName, +fieldKind, value, undefined, {
                [fieldName]: 'someField'
            }, true);
            const obj = await map.get('key');
            if (obj[fieldName] === null) {
                should.equal(CompactUtil.referenceObjects[fieldName].default, null);
            } else {
                obj[fieldName].should.be.deep.eq(CompactUtil.referenceObjects[fieldName].default);
            }
        });

        it('should read default value when field name exist but with a different field kind.' +
        `Field: ${FieldKind[fieldKind]}`, async function() {
            const fieldName = FieldKind[fieldKind];
            const wrongFieldKind = supportedFields[
                (supportedFields.indexOf(fieldKind) + 1) % supportedFields.length
            ];
            const wrongFieldKindName = FieldKind[wrongFieldKind];
            const expectedValue = CompactUtil.referenceObjects[wrongFieldKindName].default;
            const value = CompactUtil.referenceObjects[fieldName].value;

            await putEntry(mapName, +fieldKind, value, undefined, {
                [fieldName]: 'someField'
            });

            const client2 = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [new CompactUtil.FlexibleSerializer([wrongFieldKind], {
                        [FieldKind[wrongFieldKind]]: 'someField'
                    }, undefined, true), new CompactUtil.EmployeeSerializer()]
                }
            }, member);

            const map = await client2.getMap(mapName);

            const obj = await map.get('key');
            if (obj.someField === null) {
                should.equal(CompactUtil.referenceObjects[wrongFieldKindName].default, null);
            } else {
                obj.someField.should.be.deep.eq(expectedValue);
            }
        });
    });

    fixedSizeFields.forEach(fieldKind => {
        it(`should be able write a fix sized field then read it as nullable fix sized field. Field: ${FieldKind[fieldKind]}`,
            async function () {
            const fieldName = FieldKind[fieldKind];
            const nullableFieldKind = CompactUtil.fixedFieldToNullableFixedField[fieldKind];
            const value = CompactUtil.referenceObjects[fieldName].value;

            await putEntry(mapName, +fieldKind, value, undefined, {
                [fieldName]: 'someField'
            });

            const client2 = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [new CompactUtil.FlexibleSerializer([nullableFieldKind], {
                        [FieldKind[nullableFieldKind]]: 'someField'
                    }), new CompactUtil.EmployeeSerializer()]
                }
            }, member);

            const map = await client2.getMap(mapName);
            const obj = await map.get('key');
            obj.someField.should.be.deep.eq(value);
        });
    });

    nullableFixedSizeFields.forEach(fieldKind => {
        it(`should be able write a nullable fix sized field then read it as fix sized field. Field: ${FieldKind[fieldKind]}`,
            async function () {
            const fieldName = FieldKind[fieldKind];
            const fixedFieldKind = CompactUtil.fixedNullableFieldToFixedField[fieldKind];
            const value = CompactUtil.referenceObjects[fieldName].value;

            await putEntry(mapName, +fieldKind, value, undefined, {
                [fieldName]: 'someField'
            });

            const client2 = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [new CompactUtil.FlexibleSerializer([fixedFieldKind], {
                        [FieldKind[fixedFieldKind]]: 'someField'
                    }), new CompactUtil.EmployeeSerializer()]
                }
            }, member);

            const map = await client2.getMap(mapName);
            const obj = await map.get('key');
            obj.someField.should.be.deep.eq(value);
        });

        it('should throw when a nullable fix sized field is written as null then read as fix sized field. '
        + `Field: ${FieldKind[fieldKind]}`,
        async function () {
            const fieldName = FieldKind[fieldKind];
            const fixedFieldKind = CompactUtil.fixedNullableFieldToFixedField[fieldKind];
            const value = null;

            await putEntry(mapName, +fieldKind, value, undefined, {
                [fieldName]: 'someField'
            });

            const client2 = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [new CompactUtil.FlexibleSerializer([fixedFieldKind], {
                        [FieldKind[fixedFieldKind]]: 'someField'
                    }), new CompactUtil.EmployeeSerializer()]
                }
            }, member);

            const map = await client2.getMap(mapName);
            const error = await TestUtil.getRejectionReasonOrThrow(async () => {
                await map.get('key');
            });
            error.should.be.instanceOf(HazelcastSerializationError);
            error.message.includes('null value can not be read').should.be.true;
        });
    });

    arrayOfNullableFixedSizeFields.forEach(fieldKind => {
        it('should throw when a nullable fix sized array with nulls is written and then read as a fix sized array field. ' +
         `Field: ${FieldKind[fieldKind]}`,
        async function () {
            const fieldName = FieldKind[fieldKind];
            const arrayOfFixedSizeField = CompactUtil.nullableFixedSizeArrayToFixedSizeArray[fieldKind];
            const arrayOfFixedSizeFieldName = FieldKind[arrayOfFixedSizeField];
            const value = [null];

            await putEntry(mapName, +fieldKind, value, undefined, {
                [fieldName]: 'someField'
            });

            const client2 = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [new CompactUtil.FlexibleSerializer([arrayOfFixedSizeField], {
                        [arrayOfFixedSizeFieldName]: 'someField'
                    }), new CompactUtil.EmployeeSerializer()]
                }
            }, member);

            const map = await client2.getMap(mapName);
            const error = await TestUtil.getRejectionReasonOrThrow(async () => {
                await map.get('key');
            });
            error.should.be.instanceOf(HazelcastSerializationError);
            error.message.includes('null value can not be read').should.be.true;
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

    it('should work with same-named different classes by giving different typenames', async function () {
        A.name.should.be.eq(B.name);
        await shouldReadAndWrite(new A(1), [new ASerializer(), new BSerializer()]);
        await shouldReadAndWrite(new B('1'), [new ASerializer(), new BSerializer()]);
    });

    describe('SchemaEvolution', function() {
        const verifyAddingAField = async (existingFields, newFieldName, newFieldValue, newFieldKind) => {
            const v1FieldKinds = [];
            const v1FieldNameMap = {};
            const v1Fields = {};

            for (const fieldName in existingFields) {
                const v = existingFields[fieldName];
                v1FieldNameMap[FieldKind[v.fieldKind]] = fieldName;
                v1Fields[fieldName] = {value: v.value};
                v1FieldKinds.push(v.fieldKind);
            }
            const v1Serializer = new CompactUtil.FlexibleSerializer(v1FieldKinds, v1FieldNameMap, v1FieldNameMap);
            const v1Client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [v1Serializer]
                }
            }, member);
            const v1Map = await v1Client.getMap(mapName);
            await v1Map.put('key1', new CompactUtil.Flexible(v1Fields));

            const v2FieldKinds = [...v1FieldKinds, newFieldKind];
            const v2FieldNameMap = {
                ...v1FieldNameMap,
                [FieldKind[newFieldKind]]: newFieldName
            };
            const v2Serializer = new CompactUtil.FlexibleSerializer(v2FieldKinds, v2FieldNameMap, v2FieldNameMap);
            const v2Client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [v2Serializer]
                }
            }, member);
            const v2Fields = {...v1Fields, [newFieldName]: {value: newFieldValue}};
            const v2Map = await v2Client.getMap(mapName);
            await v2Map.put('key2', new CompactUtil.Flexible(v2Fields));

            const carefulV2Serializer = new CompactUtil.FlexibleSerializer(v2FieldKinds, v2FieldNameMap, v2FieldNameMap, true);
            const carefulV2Client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [carefulV2Serializer]
                }
            }, member);
            const carefulV2Map = await carefulV2Client.getMap(mapName);

            // Old client can read data written by the new client
            const v1Obj = await v1Map.get('key2');
            for (const fieldName in v1Fields) {
                v1Obj[fieldName].should.be.eq(v2Fields[fieldName].value);
            }

            // New client cannot read data written by the old client, since there is no such field on the old data

            const error = await TestUtil.getRejectionReasonOrThrow(async () => {
                await v2Map.get('key1');
            });
            error.should.be.instanceOf(HazelcastSerializationError);
            error.message.includes('No field with the name').should.be.true;

            // However, if it has default value, everything should work
            const carefulV2Obj = await carefulV2Map.get('key1');
            for (const fieldName in v2Fields) {
                const fieldKindName = Object.prototype.hasOwnProperty.call(existingFields, fieldName) ?
                    FieldKind[existingFields[fieldName]] : FieldKind[newFieldKind];
                carefulV2Obj[fieldName].should.satisfy(
                    v => Object.prototype.hasOwnProperty.call(v1Fields, fieldName) ?
                        v === v1Fields[fieldName].value :
                        v === CompactUtil.referenceObjects[fieldKindName].default
                );
            }
        };

        const verifyRemovingAField = async (existingFields, removedFieldName) => {
            const v1FieldKinds = [];
            const v1FieldNameMap = {};
            const v1Fields = {};
            const v2FieldKinds = [];

            for (const fieldName in existingFields) {
                const v = existingFields[fieldName];
                v1FieldNameMap[FieldKind[v.fieldKind]] = fieldName;
                v1Fields[fieldName] = {value: v.value};
                v1FieldKinds.push(v.fieldKind);
                if (fieldName !== removedFieldName) {
                    v2FieldKinds.push(v.fieldKind);
                }
            }
            const v1Serializer = new CompactUtil.FlexibleSerializer(v1FieldKinds, v1FieldNameMap, v1FieldNameMap);
            const v1Client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [v1Serializer]
                }
            }, member);
            const v1Map = await v1Client.getMap(mapName);
            await v1Map.put('key1', new CompactUtil.Flexible(v1Fields));

            const v2FieldNameMap = {
                ...v1FieldNameMap
            };
            delete v2FieldNameMap[FieldKind[existingFields[removedFieldName].fieldKind]];
            const v2Serializer = new CompactUtil.FlexibleSerializer(v2FieldKinds, v2FieldNameMap, v2FieldNameMap);
            const v2Client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [v2Serializer]
                }
            }, member);
            const v2Fields = {...v1Fields};
            delete v2Fields[removedFieldName];
            const v2Map = await v2Client.getMap(mapName);
            await v2Map.put('key2', new CompactUtil.Flexible(v2Fields));

            const carefulV1Serializer = new CompactUtil.FlexibleSerializer(v1FieldKinds, v1FieldNameMap, v1FieldNameMap, true);
            const carefulV1Client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                serialization: {
                    compactSerializers: [carefulV1Serializer]
                }
            }, member);
            const carefulV1Map = await carefulV1Client.getMap(mapName);

            // Old client cannot read data written by the new client since there is no such field on the new data
            const error = await TestUtil.getRejectionReasonOrThrow(async () => {
                await v1Map.get('key2');
            });
            error.should.be.instanceOf(HazelcastSerializationError);
            error.message.includes('No field with the name').should.be.true;

            // However, if it has default value, everything should work
            const carefulV1Obj = await carefulV1Map.get('key2');
            for (const fieldName in v1Fields) {
                const fieldKindName = FieldKind[existingFields[fieldName].fieldKind];
                const expectedValue = v1Fields[fieldName].value;
                carefulV1Obj[fieldName].should.satisfy(
                    v => (Long.isLong(expectedValue) ? v.eq(expectedValue) : v === expectedValue)
                     || v === CompactUtil.referenceObjects[fieldKindName].default
                );
            }

            // New client can read data written by the old client
            const v2Obj = await v2Map.get('key1');
            for (const fieldName in v2Fields) {
                const expectedValue = v1Fields[fieldName].value;
                if (Long.isLong(expectedValue)) {
                    v2Obj[fieldName].eq(expectedValue).should.be.true;
                } else {
                    v2Obj[fieldName].should.be.eq(expectedValue);
                }
            }

            Object.prototype.hasOwnProperty.call(v2Obj, removedFieldName).should.be.false;
        };

        it('should work when a variable size field is added', async function() {
            await verifyAddingAField({
                field1: { value: 42, fieldKind: FieldKind.INT32},
                field2: { value: '42', fieldKind: FieldKind.STRING}
            }, 'field3', [true, false, true], FieldKind.ARRAY_OF_BOOLEAN);
        });

        it('should work when a fixed size field is added', async function() {
            await verifyAddingAField({
                field1: { value: 42, fieldKind: FieldKind.INT32},
                field2: { value: '42', fieldKind: FieldKind.STRING}
            }, 'field3', Long.fromNumber(24), FieldKind.INT64);
        });

        it('should work when a variable size field is removed', async function() {
            await verifyRemovingAField({
                field1: { value: Long.fromNumber(1234), fieldKind: FieldKind.INT64},
                field2: { value: 'hey', fieldKind: FieldKind.STRING}
            }, 'field2');
        });

        it('should work when a fixed size field is removed', async function() {
            await verifyRemovingAField({
                field1: { value: Long.fromNumber(1234), fieldKind: FieldKind.INT64},
                field2: { value: 'hey', fieldKind: FieldKind.STRING}
            }, 'field2');
        });
    });

    // All events are handled in the same place in listener service, so there should not be need to test all event types.
    it('should received compact data with events', async function() {
        const client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new CompactUtil.FlexibleSerializer([FieldKind.INT32])]
            }
        }, member);
        const client2 = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: [new CompactUtil.FlexibleSerializer([FieldKind.INT32])]
            }
        }, member);

        const map = await client.getMap(mapName);
        const map2 = await client2.getMap(mapName);

        let counter = 0;

        await map2.addEntryListener({added: (entryEvent) => {
            console.log(entryEvent);
            counter++;
        }}, undefined, true);

        await map.put(1, new CompactUtil.Flexible({INT32: 1}));

        await TestUtil.assertTrueEventually(async () => {
            counter.should.be.eq(1);
        });
    });
});

