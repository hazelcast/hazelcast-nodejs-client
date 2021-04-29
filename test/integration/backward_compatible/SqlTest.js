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
const should = chai.should();

const { Client } = require('../../../');
const { HazelcastSqlException } = require('../../../lib/core/HazelcastError');
const { SqlServiceImpl } = require('../../../lib/sql/SqlService');
const { SqlResultImpl } = require('../../../lib/sql/SqlResult');
const { SqlRowImpl } = require('../../../lib/sql/SqlRow');
const { Lang } = require('../remote_controller/remote-controller_types');
const { SqlColumnType } = require('../../../lib/sql/SqlColumnMetadata');
const {
    HzLocalDate,
    HzLocalDateTime,
    HzOffsetDateTime,
    HzLocalTime
} = require('../../../lib/sql/DatetimeWrapperClasses');

const TestUtil = require('../../TestUtil');
const RC = require('../RC');

function randomString(length) {
    const result = [];
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
}

/**
 * Sql tests
 */
describe('SqlTest', function () {
    // Sorts sql result rows by __key, first the smallest __key
    const sortByKey = (array) => {
        array.sort((a, b) => {
            if (a['__key'] < b['__key']) return -1;
            else if (a['__key'] > b['__key']) return 1;
            else return 0;
        });
    };

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

            after(async function () {
                await RC.terminateCluster(cluster.id);
                await client.shutdown();
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

            after(async function () {
                await RC.terminateCluster(cluster.id);
                await client.shutdown();
            });

            afterEach(async function () {
                await someMap.clear();
            });

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

            after(async function () {
                await RC.terminateCluster(cluster.id);
                await client.shutdown();
            });

            afterEach(async function () {
                await someMap.clear();
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
                    const rejectionReason = await TestUtil.getRejectionReasonOrDummy(result, 'next');
                    rejectionReason.should.be.instanceof(HazelcastSqlException);
                    rejectionReason.message.should.include('update count');
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
        describe('return type test (decode)', function () {

            const SERVER_CONFIG = `
                <hazelcast xmlns="http://www.hazelcast.com/schema/config"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.hazelcast.com/schema/config
                http://www.hazelcast.com/schema/config/hazelcast-config-4.0.xsd">
                    <serialization>
                        <portable-factories>
                            <portable-factory factory-id="666">com.hazelcast.client.test.PortableFactory
                            </portable-factory>
                            <portable-factory factory-id="100">com.hazelcast.client.test.ClassroomFactory
                            </portable-factory>
                            <portable-factory factory-id="1000">com.hazelcast.client.test.EmployeeFactory
                            </portable-factory>
                        </portable-factories>
                    </serialization>
                </hazelcast>
            `;

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

            class Student {
                constructor(age, height) {
                    this.age = age;
                    this.height = height;
                    this.factoryId = 666;
                    this.classId = 6;
                }

                readPortable(reader) {
                    this.age = reader.readLong('age');
                    this.height = reader.readFloat('height');
                }

                writePortable(writer) {
                    writer.writeLong('age', this.age);
                    writer.writeFloat('height', this.height);
                }
            }

            class Classroom {
                constructor(className, students) {
                    this.students = students;
                    this.className = className;
                    this.factoryId = 100;
                    this.classId = 333;
                }

                readPortable(reader) {
                    this.className = reader.readString('className');
                    this.students = reader.readPortableArray('students');
                }

                writePortable(writer) {
                    writer.writeString('className', this.className);
                    writer.writePortableArray('students', this.students);
                }
            }

            class SmallClassroom {
                constructor(className, student) {
                    this.student = student;
                    this.className = className;
                    this.factoryId = 100;
                    this.classId = 333;
                }

                readPortable(reader) {
                    this.className = reader.readString('className');
                    this.student = reader.readPortable('student');
                }

                writePortable(writer) {
                    writer.writeString('className', this.className);
                    writer.writePortable('student', this.student);
                }
            }

            function otherPortFac(classId) {
                if (classId === 333) return new Classroom();
                return null;
            }

            function portableFactory(classId) {
                if (classId === 6) return new Student();
                return null;
            }

            function sampleDataSerializableFactory(classId) {
                if (classId === 100) {
                    return new Employee();
                }
                return null;
            }

            before(async function () {
                cluster = await RC.createCluster(null, SERVER_CONFIG);
                await RC.startMember(cluster.id);
                client = await Client.newHazelcastClient({
                    clusterName: cluster.id,
                    serialization: {
                        dataSerializableFactories: {
                            1000: sampleDataSerializableFactory
                        },
                        portableFactories: {
                            666: portableFactory,
                            100: otherPortFac
                        }
                    }
                });
            });

            beforeEach(async function () {
                mapName = randomString(10);
                someMap = await client.getMap(mapName);
            });

            after(async function () {
                await RC.terminateCluster(cluster.id);
                await client.shutdown();
            });

            afterEach(async function () {
                await someMap.clear();
            });

            it('should be able to decode VARCHAR', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 0; key < 10; key++) {
                        map.set(new java.lang.Integer(key), new java.lang.String(key.toString()));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.VARCHAR);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 10; i++) {
                    rows[i]['this'].should.be.eq(i.toString());
                    rows[i]['__key'].should.be.eq(i);
                }
            });
            it('should be able to decode BOOLEAN', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 0; key < 10; key++) {
                        map.set(new java.lang.Integer(key), new java.lang.Boolean(key % 2 == 0));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BOOLEAN);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 10; i++) {
                    rows[i]['this'].should.be.eq(i % 2 === 0);
                    rows[i]['__key'].should.be.eq(i);
                }
            });
            it('should be able to decode TINYINT', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 0; key < 10; key++) {
                        map.set(new java.lang.Integer(key), new java.lang.Byte(key * 2));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.TINYINT);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 10; i++) {
                    rows[i]['this'].should.be.eq(i * 2);
                    rows[i]['__key'].should.be.eq(i);
                }
            });
            it('should be able to decode SMALLINT', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 0; key < 10; key++) {
                        map.set(new java.lang.Integer(key), new java.lang.Short(key * 2));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.SMALLINT);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 10; i++) {
                    rows[i]['this'].should.be.eq(i * 2);
                    rows[i]['__key'].should.be.eq(i);
                }
            });
            it('should be able to decode INTEGER', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 0; key < 10; key++) {
                        map.set(new java.lang.Integer(key), new java.lang.Integer(key * 2));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.INTEGER);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 10; i++) {
                    rows[i]['this'].should.be.eq(i * 2);
                    rows[i]['__key'].should.be.eq(i);
                }
            });
            it('should be able to decode BIGINT', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 0; key < 10; key++) {
                        map.set(new java.lang.Integer(key), new java.lang.Long(key * 2));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.BIGINT);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 10; i++) {
                    rows[i]['this'].eq(long.fromNumber(i * 2)).should.be.true;
                    rows[i]['__key'].should.be.eq(i);
                }
            });
            it('should be able to decode DECIMAL', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    map.set(new java.lang.Integer(0), new java.math.BigDecimal('0.1111112983672389172378619283677891'));
                    map.set(new java.lang.Integer(1), new java.math.BigDecimal('0.00000000000000000000000000000001'));
                    map.set(new java.lang.Integer(2), new java.math.BigDecimal('132165413213543156412374800000000'));
                    map.set(new java.lang.Integer(3), new java.math.BigDecimal('1234'));
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.DECIMAL);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                const expectedResults = [
                    '0.1111112983672389172378619283677891', // scale is equals to bigint length
                    '0.00000000000000000000000000000001', // scale is more than bigint length
                    '132165413213543156412374800000000', // scale is negative
                    '1234' // scale is zero
                ];

                for (let i = 0; i < 4; i++) {
                    rows[i]['this'].should.be.eq(expectedResults[i]);
                    rows[i]['__key'].should.be.eq(i);
                }
            });
            it('should be able to decode REAL', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 1; key < 10; key++) {
                        map.set(new java.lang.Integer(key), new java.lang.Float('0.' + key.toString()));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.REAL);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 1; i < 10; i++) {
                    (rows[i - 1]['this'] - i / 10).should.be.lessThan(1e-5);
                    rows[i - 1]['__key'].should.be.eq(i);
                }
            });
            it('should be able to decode DOUBLE', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 1; key < 10; key++) {
                        map.set(new java.lang.Integer(key), new java.lang.Double('0.' + key.toString()));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.DOUBLE);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 1; i < 10; i++) {
                    (rows[i - 1]['this'] - i / 10).should.be.lessThan(1e-5);
                    rows[i - 1]['__key'].should.be.eq(i);
                }
            });
            it('should be able to decode DATE', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 1; key < 12; key++) {
                        map.set(new java.lang.Integer(key), java.time.LocalDate.of(key+2,key+1,key));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.DATE);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 11; i++) {
                    const date = rows[i]['this'];
                    date.should.be.instanceof(HzLocalDate);

                    date.getYear().should.be.eq(i + 3);
                    date.getMonth().should.be.eq(i + 2);
                    date.getDate().should.be.eq(i + 1);

                    rows[i]['__key'].should.be.eq(i + 1);
                }
            });
            it('should be able to decode TIME', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 1; key < 12; key++) {
                        map.set(new java.lang.Integer(key), java.time.LocalTime.of(key+3,key+2,key+1,key + 1e8));
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.TIME);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 11; i++) {
                    const time = rows[i]['this'];
                    time.should.be.instanceof(HzLocalTime);

                    time.getHour().should.be.eq(i + 4);
                    time.getMinute().should.be.eq(i + 3);
                    time.getSecond().should.be.eq(i + 2);
                    time.getNano().should.be.eq(i + 1 + 1e8);

                    rows[i]['__key'].should.be.eq(i + 1);
                }
            });
            it('should be able to decode TIMESTAMP', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 1; key < 12; key++) {
                        map.set(
                          new java.lang.Integer(key),
                          java.time.LocalDateTime.of(key+6, key, key+4, key+3, key+2, key+1, key + 1e8)
                        );
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this')).type.should.be.eq(SqlColumnType.TIMESTAMP);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 11; i++) {
                    const datetime = rows[i]['this'];
                    datetime.should.be.instanceof(HzLocalDateTime);

                    datetime.getHzLocalDate().getYear().should.be.eq(i + 7);
                    datetime.getHzLocalDate().getMonth().should.be.eq(i + 1);
                    datetime.getHzLocalDate().getDate().should.be.eq(i + 5);

                    datetime.getHzLocalTime().getHour().should.be.eq(i + 4);
                    datetime.getHzLocalTime().getMinute().should.be.eq(i + 3);
                    datetime.getHzLocalTime().getSecond().should.be.eq(i + 2);
                    datetime.getHzLocalTime().getNano().should.be.eq(i + 1 + 1e8);

                    rows[i]['__key'].should.be.eq(i + 1);
                }
            });
            it('should be able to decode TIMESTAMP WITH TIMEZONE', async function () {
                const script = `
                    var map = instance_0.getMap("${mapName}");
                    for (var key = 1; key < 12; key++) {
                        map.set(
                          new java.lang.Integer(key),
                          java.time.OffsetDateTime.of(
                            key+6, key, key+4, key+3, key+2, key+1, key + 1e8,
                            java.time.ZoneOffset.ofTotalSeconds(key * key * key)
                          )
                        );
                    }
                `;
                await RC.executeOnController(cluster.id, script, Lang.JAVASCRIPT);
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this'))
                    .type.should.be.eq(SqlColumnType.TIMESTAMP_WITH_TIME_ZONE);

                const rows = [];

                for await (const row of result) {
                    rows.push(row);
                }
                sortByKey(rows);

                for (let i = 0; i < 11; i++) {
                    const datetimeWithOffset = rows[i]['this'];
                    datetimeWithOffset.should.be.instanceof(HzOffsetDateTime);

                    datetimeWithOffset.getHzLocalDateTime().getHzLocalDate().getYear().should.be.eq(i + 7);
                    datetimeWithOffset.getHzLocalDateTime().getHzLocalDate().getMonth().should.be.eq(i + 1);
                    datetimeWithOffset.getHzLocalDateTime().getHzLocalDate().getDate().should.be.eq(i + 5);

                    datetimeWithOffset.getHzLocalDateTime().getHzLocalTime().getHour().should.be.eq(i + 4);
                    datetimeWithOffset.getHzLocalDateTime().getHzLocalTime().getMinute().should.be.eq(i + 3);
                    datetimeWithOffset.getHzLocalDateTime().getHzLocalTime().getSecond().should.be.eq(i + 2);
                    datetimeWithOffset.getHzLocalDateTime().getHzLocalTime().getNano().should.be.eq(i + 1 + 1e8);

                    datetimeWithOffset.getOffsetSeconds().should.be.eq((i + 1) ** 3);

                    rows[i]['__key'].should.be.eq(i + 1);
                }
            });
            it('should be able to decode OBJECT(portable)', async function () {
                const student = new Student(long.fromNumber(12), 123.23);
                await someMap.put(0, student);

                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);

                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('age')).type.should.be.eq(SqlColumnType.BIGINT);
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('height')).type.should.be.eq(SqlColumnType.REAL);

                const row = (await result.next()).value;
                row['age'].eq(student.age).should.be.true;
                (row['height'] - student.height).should.be.lessThan(1e-5);
                row['__key'].should.be.eq(0);
            });

            it.skip('should be able to decode nested portable array', async function () {
                const classroom = new Classroom('asd', [
                    new Student(long.fromNumber(12), 123.23),
                    new Student(long.fromNumber(13), 123.23)
                ]);

                await someMap.put(0, classroom);
                // console.log(await someMap.get(0));
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);

                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('students')).type.should.be.eq(SqlColumnType.OBJECT);
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('className')).type.should.be.eq(SqlColumnType.VARCHAR);

                const row = (await result.next()).value;
                row['className'].should.be.eq(classroom.className);
                row['students'].should.be.eq(classroom.students);
                row['__key'].should.be.eq(0);
            });

            it.skip('should be able to decode nested portable', async function () {
                const classroom = new SmallClassroom('asd', new Student(long.fromNumber(13), 123.23));
                await someMap.put(0, classroom);

                // console.log(await someMap.get(0));
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);

                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('student')).type.should.be.eq(SqlColumnType.OBJECT);
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('className')).type.should.be.eq(SqlColumnType.VARCHAR);

                const row = (await result.next()).value;
                row['className'].should.be.eq(classroom.className);
                row['student'].should.be.eq(classroom.student);
                row['__key'].should.be.eq(0);
            });

            it.skip('should be able to decode OBJECT(identified data serializable)', async function () {
                const emp = new Employee(1, 'ali');
                await someMap.put(0, emp);

                // console.log(await someMap.get(0));
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);

                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('id')).type.should.be.eq(SqlColumnType.INTEGER);
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('name')).type.should.be.eq(SqlColumnType.VARCHAR);

                const row1 = (await result.next()).value;
                row1['id'].should.be.eq(emp.id);
                row1['name'].should.be.eq(emp.name);
                row1['__key'].should.be.eq(0);
            });

            it.skip('should be able to decode NULL', async function () {
                const result = client.getSqlService().execute(`SELECT * FROM ${mapName}`);
                const rowMetadata = await result.getRowMetadata();
                rowMetadata.getColumnByIndex(rowMetadata.findColumn('this'))
                    .type.should.be.eq(SqlColumnType.NULL);
                const row = await result.next();
                should.equal(row['this'], null);
                row['__key'].should.be.eq(0);
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

            after(async function () {
                await RC.terminateCluster(cluster.id);
                await client.shutdown();
            });

            afterEach(async function () {
                await someMap.clear();
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

