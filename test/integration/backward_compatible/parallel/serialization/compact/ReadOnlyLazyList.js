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
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const RC = require('../../../../RC');
const { Lang } = require('../../../../remote_controller/remote_controller_types');
const TestUtil = require('../../../../../TestUtil');
const { HazelcastSerializationError } = require('../../../../../../lib');

describe('ReadOnlyLazyListCompactTest', function () {
    let cluster;
    let member;
    let SchemaNotFoundError;
    let map;
    let client;

    try {
        SchemaNotFoundError = require('../../../../../../lib/core/HazelcastError').SchemaNotFoundError;
    } catch (err) {
        // no-op
    }

    const testFactory = new TestUtil.TestFactory();
    const mapName = TestUtil.randomString(10);

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
        cluster = await testFactory.createClusterForParallelTests(undefined, COMPACT_ENABLED_ZERO_CONFIG_XML);
        member = await RC.startMember(cluster.id);
    });

    beforeEach(async function() {
        client = await testFactory.newHazelcastClientForParallelTests({
            clusterName: cluster.id,
        }, member);
        TestUtil.markServerVersionAtLeast(this, client, '5.1.0');
        await putSingleCompactEntryToMapByMember();
    });

    const putSingleCompactEntryToMapByMember = async () => {
        const script = `
            // This class exists in remote controller.
            var EmployeeDTO = Java.type('example.serialization.EmployeeDTO');
            var map = instance_0.getMap("${mapName}");
            map.set(1.0, new EmployeeDTO(1, 1));
        `;
        await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
    };

    after(async function () {
        await testFactory.shutdownAll();
    });

    afterEach(async function() {
        await map.destroy();
        await testFactory.shutdownAllClients();
        sandbox.restore();
    });

    const testFunction = (fn) => {
        it('should throw HazelcastSerializationError if compact schema is not known by the client', async function () {
            map = await client.getMap(mapName);
            const readOnlyLazyList = await map.values();
            const error = TestUtil.getThrownErrorOrThrow(fn.bind(fn, readOnlyLazyList));
            error.should.be.instanceOf(HazelcastSerializationError);
            error.cause.should.be.instanceOf(SchemaNotFoundError);
        });

        it('should throw same error if any error other than HazelcastSerializationError is thrown', async function () {
            map = await client.getMap(mapName);
            const readOnlyLazyList = await map.values();
            const error = TestUtil.getThrownErrorOrThrow(fn.bind(fn, readOnlyLazyList));
            error.should.be.instanceOf(HazelcastSerializationError);
            error.cause.should.be.instanceOf(SchemaNotFoundError);
        });

        it('should not throw if compact schema is known by the client', async function () {
            const theError = new Error();
            map = await client.getMap(mapName);
            const readOnlyLazyList = await map.values();
            const serializationService = client.getSerializationService();
            sandbox.replace(serializationService, 'toObject', sandbox.fake.throws(theError));
            const error = TestUtil.getThrownErrorOrThrow(fn.bind(fn, readOnlyLazyList));
            error.should.be.eq(theError);
        });
    };

    describe('get', function() {
        testFunction(readOnlyLazyList => readOnlyLazyList.get(0));
    });

    describe('toArray', function() {
        testFunction(readOnlyLazyList => readOnlyLazyList.toArray());
    });
});
