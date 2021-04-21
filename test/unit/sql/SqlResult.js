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

const { delayedPromise } = require('../../../lib/util/Util');
const { SqlResultImpl } = require('../../../lib/sql/SqlResult');
const { SqlRowImpl } = require('../../../lib/sql/SqlRow');
const { SqlPage, ColumnarDataHolder } = require('../../../lib/sql/SqlPage');
const { SqlRowMetadataImpl } = require('../../../lib/sql/SqlRowMetadata');
const { SqlColumnType } = require('../../../lib/sql/SqlColumnMetadata');
const { SqlErrorCode } = require('../../../lib/sql/SqlErrorCode');
const { HazelcastSqlException } = require('../../../lib/core/HazelcastError');

/**
 * Simulates a successful execute response
 * @param sqlResult
 * @param rowCount how many rows to add to the sqlResult
 * @param rowMetadata
 * @returns sqlResult
 */
function prepareSuccessfulSqlResult (sqlResult, rowCount, rowMetadata) {
    const columns = [];
    for (let i = 0; i < 2; i++) { // column number
        const column = [];
        for (let j = 0; j < rowCount; j++) {
            column.push((i * rowCount + j).toString());
        }
        columns.push(column);
    }

    const rowPage = new SqlPage(
        [0, 0], // column types
        new ColumnarDataHolder(columns),
        true // isLast
    );

    if (rowMetadata === undefined) {
        rowMetadata = new SqlRowMetadataImpl([
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
    }

    sqlResult.onExecuteResponse(rowMetadata, rowPage, long.ZERO);
    return sqlResult;
}

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

        it('should reject for await iteration on execute error', function (done) {
            const sqlResult = new SqlResultImpl(
                fakeSqlService,
                fakeConnection,
                fakeQueryId,
                4096
            );

            const executeError = new Error('whoops..');
            sqlResult.onExecuteError(executeError);

            (async function () {
                // eslint-disable-next-line no-empty,no-unused-vars
                for await (const row of sqlResult) {
                }
            })().then(() => {
                done(new Error('Unexpected to run this line'));
            }).catch(err => {
                expect(err).to.be.eq(executeError);
                done();
            }).catch(done);
        });

        it('should reject next() iteration on execute error', function (done) {
            const sqlResult = new SqlResultImpl(
                fakeSqlService,
                fakeConnection,
                fakeQueryId,
                4096
            );

            const executeError = new Error('whoops..');
            sqlResult.onExecuteError(executeError);

            sqlResult.next().then(() => {
                done(new Error('Unexpected to run this line'));
            }).catch(err => {
                expect(err).to.be.eq(executeError);
                done();
            }).catch(done);
        });

    });
    describe('close', function () {

        let fakeSqlService;

        beforeEach(function () {
            fakeSqlService = {
                close: sandbox.fake.resolves(undefined), fetch: sandbox.fake(() => {
                    return delayedPromise(500);
                })
            };
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should return the same promise if close() is called again', function () {
            const sqlResult = new SqlResultImpl(fakeSqlService, {}, {}, 4096);
            const closePromise = sqlResult.close();
            expect(sqlResult.close()).to.be.eq(closePromise);
        });

        it('should cancel an ongoing fetch if close() is called', function (done) {
            const sqlResult = new SqlResultImpl(fakeSqlService, {}, {}, 4096);
            sqlResult.fetch().then(() => {
                done(new Error('Not expected to run this line'));
            }).catch(err => {
                expect(err).to.be.instanceof(HazelcastSqlException)
                    .with.property('code', SqlErrorCode.CANCELLED_BY_USER);
                done();
            }).catch(done);
            sqlResult.close();
        });

        it('should stop an ongoing execute() if close() is called', function (done) {
            const sqlResult = new SqlResultImpl(fakeSqlService, {}, {}, 4096);
            const onExecuteErrorSpy = sandbox.spy(sqlResult, 'onExecuteError');

            sqlResult.executeDeferred.promise.then(() => {
                done(new Error('Not expected to run this line'));
            }).catch(err => {
                expect(err).to.be.instanceof(HazelcastSqlException)
                    .with.property('code', SqlErrorCode.CANCELLED_BY_USER);
                expect(onExecuteErrorSpy.calledOnceWithExactly(err)).to.be.true;
                done();
            }).catch(done);

            sqlResult.close();
        });

        it('should resolve close promise after sending a close request successfully', function () {
            const fakeConnection = {};
            const fakeQueryId = {};
            const sqlResult = new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096);
            return sqlResult.close().then(() => {
                expect(fakeSqlService.close.calledOnceWithExactly(
                    sandbox.match.same(fakeConnection),
                    sandbox.match.same(fakeQueryId)
                )).to.be.true;
                expect(sqlResult.closed).to.be.true;
            });
        });

        it('should reject close promise if an error occurs during close request', function (done) {
            const sqlResult = new SqlResultImpl(fakeSqlService, {}, {}, 4096);
            const fakeError = new Error('Intended whoops error');
            fakeSqlService.close = sandbox.fake.rejects(fakeError);

            sqlResult.close().then(() => {
                done(new Error('Not expected to run this'));
            }).catch(err => {
                expect(err).to.be.eq(fakeError);
                expect(sqlResult.closed).to.be.false;
                done();
            }).catch(done);
        });
    });
    describe('getters', function () {

        it('should have working getters', async function () {
            const sqlResult = new SqlResultImpl({}, {}, {}, 4096);

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
            prepareSuccessfulSqlResult(sqlResult, 2, rowMetadata);

            expect(await sqlResult.getRowMetadata()).to.be.eq(rowMetadata);
            expect(await sqlResult.isRowSet()).to.be.true;
            expect((await sqlResult.getUpdateCount()).eq(long.fromNumber(-1))).to.be.true;
        });

    });
    describe('onNextPage', function () {

        it('should close on last page', function () {
            const sqlResult = new SqlResultImpl({}, {}, {}, 4096);
            const rowPage = new SqlPage(
                [], // column types
                new ColumnarDataHolder([[]]),
                true // isLast
            );

            sandbox.replace(rowPage, 'isLast', sinon.fake(rowPage.isLast));

            sqlResult.onNextPage(rowPage);

            expect(rowPage.isLast.called).to.be.true;

            expect(sqlResult.last).to.be.true;
            expect(sqlResult.closed).to.be.true;

            expect(sqlResult.currentPage).to.be.eq(rowPage);
        });

        it('should not close on a page other than last page', function () {
            const sqlResult = new SqlResultImpl({}, {}, {}, 4096);
            const rowPage = new SqlPage(
                [], // column types
                new ColumnarDataHolder([[]]),
                false // isLast
            );

            rowPage.getRowCount();

            sandbox.replace(rowPage, 'isLast', sinon.fake(rowPage.isLast));

            sqlResult.onNextPage(rowPage);

            expect(rowPage.isLast.called).to.be.true;

            expect(sqlResult.last).to.be.false;
            expect(sqlResult.closed).to.be.false;

            expect(sqlResult.currentPage).to.be.eq(rowPage);
        });

    });
    describe('onExecuteError', function () {
        it('should reject execute promise and set update count to long(-1)', function (done) {
            const sqlResult = new SqlResultImpl({}, {}, {}, 4096);
            sqlResult.updateCount = long.fromNumber(1); // change update count to see if it's changed

            const anError = new Error('whoops');
            sqlResult.onExecuteError(anError);

            expect(sqlResult.updateCount.eq(long.fromNumber(-1))).to.be.true;

            sqlResult.executeDeferred.promise.then(() => {
                done(new Error('not expected to run this'));
            }).catch(err => {
                try {
                    expect(err).to.be.eq(anError);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });
    describe('onExecuteResponse', function () {

        let sqlResult;
        beforeEach(function () {
            sqlResult = new SqlResultImpl({}, {}, {}, 4096);
        });

        it('should close the result and set updateCount if update count result is received ', function (done) {
            // pass null to make sure row page is not used
            sqlResult.onExecuteResponse(null, new SqlPage([], new ColumnarDataHolder([[]]), false), long.fromNumber(5));

            expect(sqlResult.closed).to.be.true;
            expect(sqlResult.currentPage).to.be.null;
            expect(sqlResult.updateCount.eq(long.fromNumber(5))).to.true;
            sqlResult.executeDeferred.promise.then(() => {
                done();
            }).catch(done);
        });

        it('should call onNextpage and set row metadata if rowset result is received', function (done) {
            const onNextPageSpy = sandbox.spy(sqlResult, 'onNextPage');
            const rowMetadata = {};

            // row metadata being not null means rows received
            sqlResult.onExecuteResponse(rowMetadata, new SqlPage([], new ColumnarDataHolder([[]]), false), long.ZERO);

            sqlResult.executeDeferred.promise.then(() => {
                done();
            }).catch(done);

            expect(onNextPageSpy.calledOnce).to.be.true;
            expect(sqlResult.rowMetadata).to.be.eq(rowMetadata);
        });
    });
});
