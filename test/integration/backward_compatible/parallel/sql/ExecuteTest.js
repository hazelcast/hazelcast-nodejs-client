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
const sinon = require('sinon');
const long = require('long');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const { Client, HazelcastSqlException, LifecycleState} = require('../../../../../lib');
const TestUtil = require('../../../../TestUtil');
const RC = require('../../../RC');
const {Lang} = require('../../../remote_controller/remote_controller_types');
const fs = require('fs');
const path = require('path');
const { isClientVersionAtLeast } = require('../../../../TestUtil');
const { deferredPromise } = require('../../../../../lib/util/Util');

const getHazelcastSqlException = () => {
    const { HazelcastSqlException } = require('../../../../../lib/core/HazelcastError');
    return HazelcastSqlException;
};

const getSqlServiceImpl = () => {
    const { SqlServiceImpl } = require('../../../../../lib/sql/SqlService');
    return SqlServiceImpl;
};

const getSqlResultImpl = () => {
    const { SqlResultImpl } = require('../../../../../lib/sql/SqlResult');
    return SqlResultImpl;
};

const getSqlRowImpl = () => {
    const { SqlRowImpl } = require('../../../../../lib/sql/SqlRow');
    return SqlRowImpl;
};

const getSqlErrorCode = () => {
    const { SqlErrorCode } = require('../../../../../lib/sql/SqlErrorCode');
    return SqlErrorCode;
};

const testFactory = new TestUtil.TestFactory();

/**
 * Sql tests
 */
describe('SqlExecuteTest', function () {
    let client;
    let someMap;
    let mapName;
    let CLUSTER_CONFIG;
    let serverVersionNewerThanFive;

    const runSQLQueryWithParams = async () => {
        const mapNames = [mapName];
        if (serverVersionNewerThanFive) {
            mapNames.push(`public.${mapName}`);
        } else {
            mapNames.push(`partitioned.${mapName}`);
        }

        for (const _mapName of mapNames) {
            const entryCount = 10;
            const limit = 6;

            await populateMap(entryCount);
            // At this point the map includes [0, 1], [1, 2].. [9, 10]

            // There should be "limit" results
            const result1 = await TestUtil.getSql(client).execute(`SELECT * FROM ${_mapName} WHERE this <= ?`, [limit]);
            const result2 = await TestUtil.getSql(client).executeStatement({
                sql: `SELECT * FROM ${_mapName} WHERE this <= ?`,
                params: [limit]
            });

            for (const result of [result1, result2]) {
                const rows = [];
                for await (const row of result) {
                    rows.push(row);
                }

                sortByKey(rows);

                for (let i = 0; i < limit; i++) {
                    rows[i]['__key'].should.be.eq(i);
                    rows[i]['this'].should.be.eq(i + 1);
                }
                rows.should.have.lengthOf(limit);
            }
        }
    };

    // Sorts sql result rows by __key, first the smallest __key
    const sortByKey = (array) => {
        array.sort((a, b) => {
            if (a['__key'] < b['__key']) {
                return -1;
            } else if (a['__key'] > b['__key']) {
                return 1;
            } else {
                return 0;
            }
        });
    };

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '4.2');

        const JET_ENABLED_CONFIG = fs.readFileSync(path.join(__dirname, 'jet_enabled.xml'), 'utf8');
        serverVersionNewerThanFive = await TestUtil.compareServerVersionWithRC(RC, '5.0') >= 0;
        CLUSTER_CONFIG = serverVersionNewerThanFive ? JET_ENABLED_CONFIG : null;
    });

    const populateMap = async function (numberOfRecords) {
        const entries = [];
        for (let i = 0; i < numberOfRecords; i++) {
            entries.push([i, i + 1]);
        }
        await someMap.setAll(entries);
    };

    describe('sql parameter count', function () {
        const mapName = 'someMap';

        before(async function () {
            const cluster = await testFactory.createClusterForParallelTests(null, CLUSTER_CONFIG);
            const member = await RC.startMember(cluster.id);
            client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id
            }, member);
            await TestUtil.createMapping(serverVersionNewerThanFive, client, 'double', 'double', mapName);
            TestUtil.markServerVersionAtLeast(this, client, '4.2');
        });

        beforeEach(async function () {
            someMap = await client.getMap(mapName);
        });

        after(async function () {
            await testFactory.shutdownAll();
        });

        afterEach(async function () {
            await someMap.clear();
        });

        const testCases = [
            {
                sql: 'SELECT * FROM someMap WHERE this > ?',
                invalidParamsArray: [
                    [1, 2],
                    [1, 2, 3],
                    []
                ],
                validParamsArray: [
                    [1],
                    [2],
                    [3]
                ]
            },
            {
                sql: 'SELECT * FROM someMap WHERE this < ? AND __key > ?',
                invalidParamsArray: [
                    [1],
                    [1, 2, 3],
                    []
                ],
                validParamsArray: [
                    [1, 2],
                    [2, 3],
                    [1, 3]
                ]
            }
        ];

        it('should resolve if parameter count matches placeholder count', async function () {
            await populateMap(1);
            for (const testCase of testCases) {
                for (const validParams of testCase.validParamsArray) {
                    const result1 = await TestUtil.getSql(client).execute(testCase.sql, validParams);
                    const result2 = await TestUtil.getSql(client).executeStatement({
                        sql: testCase.sql,
                        params: validParams
                    });
                    for (const result of [result2, result1]) {
                        const nextResult = await result.next();
                        nextResult.should.have.property('done');
                        nextResult.should.have.property('value');
                    }
                }
            }
        });

        it('should reject iteration if parameter count is different than placeholder count', async function () {
            await populateMap(1);
            for (const testCase of testCases) {
                for (const invalidParams of testCase.invalidParamsArray) {
                    if (isClientVersionAtLeast('5.0')) {
                        await TestUtil.getSql(client).execute(testCase.sql, invalidParams)
                            .should.eventually.be.rejectedWith(getHazelcastSqlException(), 'parameter count');
                        await TestUtil.getSql(client).executeStatement({
                            sql: testCase.sql,
                            params: invalidParams
                        }).should.eventually.be.rejectedWith(getHazelcastSqlException(), 'parameter count');
                    } else {
                        const result1 = await TestUtil.getSql(client).execute(testCase.sql, invalidParams);
                        const result2 = await TestUtil.getSql(client).executeStatement({
                            sql: testCase.sql,
                            params: invalidParams
                        });
                        for (const result of [result1, result2]) {
                            await result.next().should.eventually.be.rejectedWith(getHazelcastSqlException(), 'parameter count');
                        }
                    }
                }
            }
        });
    });
    describe('basic valid usage', function () {
        let cluster;

        before(async function () {
            cluster = await testFactory.createClusterForParallelTests(null, CLUSTER_CONFIG);
            const member = await RC.startMember(cluster.id);
            client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id
            }, member);
            TestUtil.markServerVersionAtLeast(this, client, '4.2');
        });

        beforeEach(async function () {
            mapName = TestUtil.randomString(10);
            someMap = await client.getMap(mapName);
        });

        after(async function () {
            await testFactory.shutdownAll();
        });

        afterEach(async function () {
            await someMap.clear();
        });

        it('should execute without params', async function () {
            await TestUtil.createMapping(serverVersionNewerThanFive, client, 'double', 'double', mapName);
            const mapNames = [mapName];
            if (serverVersionNewerThanFive) {
                mapNames.push(`public.${mapName}`);
            } else {
                mapNames.push(`partitioned.${mapName}`);
            }

            for (const _mapName of mapNames) {
                const entryCount = 10;
                await populateMap(entryCount);

                const result1 = await TestUtil.getSql(client).execute(`SELECT * FROM ${_mapName}`);
                const result2 = await TestUtil.getSql(client).executeStatement({
                    sql: `SELECT * FROM ${_mapName}`
                });
                for (const result of [result1, result2]) {
                    const rows = [];
                    for await (const row of result) {
                        rows.push(row);
                    }

                    sortByKey(rows);

                    for (let i = 0; i < entryCount; i++) {
                        rows[i]['__key'].should.be.eq(i);
                        rows[i]['this'].should.be.eq(i + 1);
                    }
                    rows.should.have.lengthOf(entryCount);
                }
            }
        });

        it('should execute with params', async function () {
            await TestUtil.createMapping(serverVersionNewerThanFive, client, 'double', 'double', mapName);
            await runSQLQueryWithParams();
        });

        it('should execute provided suggestions', async function () {
            TestUtil.markClientVersionAtLeast(this, '5.0');
            if (!serverVersionNewerThanFive) {
                this.skip();
            }
            // We don't create a mapping intentionally to get suggestions
            await someMap.put(1, 'value-1');
            const selectAllQuery = `SELECT * FROM "${mapName}"`;
            const err = await TestUtil.getRejectionReasonOrThrow(
                async () => await client.getSql().execute(selectAllQuery)
            );
            err.should.be.instanceof(HazelcastSqlException);

            await client.getSql().execute(err.suggestion);

            const result = await client.getSql().execute(selectAllQuery);

            const rows = [];

            for await (const row of result) {
                rows.push(row);
            }

            rows.should.be.deep.eq([{
                this: 'value-1',
                __key: 1
            }]);
        });

        it('should deserialize rows lazily when returnRawResults is true', async function () {
            TestUtil.markClientVersionAtLeast(this, '5.0');

            const mapName = TestUtil.randomString(10);

            // Using a Portable that is not defined on the client-side.
            await TestUtil.createMappingForPortable(
                'integer',
                666,
                1,
                {},
                client,
                mapName,
                serverVersionNewerThanFive
            );

            const script = `
                var m = instance_0.getMap("${mapName}");
                m.put(1, new com.hazelcast.client.test.Employee(1, "Joe"));
            `;

            const rcResult = await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);

            rcResult.success.should.be.true;

            const result = await client.getSql().executeStatement({
                sql: `SELECT __key, this FROM "${mapName}"`,
                options: {
                    returnRawResult: true
                }
            });

            const rows = [];

            for await (const row of result) {
                rows.push(row);
            }

            rows.length.should.be.eq(1);

            const row = rows[0];
            row.should.be.instanceof(getSqlRowImpl());

            // We should be able to deserialize parts of the response

            row.getObject('__key').should.be.eq(1);

            // We should throw lazily when we try to access the columns
            // that are not deserializable

            (() => {
                row.getObject('this');
            }).should.throw(HazelcastSqlException);
        });
    });
    describe('mixed cluster of lite and data members', function () {
        before(async function () {
            const jetConfigOrEmpty =
                await TestUtil.compareServerVersionWithRC(RC, '5.0') >= 0 ? '<jet enabled="true"></jet>' : '';

            const LITE_MEMBER_CONFIG = `
                <hazelcast xmlns="http://www.hazelcast.com/schema/config"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xsi:schemaLocation="http://www.hazelcast.com/schema/config
                    http://www.hazelcast.com/schema/config/hazelcast-config-4.0.xsd">
                    <lite-member enabled="true" />
                    ${jetConfigOrEmpty}
                </hazelcast>
            `;

            const cluster = await testFactory.createClusterForParallelTests(null, LITE_MEMBER_CONFIG);
            await RC.startMember(cluster.id);
            await RC.startMember(cluster.id);
            await RC.executeOnController(cluster.id, `
                instance_0.getCluster().promoteLocalLiteMember();
            `, Lang.JAVASCRIPT);
            client = await Client.newHazelcastClient({
                clusterName: cluster.id
            });
            TestUtil.markServerVersionAtLeast(this, client, '4.2');
            mapName = TestUtil.randomString(10);
            someMap = await client.getMap(mapName);
            await TestUtil.createMapping(serverVersionNewerThanFive, client, 'double', 'double', mapName);
        });

        after(async function () {
            await testFactory.shutdownAll();
        });

        it('should be able to execute sql query', async function () {
            await runSQLQueryWithParams();
        });
    });
    describe('options', function () {
        before(async function () {
            const cluster = await testFactory.createClusterForParallelTests(null, CLUSTER_CONFIG);
            const member = await RC.startMember(cluster.id);
            client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id
            }, member);
            TestUtil.markServerVersionAtLeast(this, client, '4.2');
        });

        beforeEach(async function () {
            mapName = TestUtil.randomString(10);
            someMap = await client.getMap(mapName);
            await TestUtil.createMapping(serverVersionNewerThanFive, client, 'double', 'double', mapName);
        });

        after(async function () {
            await testFactory.shutdownAll();
        });

        afterEach(async function () {
            await someMap.clear();
        });

        it('should paginate according to cursorBufferSize', async function () {
            const entryCount = 10;
            const resultSpy = sinon.spy(getSqlResultImpl().prototype, 'fetch');
            const serviceSpy = sinon.spy(getSqlServiceImpl().prototype, 'fetch');

            await populateMap(entryCount);

            const result = await TestUtil.getSql(client).execute(`SELECT * FROM ${mapName}`, undefined, {
                cursorBufferSize: 2
            });

            const rows = [];
            for await (const row of result) {
                rows.push(row);
            }

            sortByKey(rows);

            for (let i = 0; i < entryCount; i++) {
                rows[i]['__key'].should.be.eq(i);
                rows[i]['this'].should.be.eq(i + 1);
            }
            rows.should.have.lengthOf(entryCount);

            resultSpy.callCount.should.be.eq(4);
            serviceSpy.callCount.should.be.eq(4);
            sinon.restore();
        });

        it('should paginate according to cursorBufferSize with sql statement', async function () {
            const entryCount = 10;
            const resultSpy = sinon.spy(getSqlResultImpl().prototype, 'fetch');
            const serviceSpy = sinon.spy(getSqlServiceImpl().prototype, 'fetch');

            await populateMap(entryCount);

            const result = await TestUtil.getSql(client).executeStatement({
                sql: `SELECT * FROM ${mapName}`,
                options: {
                    cursorBufferSize: 2
                }
            });

            const rows = [];
            for await (const row of result) {
                rows.push(row);
            }

            sortByKey(rows);

            for (let i = 0; i < entryCount; i++) {
                rows[i]['__key'].should.be.eq(i);
                rows[i]['this'].should.be.eq(i + 1);
            }
            rows.should.have.lengthOf(entryCount);

            resultSpy.callCount.should.be.eq(4);
            serviceSpy.callCount.should.be.eq(4);
            sinon.restore();
        });
        // TODO: add update count result type test once it's supported in Hazelcast
        // TODO: add schema test once it's supported in Hazelcast
        it('should return rows when expected result type is rows', async function () {
            const entryCount = 1;
            await populateMap(entryCount);

            const result1 = await TestUtil.getSql(client).execute(`SELECT * FROM ${mapName}`, undefined, {
                expectedResultType: 'ROWS'
            });

            const result2 = await TestUtil.getSql(client).executeStatement({
                sql: `SELECT * FROM ${mapName}`,
                options: {
                    expectedResultType: 'ROWS'
                }
            });

            for (const result of [result1, result2]) {
                (await result.isRowSet()).should.be.true;
                (await TestUtil.getUpdateCount(result)).eq(long.fromNumber(-1)).should.be.true;
            }
        });
        it('should return rows when expected result type is any and select is used', async function () {
            const entryCount = 1;
            await populateMap(entryCount);

            const result1 = await TestUtil.getSql(client).execute(`SELECT * FROM ${mapName}`, undefined, {
                expectedResultType: 'ANY'
            });

            const result2 = await TestUtil.getSql(client).executeStatement({
                sql: `SELECT * FROM ${mapName}`,
                options: {
                    expectedResultType: 'ANY'

                }
            });
            for (const result of [result1, result2]) {
                (await result.isRowSet()).should.be.true;
                (await TestUtil.getUpdateCount(result)).eq(long.fromNumber(-1)).should.be.true;
            }
        });
        it('should reject with error, if select is used and update count is expected', async function () {
            const entryCount = 1;
            await populateMap(entryCount);

            const rejectionReason1 = await TestUtil.getRejectionReasonOrThrow(async () => {
                const result = await TestUtil.getSql(client).execute(`SELECT * FROM ${mapName}`, undefined, {
                    expectedResultType: 'UPDATE_COUNT'
                });
                await result.next();
            });

            const rejectionReason2 = await TestUtil.getRejectionReasonOrThrow(async () => {
                const result = await TestUtil.getSql(client).executeStatement({
                    sql: `SELECT * FROM ${mapName}`,
                    options: {
                        expectedResultType: 'UPDATE_COUNT'
                    }
                });
                await result.next();
            });

            for (const rejectionReason of [rejectionReason1, rejectionReason2]) {
                rejectionReason.should.be.instanceof(getHazelcastSqlException());
                rejectionReason.message.should.include('update count');
            }
        });
        it('should return objects, if raw result is false', async function () {
            const entryCount = 1;
            await populateMap(entryCount);

            const result1 = await TestUtil.getSql(client).execute(`SELECT * FROM ${mapName}`, undefined, {
                returnRawResult: false
            });

            const result2 = await TestUtil.getSql(client).executeStatement({
                sql: `SELECT * FROM ${mapName}`,
                options: {
                    returnRawResult: false
                }
            });

            for (const result of [result2, result1]) {
                for await (const row of result) {
                    row.should.not.be.instanceof(getSqlRowImpl());
                    row.should.have.property('this');
                    row.should.have.property('__key');
                }
            }
        });
        it('should return sql rows, if raw result is true', async function () {
            const entryCount = 1;
            await populateMap(entryCount);

            const result1 = await TestUtil.getSql(client).execute(`SELECT * FROM ${mapName}`, undefined, {
                returnRawResult: true
            });

            const result2 = await TestUtil.getSql(client).executeStatement({
                sql: `SELECT * FROM ${mapName}`,
                options: {
                    returnRawResult: true
                }
            });

            for (const result of [result2, result1]) {
                for await (const row of result) {
                    row.should.be.instanceof(getSqlRowImpl());
                    row.should.not.have.property('this');
                    row.should.not.have.property('__key');
                }
            }
        });
    });
    describe('errors/invalid usage', function () {
        let member;
        let cluster;
        let disconnectedFired;

        beforeEach(async function () {
            disconnectedFired = deferredPromise();
            cluster = await testFactory.createClusterForParallelTests(null, CLUSTER_CONFIG);
            member = await RC.startMember(cluster.id);
            client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id,
                lifecycleListeners: [
                    (state) => {
                        if (state === LifecycleState.DISCONNECTED) {
                            disconnectedFired.resolve(true);
                        }
                    }
                ],
            }, member);
        });

        afterEach(async function () {
            await testFactory.shutdownAll();
        });

        it('should return an error if connection lost', async function () {
            TestUtil.markServerVersionAtLeast(this, client, '4.2');
            mapName = TestUtil.randomString(10);
            someMap = await client.getMap(mapName);

            await RC.terminateMember(cluster.id, member.uuid);

            // Wait until the connection is removed from the active connections
            await disconnectedFired.promise;

            const error1 = await TestUtil.getRejectionReasonOrThrow(async () => {
                await TestUtil.getSql(client).execute(`SELECT * FROM ${mapName}`);
            });
            error1.should.be.instanceof(getHazelcastSqlException());
            error1.code.should.be.eq(getSqlErrorCode().CONNECTION_PROBLEM);
            error1.originatingMemberId.should.be.eq(client.connectionManager.getClientUuid());
        });

        it('should return an error if connection lost - statement', async function () {
            TestUtil.markServerVersionAtLeast(this, client, '4.2');
            mapName = TestUtil.randomString(10);
            someMap = await client.getMap(mapName);

            await RC.terminateMember(cluster.id, member.uuid);

            // Wait until the connection is removed from the active connections
            await disconnectedFired.promise;

            const error1 = await TestUtil.getRejectionReasonOrThrow(async () => {
                await TestUtil.getSql(client).executeStatement({
                    sql: `SELECT * FROM ${mapName}`,
                    params: [],
                    options: {}
                });
            });
            error1.should.be.instanceof(getHazelcastSqlException());
            error1.code.should.be.eq(getSqlErrorCode().CONNECTION_PROBLEM);
            error1.originatingMemberId.should.be.eq(client.connectionManager.getClientUuid());
        });

        it('should return an error if sql is invalid', async function () {
            TestUtil.markServerVersionAtLeast(this, client, '4.2');
            mapName = TestUtil.randomString(10);
            someMap = await client.getMap(mapName);

            const error1 = await TestUtil.getRejectionReasonOrThrow(async () => {
                const result1 = await TestUtil.getSql(client).execute('asdasd');
                await result1.next();
            });
            error1.should.be.instanceof(getHazelcastSqlException());
            error1.code.should.be.eq(getSqlErrorCode().PARSING);
            error1.originatingMemberId.toString().should.be.eq(member.uuid);

            const error2 = await TestUtil.getRejectionReasonOrThrow(async () => {
                const result = await TestUtil.getSql(client).executeStatement({
                    sql: `--SELECT * FROM ${mapName}`,
                    params: [],
                    options: {}
                });
                await result.next();
            });
            error2.should.be.instanceof(getHazelcastSqlException());
            error2.code.should.be.eq(getSqlErrorCode().PARSING);
            error2.originatingMemberId.toString().should.be.eq(member.uuid);
        });
    });
    describe('lite member', function () {
        beforeEach(async function () {
            const jetConfigOrEmpty =
                await TestUtil.compareServerVersionWithRC(RC, '5.0') >= 0 ? '<jet enabled="true"></jet>' : '';

            const LITE_MEMBER_CONFIG = `
                <hazelcast xmlns="http://www.hazelcast.com/schema/config"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                    xsi:schemaLocation="http://www.hazelcast.com/schema/config
                    http://www.hazelcast.com/schema/config/hazelcast-config-4.0.xsd">
                    <lite-member enabled="true" />
                    ${jetConfigOrEmpty}
                </hazelcast>
            `;
            const cluster = await testFactory.createClusterForParallelTests(null, LITE_MEMBER_CONFIG);
            const member = await RC.startMember(cluster.id);
            client = await testFactory.newHazelcastClientForParallelTests({
                clusterName: cluster.id
            }, member);
        });

        afterEach(async function () {
            await testFactory.shutdownAll();
        });

        it('should return an error if sql query sent to lite member', async function () {
            TestUtil.markServerVersionAtLeast(this, client, '4.2');
            mapName = TestUtil.randomString(10);
            someMap = await client.getMap(mapName);

            const error1 = await TestUtil.getRejectionReasonOrThrow(async () => {
                const result = await TestUtil.getSql(client).execute(`SELECT * FROM ${mapName}`);
                await TestUtil.getRowMetadata(result);
            });
            error1.should.be.instanceof(getHazelcastSqlException());

            const error2 = await TestUtil.getRejectionReasonOrThrow(async () => {
                const result = await TestUtil.getSql(client).executeStatement({
                    sql: `SELECT * FROM ${mapName}`,
                    params: [],
                    options: {}
                });
                await TestUtil.getRowMetadata(result);
            });
            error2.should.be.instanceof(getHazelcastSqlException());
        });
    });
});

