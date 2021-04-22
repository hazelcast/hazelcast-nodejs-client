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
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
const { Client } = require('../../../');
const { HazelcastSqlException } = require('../../../lib/core/HazelcastError');

const TestUtil = require('../../TestUtil');
const RC = require('../RC');

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
        // let member;
        const numberOfRecords = 20;

        before(async function () {
            cluster = await RC.createCluster(null, null);
            // member = await RC.startMember(cluster.id);
            await RC.startMember(cluster.id);
            client = await Client.newHazelcastClient({
                clusterName: cluster.id
            });
        });

        beforeEach(async function () {
            someMap = await client.getMap('someMap');
            await someMap.clear();
            for (let i=0; i < numberOfRecords; i++) {
                await someMap.set(i.toString(), i);
            }
        });

        afterEach(async function () {
            await RC.terminateCluster(cluster.id);
            await client.shutdown();
        });

        const testCases = [
            {
                sql: 'SELECT * FROM someMap WHERE this > ?',
                invalidParams: [
                    [1, 2],
                    [1, 2, 3],
                    []
                ],
                validParams: [
                    [1],
                    [2],
                    [3]
                ]
            },
            {
                sql: 'SELECT * FROM someMap WHERE this > CAST(? AS INTEGER) + CAST(? AS INTEGER)', // need this 'workaround'
                invalidParams: [
                    [1],
                    [1, 2, 3],
                    []
                ],
                validParams: [
                    [1, 2],
                    [2, 3],
                    [1, 3]
                ]
            },
            {
                sql: 'SELECT * FROM someMap WHERE this > (CAST(? AS INTEGER) + CAST(? AS INTEGER)) / CAST(? AS INTEGER)',
                invalidParams: [
                    [1, 2, 3, 4],
                    [2, 3],
                    []
                ],
                validParams: [
                    [1, 2, 4],
                    [2, 3, 5]
                ]
            }
        ];

        it('should throw an error if parameters are mismatching with the placeholders in the sql string', async function () {
            for (const testCase of testCases) {
                for (const validParam of testCase.validParams) {
                    const sqlResult = await client.getSqlService().execute(testCase.sql, validParam);
                    const nextResult = await sqlResult.next();
                    nextResult.should.have.property('done');
                    nextResult.should.have.property('value');
                }
                for (const invalidParam of testCase.invalidParams) {
                    const sqlResult = await client.getSqlService().execute(testCase.sql, invalidParam);
                    await sqlResult.next().should.eventually.be.rejectedWith(HazelcastSqlException, 'parameter count');
                }
            }
        });
    });
});

