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
const long = require('long');

const RC = require('../../RC');
const TestUtil = require('../../../TestUtil');
const { Client } = require('../../../../');
const { SqlErrorCode } = require('../../../../lib/sql/SqlErrorCode');
const { SqlRowMetadataImpl } = require('../../../../lib/sql/SqlRowMetadata');
const { HazelcastSqlException } = require('../../../../lib/core/HazelcastError');

describe('SqlResultTest', function () {
    let client;
    let cluster;
    let someMap;
    let mapName;
    let result;

    before(async function () {
        TestUtil.markClientVersionAtLeast(this, '4.2');
        cluster = await RC.createCluster(null, null);
        await RC.startMember(cluster.id);
        client = await Client.newHazelcastClient({
            clusterName: cluster.id
        });
    });

    beforeEach(async function () {
        mapName = TestUtil.randomString(10);
        someMap = await client.getMap(mapName);
        await someMap.put(0, 1);
        await someMap.put(1, 2);
        await someMap.put(2, 3);

        result = client.getSqlService().execute(`SELECT * FROM ${mapName} WHERE this > ?`, [1]);
    });

    after(async function () {
        await RC.terminateCluster(cluster.id);
        await client.shutdown();
    });

    afterEach(async function () {
        await someMap.clear();
    });

    it('should reject iteration after close()', async function () {
        await result.close();

        try {
            for await (const row of result) {
                console.log(row);
            }
            throw new Error('dummy');
        } catch (e) {
            e.should.be.instanceof(HazelcastSqlException);
            e.code.should.be.eq(SqlErrorCode.CANCELLED_BY_USER);
            e.message.should.include('Cancelled');
            e.originatingMemberId.should.be.eq(client.connectionManager.getClientUuid());
        }
    });

    it('getters should work', async function () {
        const rowMetadata = await result.getRowMetadata();
        rowMetadata.should.be.instanceof(SqlRowMetadataImpl);
        rowMetadata.getColumnCount().should.be.eq(2);

        const isRowSet = await result.isRowSet();
        isRowSet.should.be.true;

        const updateCount = await result.getUpdateCount();
        updateCount.eq(long.fromNumber(-1)).should.be.true;
    });
});