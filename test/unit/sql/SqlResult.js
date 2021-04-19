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
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const { delayedPromise } = require('../../../lib/util/Util');
const { SqlResultImpl } = require('../../../lib/sql/SqlResult');
const { SqlRowImpl } = require('../../../lib/sql/SqlRow');
const { SqlPage, ColumnarDataHolder } = require('../../../lib/sql/SqlPage');
const { SqlRowMetadataImpl } = require('../../../lib/sql/SqlRowMetadata');
const { SqlColumnType } = require('../../../lib/sql/SqlColumnMetadata');
const { SqlErrorCode } = require('../../../lib/sql/SqlErrorCode');
const { HazelcastSqlException } = require('../../../lib/core/HazelcastError');

describe('SqlResultTest', function () {
    describe('iteration', function () {

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

        function prepareSuccessfulSqlResult(sqlResult, rowCount) {
            const columns = [];
            for (let i = 0; i < 2; i++) { // column number
                const column = [];
                for (let j = 0; j<rowCount; j++) {
                    column.push((i*rowCount + j).toString());
                }
                columns.push(column);
            }

            const rowPage = new SqlPage(
                [0, 0], // column types
                new ColumnarDataHolder(columns),
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

        it('should be async iterable, iterating over objects; by default and if returnRawResults is false', function () {
            [
                new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096),
                new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096, false)
            ].forEach(async sqlResult => {
                const rowCount = 3;
                prepareSuccessfulSqlResult(sqlResult, rowCount);

                let rowCounter = 0;
                for await (const row of sqlResult) {
                    expect(row).not.to.be.instanceof(SqlRowImpl);
                    rowCounter++;
                }
                expect(rowCounter).to.be.eq(rowCount);
            });

        });

        it('should be async iterable, iterating over SqlRowImpls; if returnRawResults is true', async function () {
            const sqlResult = new SqlResultImpl(
                fakeSqlService,
                fakeConnection,
                fakeQueryId,
                4096,
                true // return raw results
            );
            const rowCount = 3;
            prepareSuccessfulSqlResult(sqlResult, rowCount);

            let rowCounter = 0;
            for await (const row of sqlResult) {
                expect(row).to.be.instanceof(SqlRowImpl);
                rowCounter++;
            }
            expect(rowCounter).to.be.eq(rowCount);
        });

        it('should be iterable via next()', async function () {
            const sqlResult = new SqlResultImpl(
                fakeSqlService,
                fakeConnection,
                fakeQueryId,
                4096
            );
            const rowCount = 3;
            prepareSuccessfulSqlResult(sqlResult, rowCount);

            let current;
            let counter = 0;
            while (!(current = await sqlResult.next()).done) {
                expect(current).not.to.be.instanceof(SqlRowImpl);
                counter++;
            }
            expect(counter).to.be.eq(rowCount);
        });

    });
    describe('close', function () {

        let fakeSqlService;
        let fakeConnection;
        let fakeQueryId;

        beforeEach(function () {
            fakeSqlService = {close: sandbox.fake.resolves(undefined), fetch: sandbox.fake(() => {
                return delayedPromise(500);
            })};
            fakeConnection = sandbox.fake();
            fakeQueryId = sandbox.fake();
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should return the same promise if close() is called again', function () {
            const sqlResult = new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096);
            const closePromise = sqlResult.close();
            expect(sqlResult.close()).to.be.eq(closePromise);
        });

        it('should cancel an ongoing fetch if close() is called', function (done) {
            const sqlResult = new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096);
            sqlResult.fetch().then(() => {
                done(new Error('Not expected to run this line'));
            }).catch(err => {
                try {
                    expect(err).to.be.instanceof(HazelcastSqlException)
                        .with.property('code', SqlErrorCode.CANCELLED_BY_USER);
                    done();
                } catch (e) {
                    done(e);
                }
            });
            sqlResult.close();
        });

        it('should stop an ongoing execute() if close() is called', function (done) {
            const sqlResult = new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096);
            const onExecuteErrorSpy = sandbox.spy(sqlResult, 'onExecuteError');

            sqlResult.executeDeferred.promise.then(() => {
                done(new Error('Not expected to run this line'));
            }).catch(err => {
                try {
                    expect(err).to.be.instanceof(HazelcastSqlException)
                        .with.property('code', SqlErrorCode.CANCELLED_BY_USER);
                    expect(onExecuteErrorSpy.calledOnceWithExactly(err)).to.be.true;
                    done();
                } catch (e) {
                    done(e);
                }
            });

            sqlResult.close();
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
