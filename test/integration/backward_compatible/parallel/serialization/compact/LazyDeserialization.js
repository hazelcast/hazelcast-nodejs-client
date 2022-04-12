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
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const RC = require('../../../../RC');
const { Lang } = require('../../../../remote_controller/remote_controller_types');
const TestUtil = require('../../../../../TestUtil');
const { HazelcastSerializationError } = require('../../../../../../lib');

describe('LazyDeserializationCompactTest', function() {
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
    let SchemaNotFoundError;

    try {
        SchemaNotFoundError = require('../../../../../../lib/core/HazelcastError').SchemaNotFoundError;
    } catch (err) {
        // no-op
    }

    describe('ReadOnlyLazyList', function () {
        let cluster;
        let member;
        let map;
        let client;
        let mapName;

        const testFactory = new TestUtil.TestFactory();

        before(async function () {
            TestUtil.markClientVersionAtLeast(this, '5.1.0');
            cluster = await testFactory.createClusterForParallelTests(undefined, COMPACT_ENABLED_ZERO_CONFIG_XML);
            member = await RC.startMember(cluster.id);
        });

        beforeEach(async function() {
            client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
            }, member);
            mapName = TestUtil.randomString(10);
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

        const testReadOnlyLazyListFn = (fn) => {
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
            testReadOnlyLazyListFn(readOnlyLazyList => readOnlyLazyList.get(0));
        });

        describe('toArray', function() {
            testReadOnlyLazyListFn(readOnlyLazyList => readOnlyLazyList.toArray());
        });
    });

    describe('ReadResultSet', function () {
        let cluster;
        let member;
        let ringbuffer;
        let client;
        let ringbufferName;

        const testFactory = new TestUtil.TestFactory();

        before(async function () {
            TestUtil.markClientVersionAtLeast(this, '5.1.0');
            cluster = await testFactory.createClusterForParallelTests(undefined, COMPACT_ENABLED_ZERO_CONFIG_XML);
            member = await RC.startMember(cluster.id);
        });

        beforeEach(async function() {
            client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
            }, member);
            ringbufferName = TestUtil.randomString(10);
            TestUtil.markServerVersionAtLeast(this, client, '5.1.0');
            await putSingleCompactItemToRingbufferByMember();
        });

        const putSingleCompactItemToRingbufferByMember = async () => {
            const script = `
                // This class exists in remote controller.
                var EmployeeDTO = Java.type('example.serialization.EmployeeDTO');
                var ringbuffer = instance_0.getRingbuffer("${ringbufferName}");
                ringbuffer.add(new EmployeeDTO(1, 1));
            `;
            await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
        };

        after(async function () {
            await testFactory.shutdownAll();
        });

        afterEach(async function() {
            await ringbuffer.destroy();
            await testFactory.shutdownAllClients();
            sandbox.restore();
        });

        const testReadResultSet = (fn) => {
            it('should throw HazelcastSerializationError if compact schema is not known by the client', async function () {
                ringbuffer = await client.getRingbuffer(ringbufferName);
                const readResultSet = await ringbuffer.readMany(0, 1, 100);
                const error = TestUtil.getThrownErrorOrThrow(fn.bind(fn, readResultSet));
                error.should.be.instanceOf(HazelcastSerializationError);
                error.cause.should.be.instanceOf(SchemaNotFoundError);
            });

            it('should throw same error if any error other than HazelcastSerializationError is thrown', async function () {
                ringbuffer = await client.getRingbuffer(ringbufferName);
                const readResultSet = await ringbuffer.readMany(0, 1, 100);
                const error = TestUtil.getThrownErrorOrThrow(fn.bind(fn, readResultSet));
                error.should.be.instanceOf(HazelcastSerializationError);
                error.cause.should.be.instanceOf(SchemaNotFoundError);
            });

            it('should not throw if compact schema is known by the client', async function () {
                const theError = new Error();
                ringbuffer = await client.getRingbuffer(ringbufferName);
                const readResultSet = await ringbuffer.readMany(0, 1, 100);
                const serializationService = client.getSerializationService();
                sandbox.replace(serializationService, 'toObject', sandbox.fake.throws(theError));
                const error = TestUtil.getThrownErrorOrThrow(fn.bind(fn, readResultSet));
                error.should.be.eq(theError);
            });
        };

        describe('get', function() {
            testReadResultSet(readResultSet => readResultSet.get(0));
        });
    });
});
