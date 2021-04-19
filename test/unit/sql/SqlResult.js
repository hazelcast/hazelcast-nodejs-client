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

const long = require('long');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('chai');
const { SqlResultImpl } = require('../../../lib/sql/SqlResult');
const { SqlRowImpl } = require('../../../lib/sql/SqlRow');
const { SqlPage, ColumnarDataHolder } = require('../../../lib/sql/SqlPage');
const { SqlRowMetadataImpl } = require('../../../lib/sql/SqlRowMetadata');
const { SqlColumnType } = require('../../../lib/sql/SqlColumnMetadata');

describe('SqlResultTest', function () {
    describe('next', function () {

        let fakeSqlService;
        let fakeConnection;
        let fakeQueryId;

        beforeEach(function () {
            fakeSqlService = sandbox.fake();
            fakeConnection = sandbox.fake();
            fakeQueryId = sandbox.fake();
        });

        afterEach(function () {
            sandbox.restore();
        });

        function prepareSuccessfulSqlResult(sqlResult) {
            const rowPage = new SqlPage(
                [0, 0], // column types
                new ColumnarDataHolder([['a', 'c', 'e'], ['b', 'd', 'f']]),
                true // isLast
            );
            const rowMetadata = new SqlRowMetadataImpl([
                {
                    name: 'foo',
                    type: SqlColumnType.VARCHAR,
                    nullable: true
                },
                {
                    name: 'bar',
                    type: SqlColumnType.VARCHAR,
                    nullable: true
                }
            ]);

            sqlResult.onExecuteResponse(rowMetadata, rowPage, long.ZERO);
            return sqlResult;
        }

        it('should be async iterable and iterates over objects by default and if returnRaw is false', function () {
            [
                new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096),
                new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096, false)
            ].forEach(async sqlResult => {
                prepareSuccessfulSqlResult(sqlResult);

                let rowCounter = 0;
                for await (const row of sqlResult) {
                    expect(row).not.to.be.instanceof(SqlRowImpl);
                    rowCounter++;
                }
                expect(rowCounter).to.be.eq(3);
            });

        });

        it('should be async iterable and iterate over SqlRowImpl if raw result is requested', async function () {
            const sqlResult = new SqlResultImpl(
                fakeSqlService,
                fakeConnection,
                fakeQueryId,
                4096,
                true // return raw results
            );

            prepareSuccessfulSqlResult(sqlResult);

            let rowCounter = 0;
            for await (const row of sqlResult) {
                expect(row).to.be.instanceof(SqlRowImpl);
                rowCounter++;
            }
            expect(rowCounter).to.be.eq(3);
        });

    });
    describe('close', function () {

        beforeEach(function () {

        });

        afterEach(function () {
            sandbox.restore();
        });

    });
    describe('getRowMetadata', function () {

        beforeEach(function () {

        });

        afterEach(function () {
            sandbox.restore();
        });

    });
    describe('isRowSet', function () {

        beforeEach(function () {

        });

        afterEach(function () {
            sandbox.restore();
        });

    });
    describe('getUpdateCount', function () {

        beforeEach(function () {

        });

        afterEach(function () {
            sandbox.restore();
        });

    });
    describe('onNextPage', function () {

        beforeEach(function () {

        });

        afterEach(function () {
            sandbox.restore();
        });

    });
    describe('onExecuteError', function () {

        beforeEach(function () {

        });

        afterEach(function () {
            sandbox.restore();
        });

    });
});
