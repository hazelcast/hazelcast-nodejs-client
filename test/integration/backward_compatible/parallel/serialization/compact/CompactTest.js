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

describe('CompactTest', function () {

    const getCompactUtil = () => require('./CompactUtil');
    const getFieldKind = () => require('../../../../../../lib/serialization/generic_record/FieldKind').FieldKind;
    let compactUtil;
    let fieldKind;

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
        TestUtil.markClientVersionAtLeast(this, '5.1.0');
        compactUtil = getCompactUtil();
        fieldKind = getFieldKind();
        cluster = await testFactory.createClusterForParallelTests(undefined, COMPACT_ENABLED_ZERO_CONFIG_XML);
        member = await RC.startMember(cluster.id);
    });

    after(async function () {
        await testFactory.shutdownAll();
    });

    beforeEach(() => {
        mapName = TestUtil.randomString(10);
    });

    const shouldReadAndWrite = async (obj, serializers) => {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: serializers
            },
            properties: {
                'hazelcast.logging.level': 'TRACE'
            }
        }, member);

        client2 = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
            serialization: {
                compactSerializers: serializers
            },
            properties: {
                'hazelcast.logging.level': 'TRACE'
            }
        }, member);

        const map = await client.getMap(mapName);
        await map.put(1, obj);

        const map2 = await client2.getMap(mapName);
        const readObj = await map2.get(1);

        readObj.should.deep.equal(obj);
    }

    it('should work with basic test', async function() {
        await shouldReadAndWrite(new compactUtil.EmployeeDTO(30, Long.fromString('102310312')), [new compactUtil.EmployeeDTOSerializer()]);
    });

    it('should be able to read and write all fields', async function() {
        await shouldReadAndWrite(compactUtil.createMainDTO(), [new compactUtil.MainDTOSerializer(), new compactUtil.InnerDTOSerializer(), new compactUtil.NamedDTOSerializer()]);
    });

    it('should be able to read and write empty class', async function() {
        await shouldReadAndWrite(new compactUtil.Empty(), [new compactUtil.EmptySerializer()]);
    });

    it('should be able to read and write class with only variable size fields', async function() {
        const fields = {};
        for (const field of compactUtil.varSizeFields) {
            const fieldName = fieldKind[field];
            fields[fieldName] = compactUtil.referenceObjects[fieldName];
        }
        await shouldReadAndWrite(new compactUtil.Flexible(fields), [new compactUtil.FlexibleSerializer(compactUtil.varSizeFields), new compactUtil.EmployeeSerializer()]);
    });

    it('should be able to read and write class with only fixed size fields', async function() {
        const fields = {};
        for (const field of compactUtil.fixedSizeFields) {
            const fieldName = fieldKind[field];
            fields[fieldName] = compactUtil.referenceObjects[fieldName];
        }
        await shouldReadAndWrite(new compactUtil.Flexible(fields), [new compactUtil.FlexibleSerializer(compactUtil.fixedSizeFields), new compactUtil.EmployeeSerializer()]);
    });

    it('should allow basic query', async function() {
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

