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
const sinon = require('sinon');
const long = require('long');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const { Client } = require('../../../');
const { HazelcastSqlException } = require('../../../lib/core/HazelcastError');
const { SqlServiceImpl } = require('../../../lib/sql/SqlService');
const { SqlResultImpl } = require('../../../lib/sql/SqlResult');
const { SqlRowImpl } = require('../../../lib/sql/SqlRow');
const { SqlColumnType } = require('../../../lib/sql/SqlColumnMetadata');

const TestUtil = require('../../TestUtil');
const RC = require('../RC');

function randomString(length) {
    var result = [];
    var characters = 'abcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}

/**
 * Sql tests
 */
describe('SqlTest', function () {
    beforeEach(function () {
        TestUtil.markClientVersionAtLeast(this, '4.2');
    });

    describe('executeTest', function () {
        let client;
        let cluster;
        let someMap;
        let mapName;

        const populateMap = async function (numberOfRecords) {
            const entries = [];
            for (let i = 0; i < numberOfRecords; i++) {
                entries.push([i, i + 1]);
            }
            await someMap.setAll(entries);
        };

        after(async function () {
            await RC.terminateCluster(cluster.id);
            await client.shutdown();
        });

        afterEach(async function () {
            await someMap.clear();
        });

        describe('sql parameter count', function () {
            before(async function () {
                cluster = await RC.createCluster(null, null);
                await RC.startMember(cluster.id);
                client = await Client.newHazelcastClient({
                    clusterName: cluster.id
                });
            });

            beforeEach(async function () {
                someMap = await client.getMap('someMap');
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
                        const result1 = await client.getSqlService().execute(testCase.sql, validParams);
                        const result2 = await client.getSqlService().execute({
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
                        const result1 = await client.getSqlService().execute(testCase.sql, invalidParams);
                        const result2 = await client.getSqlService().execute({
                            sql: testCase.sql,
                            params: invalidParams
                        });
                        for (const result of [result1, result2]) {
                            await result.next().should.eventually.be.rejectedWith(HazelcastSqlException, 'parameter count');
                        }
                    }
                }
            });
        });
        describe('basic valid usage', function () {
            before(async function () {
                cluster = await RC.createCluster(null, null);
                await RC.startMember(cluster.id);
                client = await Client.newHazelcastClient({
                    clusterName: cluster.id
                });
            });

            beforeEach(async function () {
                mapName = randomString(10);
                someMap = await client.getMap(mapName);
            });

            // Sorts sql result rows by __key, first the smallest __key
            const sortByKey = (array) => {
                array.sort((a, b) => {
                    if (a['__key'] < b['__key']) return -1;
                    else if (a['__key'] > b['__key']) return 1;
                    else return 0;
                });
            };

            it('should execute without params', async function () {
                const entryCount = 10;
                await populateMap(entryCount);

                const result1 = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const result2 = await client.getSqlService().execute({
                    sql: `SELECT * FROM ${mapName}`
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
            });

            it('should execute with params', async function () {
                const entryCount = 10;
                const limit = 6;

                await populateMap(entryCount);
                // At this point the map includes [0, 1], [1, 2].. [9, 10]

                // There should be "limit" results
                const result1 = await client.getSqlService().execute(`SELECT * FROM ${mapName} WHERE this <= ?`, [limit]);
                const result2 = await client.getSqlService().execute({
                    sql: `SELECT * FROM ${mapName} WHERE this <= ?`,
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
            });
        });
        describe('options', function () {
            before(async function () {
                cluster = await RC.createCluster(null, null);
                await RC.startMember(cluster.id);
                client = await Client.newHazelcastClient({
                    clusterName: cluster.id
                });
            });

            beforeEach(async function () {
                mapName = randomString(10);
                someMap = await client.getMap(mapName);
            });

            // Sorts sql result rows by __key, first the smallest __key
            const sortByKey = (array) => {
                array.sort((a, b) => {
                    if (a['__key'] < b['__key']) return -1;
                    else if (a['__key'] > b['__key']) return 1;
                    else return 0;
                });
            };

            it('should paginate according to cursorBufferSize', async function () {
                const entryCount = 10;
                const resultSpy = sinon.spy(SqlResultImpl.prototype, 'fetch');
                const serviceSpy = sinon.spy(SqlServiceImpl.prototype, 'fetch');

                await populateMap(entryCount);

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`, undefined, {
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
                const resultSpy = sinon.spy(SqlResultImpl.prototype, 'fetch');
                const serviceSpy = sinon.spy(SqlServiceImpl.prototype, 'fetch');

                await populateMap(entryCount);

                const result = await client.getSqlService().execute({
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
            // TODO: add update count result type test once it's supported in imdg
            // TODO: add schema test once it's supported in imdg
            it('should return rows when expected result type is rows', async function () {
                const entryCount = 1;
                await populateMap(entryCount);

                const result1 = await client.getSqlService().execute(`SELECT * FROM ${mapName}`, undefined, {
                    expectedResultType: 'ROWS'
                });

                const result2 = await client.getSqlService().execute({
                    sql: `SELECT * FROM ${mapName}`,
                    options: {
                        expectedResultType: 'ROWS'
                    }
                });

                for (const result of [result1, result2]) {
                    (await result.isRowSet()).should.be.true;
                    (await result.getUpdateCount()).eq(long.fromNumber(-1)).should.be.true;
                }
            });
            it('should return rows when expected result type is any and select is used', async function () {
                const entryCount = 1;
                await populateMap(entryCount);

                const result1 = await client.getSqlService().execute(`SELECT * FROM ${mapName}`, undefined, {
                    expectedResultType: 'ANY'
                });

                const result2 = await client.getSqlService().execute({
                    sql: `SELECT * FROM ${mapName}`,
                    options: {
                        expectedResultType: 'ANY'

                    }
                });
                for (const result of [result1, result2]) {
                    (await result.isRowSet()).should.be.true;
                    (await result.getUpdateCount()).eq(long.fromNumber(-1)).should.be.true;
                }
            });
            it('should reject with error, if select is used and update count is expected', async function () {
                const entryCount = 1;
                await populateMap(entryCount);

                const result1 = await client.getSqlService().execute(`SELECT * FROM ${mapName}`, undefined, {
                    expectedResultType: 'UPDATE_COUNT'
                });

                const result2 = await client.getSqlService().execute({
                    sql: `SELECT * FROM ${mapName}`,
                    options: {
                        expectedResultType: 'UPDATE_COUNT'
                    }
                });

                for (const result of [result2, result1]) {
                    try {
                        await result.next();
                        throw new Error('dummy');
                    } catch (e) {
                        e.should.be.instanceof(HazelcastSqlException);
                        e.message.should.include('update count');
                    }
                }
            });
            it('should return objects, if raw result is false', async function () {
                const entryCount = 1;
                await populateMap(entryCount);

                const result1 = await client.getSqlService().execute(`SELECT * FROM ${mapName}`, undefined, {
                    returnRawResult: false
                });
                const result2 = await client.getSqlService().execute(`SELECT * FROM ${mapName}`, undefined, {
                    returnRawResult: false
                });

                for (const result of [result2, result1]) {
                    for await (const row of result) {
                        row.should.not.be.instanceof(SqlRowImpl);
                        row.should.have.property('this');
                        row.should.have.property('__key');
                    }
                }
            });
            it('should return sql rows, if raw result is true', async function () {
                const entryCount = 1;
                await populateMap(entryCount);

                const result1 = await client.getSqlService().execute(`SELECT * FROM ${mapName}`, undefined, {
                    returnRawResult: true
                });

                const result2 = await client.getSqlService().execute(`SELECT * FROM ${mapName}`, undefined, {
                    returnRawResult: true
                });

                for (const result of [result2, result1]) {
                    for await (const row of result) {
                        row.should.be.instanceof(SqlRowImpl);
                        row.should.not.have.property('this');
                        row.should.not.have.property('__key');
                    }
                }
            });
        });
        describe('parameter data types', function () {
            class Employee {
                constructor(id, name) {
                    this.id = id;
                    this.name = name;
                    this.factoryId = 1000;
                    this.classId = 100;
                }

                readData(input) {
                    this.id = input.readInt();
                    this.name = input.readString();
                }

                writeData(output) {
                    output.writeInt(this.id);
                    output.writeString(this.name);
                }
            }

            class Customer {
                constructor(name, id, lastOrder) {
                    this.name = name;
                    this.id = id;
                    this.lastOrder = lastOrder;
                    this.factoryId = 1;
                    this.classId = 1;
                }

                readPortable(reader) {
                    this.name = reader.readString('name');
                    this.id = reader.readInt('id');
                    this.lastOrder = reader.readLong('lastOrder').toNumber();
                }

                writePortable(writer) {
                    writer.writeString('name', this.name);
                    writer.writeInt('id', this.id);
                    writer.writeLong('lastOrder', long.fromNumber(this.lastOrder));
                }
            }

            function portableFactory(classId) {
                if (classId === 1) {
                    return new Customer();
                }
                return null;
            }

            function sampleDataSerializableFactory(classId) {
                if (classId === 100) {
                    return new Employee();
                }
                return null;
            }

            before(async function () {
                cluster = await RC.createCluster(null, null);
                await RC.startMember(cluster.id);
                client = await Client.newHazelcastClient({
                    clusterName: cluster.id,
                    serialization: {
                        defaultNumberType: 'Double',
                        dataSerializableFactories: {
                            1000: sampleDataSerializableFactory
                        },
                        portableFactories: {
                            1: portableFactory
                        }
                    }
                });
            });

            beforeEach(async function () {
                mapName = randomString(10);
                someMap = await client.getMap(mapName);
            });

            /*
            export enum SqlColumnType {
                VARCHAR,
                BOOLEAN,
                TINYINT,
                SMALLINT,
                INTEGER,
                BIGINT,
                DECIMAL,
                REAL,
                DOUBLE,
                DATE,
                TIME,
                TIMESTAMP,
                TIMESTAMP_WITH_TIME_ZONE,
                OBJECT,
                NULL
            }
             */
            it('should be able to send and retrieve number', async function () {
                await someMap.set('a', 1);

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    row['this'].should.be.a('number');
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.DOUBLE);
            });

            it('should be able to send and retrieve long', async function () {
                await someMap.set('a', long.fromNumber(1));

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    long.isLong(row['this']).should.be.true;
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BIGINT);
            });

            it('should be able to send and retrieve string', async function () {
                await someMap.set('a', '1');

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    long.isLong(row['this']).should.be.a('string');
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.VARCHAR);
            });

            it('should be able to send and retrieve boolean', async function () {
                await someMap.set('a', true);

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    long.isLong(row['this']).should.be.a('boolean');
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BOOLEAN);
            });

            it('should be able to send and retrieve date', async function () {
                await someMap.set('a', 1);

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    long.isLong(row['this']).should.be.true;
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.DATE);
            });

            it('should be able to send and retrieve a', async function () {
                await someMap.set('a', long.fromNumber(1));

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    long.isLong(row['this']).should.be.true;
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BIGINT);
            });

            it('should be able to send and retrieve b', async function () {
                await someMap.set('a', long.fromNumber(1));

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    long.isLong(row['this']).should.be.true;
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BIGINT);
            });

            it('should be able to send and retrieve c', async function () {
                await someMap.set('a', long.fromNumber(1));

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    long.isLong(row['this']).should.be.true;
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BIGINT);
            });

            it('should be able to send and retrieve d', async function () {
                await someMap.set('a', long.fromNumber(1));

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    long.isLong(row['this']).should.be.true;
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BIGINT);
            });

            it('should be able to send and retrieve e', async function () {
                await someMap.set('a', long.fromNumber(1));

                const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                for await (const row of result) {
                    long.isLong(row['this']).should.be.true;
                }
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BIGINT);
            });
        });
        describe('errors/invalid usage', function () {
            before(async function () {
                cluster = await RC.createCluster(null, null);
                await RC.startMember(cluster.id);
                client = await Client.newHazelcastClient({
                    clusterName: cluster.id
                });
            });

            beforeEach(async function () {
                mapName = randomString(10);
                someMap = await client.getMap(mapName);
            });

            // lite member
            // connection problem
            // invalid sql strings
        });
    });
    describe('sql result', function () {
        // user close
    });
    describe('sql row', function () {

    });
});

