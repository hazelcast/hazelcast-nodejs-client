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
//
'use strict';

const chai = require('chai');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const { Client } = require('../../../');
const { HazelcastSqlException } = require('../../../lib/core/HazelcastError');
const { SqlServiceImpl } = require('../../../lib/sql/SqlService');
const { SqlResultImpl } = require('../../../lib/sql/SqlResult');

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
describe('SqlServiceTest', function () {
    beforeEach(function () {
        TestUtil.markClientVersionAtLeast(this, '4.2');
    });

    describe('parameterCountTest', function () {
        let client;
        let cluster;
        let someMap;

        before(async function () {
            cluster = await RC.createCluster(null, null);
            // member = await RC.startMember(cluster.id);
            await RC.startMember(cluster.id);
            client = await Client.newHazelcastClient({
                clusterName: cluster.id
            });
        });

        after(async function () {
            await RC.terminateCluster(cluster.id);
            await client.shutdown();
        });

        beforeEach(async function () {
            someMap = await client.getMap('someMap');
            await someMap.set(1, 2);
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
            // via params
            for (const testCase of testCases) {
                for (const validParams of testCase.validParamsArray) {
                    const sqlResult = await client.getSqlService().execute(testCase.sql, validParams);
                    const nextResult = await sqlResult.next();
                    nextResult.should.have.property('done');
                    nextResult.should.have.property('value');
                }
            }
            // sql statement
            for (const testCase of testCases) {
                for (const validParams of testCase.validParamsArray) {
                    const sqlResult = await client.getSqlService().execute({
                        sql: testCase.sql,
                        params: validParams
                    });
                    const nextResult = await sqlResult.next();
                    nextResult.should.have.property('done');
                    nextResult.should.have.property('value');
                }
            }
        });

        it('should reject iteration if parameter count is different than placeholder count', async function () {
            for (const testCase of testCases) {
                // via params
                for (const invalidParams of testCase.invalidParamsArray) {
                    const sqlResult = await client.getSqlService().execute(testCase.sql, invalidParams);
                    await sqlResult.next().should.eventually.be.rejectedWith(HazelcastSqlException, 'parameter count');
                }
                // via sql statement
                for (const invalidParams of testCase.invalidParamsArray) {
                    const sqlResult = await client.getSqlService().execute({
                        sql: testCase.sql,
                        params: invalidParams
                    });
                    await sqlResult.next().should.eventually.be.rejectedWith(HazelcastSqlException, 'parameter count');
                }
            }
        });
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

        before(async function () {
            cluster = await RC.createCluster(null, null);
            // member = await RC.startMember(cluster.id);
            await RC.startMember(cluster.id);
            client = await Client.newHazelcastClient({
                clusterName: cluster.id
            });
        });

        beforeEach(async function () {
            mapName = randomString(10);
            someMap = await client.getMap(mapName);
        });

        afterEach(async function () {
            await someMap.destroy();
        });

        after(async function () {
            await RC.terminateCluster(cluster.id);
            await client.shutdown();
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

            const result = await client.getSqlService().execute(`SELECT * FROM ${mapName}`);
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
        });

        it('should execute with params', async function () {
            const entryCount = 10;
            const limit = 6;

            await populateMap(entryCount);
            // At this point the map includes [0, 1], [1, 2].. [9, 10]

            // There should be "limit" results
            const result = await client.getSqlService().execute(`SELECT * FROM ${mapName} WHERE this <= ?`, [limit]);
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
        });

        it('should execute statement without params', async function () {
            const entryCount = 10;
            await populateMap(entryCount);

            const sqlStatement = {
                sql: `SELECT * FROM ${mapName}`,
            };

            const result = await client.getSqlService().execute(sqlStatement);
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
        });

        it('should execute statement with params', async function () {
            const entryCount = 10;
            const limit = 6;

            await populateMap(entryCount);
            // At this point the map includes [0, 1], [1, 2].. [9, 10]

            // There should be "limit" results

            const sqlStatement = {
                sql: `SELECT * FROM ${mapName} WHERE this <= ?`,
                params: [limit]
            };

            const result = await client.getSqlService().execute(sqlStatement);
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
        });

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
    });
});

