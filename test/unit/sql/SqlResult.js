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
const should = chai.should();

const { delayedPromise } = require('../../../lib/util/Util');
const { SqlResultImpl } = require('../../../lib/sql/SqlResult');
const { SqlRowImpl } = require('../../../lib/sql/SqlRow');
const { SqlPage } = require('../../../lib/sql/SqlPage');
const { SqlRowMetadataImpl } = require('../../../lib/sql/SqlRowMetadata');
const { SqlColumnType } = require('../../../lib/sql/SqlColumnMetadata');
const { SqlErrorCode } = require('../../../lib/sql/SqlErrorCode');
const { HazelcastSqlException } = require('../../../lib/core/HazelcastError');
const { assertTrueEventually } = require('../../TestUtil');

const defaultRowMetadata = new SqlRowMetadataImpl([
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

/**
 * Simulates a successful execute response
 * @param timeoutMs timeout in ms to simulate response
 * @param sqlResult
 * @param rowCount how many rows to add to the sqlResult
 * @param rowMetadata
 * @param updateCount
 * @param isLast
 */
function simulateExecutionResponse(
    timeoutMs = 1000,
    sqlResult,
    rowCount = 0,
    rowMetadata = defaultRowMetadata,
    updateCount = long.fromNumber(-1),
    isLast = true
) {
    const data = [];

    for (let i = 0; i < 2; i++) { // row number
        const column = [];
        for (let j = 0; j < rowCount; j++) {
            column.push((i * 2 + j).toString());
        }
        data.push(column);
    }

    const rowPage = new SqlPage(
        [0, 0], // column types
        data,
        isLast // isLast
    );

    setTimeout(() => {
        sqlResult.onExecuteResponse(rowMetadata, rowPage, updateCount);
    }, timeoutMs);
}

/**
 * Simulates an execute error after timeoutMs
 * @param timeoutMs
 * @param sqlResult
 * @param error
 */
function simulateExecuteError(timeoutMs, sqlResult, error = new Error('whoops')) {
    setTimeout(() => {
        sqlResult.onExecuteError(error);
    }, timeoutMs);
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

        [
            new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096),
            new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096, false)
        ].forEach(async sqlResult => {
            it('should async iterable, over objects; by default and if returnRawResults is false', async function () {
                const rowCount = 3;
                simulateExecutionResponse(1000, sqlResult, rowCount, defaultRowMetadata);

                let rowCounter = 0;
                for await (const row of sqlResult) {
                    row.should.not.be.instanceof(SqlRowImpl);
                    rowCounter++;
                }
                rowCounter.should.be.eq(rowCount);
                (await sqlResult.getRowMetadata()).should.be.eq(defaultRowMetadata);
                (await sqlResult.isRowSet()).should.be.true;
                (await sqlResult.getUpdateCount()).eq(long.fromNumber(-1)).should.be.true;
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
            simulateExecutionResponse(1000, sqlResult, rowCount, defaultRowMetadata);

            let rowCounter = 0;
            for await (const row of sqlResult) {
                row.should.be.instanceof(SqlRowImpl);
                rowCounter++;
            }
            rowCounter.should.be.eq(rowCount);
            (await sqlResult.getRowMetadata()).should.be.eq(defaultRowMetadata);
            (await sqlResult.isRowSet()).should.be.true;
            (await sqlResult.getUpdateCount()).eq(long.fromNumber(-1)).should.be.true;
        });

        it('should be iterable via next()', async function () {
            const sqlResult = new SqlResultImpl(
                fakeSqlService,
                fakeConnection,
                fakeQueryId,
                4096
            );
            const rowCount = 3;
            simulateExecutionResponse(1000, sqlResult, rowCount, defaultRowMetadata);

            let current;
            let counter = 0;
            while (!(current = await sqlResult.next()).done) {
                current.should.not.be.instanceof(SqlRowImpl);
                counter++;
            }
            counter.should.be.eq(rowCount);
            (await sqlResult.getRowMetadata()).should.be.eq(defaultRowMetadata);
            (await sqlResult.isRowSet()).should.be.true;
            (await sqlResult.getUpdateCount()).eq(long.fromNumber(-1)).should.be.true;
        });

        it('should reject for await iteration on execute error', function () {
            const sqlResult = new SqlResultImpl(
                fakeSqlService,
                fakeConnection,
                fakeQueryId,
                4096
            );

            const executeError = new Error('whoops..');
            simulateExecuteError(1000, sqlResult, executeError);

            return assertTrueEventually(async () => {
                try {
                    // eslint-disable-next-line no-empty,no-unused-vars
                    for await (const row of sqlResult) {
                    }
                } catch (err) {
                    err.should.be.eq(executeError);
                }
            });
        });

        it('should reject next() iteration on execute error', function () {
            const sqlResult = new SqlResultImpl(
                fakeSqlService,
                fakeConnection,
                fakeQueryId,
                4096
            );

            const executeError = new Error('whoops..');
            simulateExecuteError(1000, sqlResult, executeError);

            return assertTrueEventually(async () => {
                try {
                    await sqlResult.next();
                } catch (err) {
                    err.should.be.eq(executeError);
                }
            });
        });

    });
    describe('close', function () {

        let fakeSqlService;

        beforeEach(function () {
            fakeSqlService = {
                close: sandbox.fake.resolves(undefined),
                fetch: sandbox.fake(() => {
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
            sqlResult.close().should.be.eq(closePromise);
        });

        it('should cancel an ongoing fetch if close() is called', function (done) {
            const sqlResult = new SqlResultImpl(fakeSqlService, {}, {}, 4096);
            sqlResult.fetch().then(() => {
                done(new Error('Not expected to run this line'));
            }).catch(err => {
                err.should.be.instanceof(HazelcastSqlException).with.property('code', SqlErrorCode.CANCELLED_BY_USER);
                done();
            }).catch(done);
            sqlResult.close();
        });

        it('should stop an ongoing execute() if close() is called', function (done) {
            const sqlResult = new SqlResultImpl(fakeSqlService, {}, {}, 4096);
            const fake = sandbox.replace(sqlResult, 'onExecuteError', sandbox.fake(sqlResult.onExecuteError));

            sqlResult.executeDeferred.promise.then(() => {
                done(new Error('Not expected to run this line'));
            }).catch(err => {
                err.should.be.instanceof(HazelcastSqlException).with.property('code', SqlErrorCode.CANCELLED_BY_USER);
                fake.calledOnceWithExactly(err).should.be.true;
                done();
            }).catch(done);
            simulateExecutionResponse(1000, sqlResult, 1, defaultRowMetadata);
            sqlResult.close();
        });

        it('should call close() of sql service, and mark result as closed', function () {
            const fakeConnection = {};
            const fakeQueryId = {};
            const sqlResult = new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, 4096);
            return sqlResult.close().then(() => {
                fakeSqlService.close.calledOnceWithExactly(
                    sandbox.match.same(fakeConnection),
                    sandbox.match.same(fakeQueryId)
                ).should.be.true;
                sqlResult.closed.should.be.true;
            });
        });

        it('should reject close promise if an error occurs during close request', function (done) {
            const sqlResult = new SqlResultImpl(fakeSqlService, {}, {}, 4096);
            const fakeError = new Error('whoops error');
            fakeSqlService.close = sandbox.fake.rejects(fakeError);

            sqlResult.close().then(() => {
                done(new Error('Not expected to run this line'));
            }).catch(err => {
                err.should.be.eq(fakeError);
                sqlResult.closed.should.be.false;
                done();
            }).catch(done);
        });
    });
    describe('getters', function () {

        it('should have working getters', function () {
            const sqlResult1 = new SqlResultImpl({}, {}, {}, 4096);

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

            const sqlResult2 = new SqlResultImpl({}, {}, {}, 4096);

            simulateExecutionResponse(1000, sqlResult1, 2, rowMetadata);
            simulateExecutionResponse(1000, sqlResult2, 2, null, long.fromNumber(1));

            return assertTrueEventually(async () => {
                (await sqlResult1.getRowMetadata()).should.be.eq(rowMetadata);
                (await sqlResult1.isRowSet()).should.be.true;
                (await sqlResult1.getUpdateCount()).eq(long.fromNumber(-1)).should.be.true;

                should.equal((await sqlResult2.getRowMetadata()), null);
                (await sqlResult2.isRowSet()).should.be.false;
                (await sqlResult2.getUpdateCount()).eq(long.fromNumber(1)).should.be.true;
            });

        });

    });
    describe('fetch', function () {
        let fakeSqlService;
        let fakeConnection;
        let fakeQueryId;
        let sqlResult;

        const fakeSqlPage = {};
        const cursorBufferSize = 4096;

        beforeEach(function () {
            fakeSqlService = {
                fetch: sandbox.fake.resolves(fakeSqlPage),
                close: sandbox.fake.resolves()
            };
            fakeConnection = sandbox.fake();
            fakeQueryId = sandbox.fake();
            sqlResult = new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, cursorBufferSize);
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should return the same promise if there is another ongoing fetch', function () {
            fakeSqlService.fetch = () => {
                return new Promise(((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 1000);
                }));
            };

            const promise1 = sqlResult.fetch();
            const promise2 = sqlResult.fetch();

            promise1.should.be.eq(promise2);
        });

        it('should not start a new fetch if result is closed', async function () {
            await sqlResult.close();
            try {
                await sqlResult.fetch();
                throw new Error('dummy error');
            } catch (e) {
                e.should.be.a('string');
                e.should.include('the result is closed');
            }
        });

        it('should return a promise that resolves an sql page', async function () {
            const sqlPage = await sqlResult.fetch();
            sqlPage.should.be.eq(fakeSqlPage);
            fakeSqlService.fetch.calledOnceWithExactly(
                sandbox.match.same(fakeConnection),
                sandbox.match.same(fakeQueryId),
                cursorBufferSize
            ).should.be.true;
        });

        it('should return a promise that rejects if an error occurred during fetch', async function () {
            const anError = new Error('whoops');
            fakeSqlService.fetch = sandbox.fake.rejects(anError);

            try {
                await sqlResult.fetch();
                throw new Error('dummy error');
            } catch (e) {
                e.should.be.eq(anError);
                fakeSqlService.fetch.calledOnceWithExactly(
                    sandbox.match.same(fakeConnection),
                    sandbox.match.same(fakeQueryId),
                    cursorBufferSize
                ).should.be.true;
            }
        });
    });
    describe('getCurrentRow', function () {
        let fakeSqlService;
        let fakeConnection;
        let fakeQueryId;
        let sqlResult;

        const fakeSqlPage = {};
        const cursorBufferSize = 4096;
        const rowMetadata = new SqlRowMetadataImpl([
            {
                name: 'this',
                nullable: true,
                type: 2
            },
            {
                name: '__key',
                nullable: true,
                type: 2
            }]);

        beforeEach(function () {
            fakeSqlService = {
                fetch: sandbox.fake.resolves(fakeSqlPage),
                close: sandbox.fake.resolves()
            };
            fakeConnection = sandbox.fake();
            fakeQueryId = sandbox.fake();
            sqlResult = new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, cursorBufferSize);
            sqlResult.rowMetadata = rowMetadata;
            sqlResult.currentPage = new SqlPage([2, 2], [['1', '2'], ['3', '4']], true);
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should return object if returnRawResult is false', function () {
            sqlResult.returnRawResult = false;
            sqlResult.getCurrentRow().should.not.be.instanceof(SqlRowImpl);
        });

        it('should return sql row if returnRawResult is true', function () {
            sqlResult.returnRawResult = true;
            const currentRow = sqlResult.getCurrentRow();
            currentRow.should.be.instanceof(SqlRowImpl);
            currentRow.getMetadata().should.be.eq(rowMetadata);
        });
    });
    describe('_hasNext', function () {
        let fakeSqlService;
        let fakeConnection;
        let fakeQueryId;
        let sqlResult;

        const fakeSqlPage = new SqlPage([2, 2], [['1', '2'], ['3', '4']], true);
        const cursorBufferSize = 4096;

        beforeEach(function () {
            fakeSqlService = {
                fetch: sandbox.fake.resolves(fakeSqlPage)
            };
            fakeConnection = sandbox.fake();
            fakeQueryId = sandbox.fake();
            sqlResult = new SqlResultImpl(fakeSqlService, fakeConnection, fakeQueryId, cursorBufferSize);

        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should reject if execute is failed', async function () {
            const anError = new Error('oops');
            simulateExecuteError(1, sqlResult, anError);

            try {
                await sqlResult._hasNext();
                throw new Error('dummy');
            } catch (e) {
                e.should.be.eq(anError);
            }
        });

        it('should resolve to false if last page is received and all rows are read', async function () {
            simulateExecutionResponse(1, sqlResult, 2);
            // eslint-disable-next-line no-unused-vars,no-empty
            for await (const row of sqlResult) {
            }
            const hasNext = await sqlResult._hasNext();
            hasNext.should.be.false;
        });

        it('should resolve to true if there are rows to read from current page', async function () {
            simulateExecutionResponse(1, sqlResult, 2);

            await sqlResult.next();

            const hasNext = await sqlResult._hasNext();
            hasNext.should.be.true;
        });

        it('should fetch next page if current page is ends', async function () {
            // Non-last page with one row
            simulateExecutionResponse(1, sqlResult, 1, undefined, undefined, false);

            // Consume the row
            await sqlResult.next();

            (await sqlResult._hasNext()).should.be.true;

            fakeSqlService.fetch.calledOnce.should.be.true;

            await sqlResult.next();
            await sqlResult.next();

            (await sqlResult._hasNext()).should.be.false;
        });
    });
    describe('onNextPage', function () {

        it('should close on last page', function () {
            const sqlResult = new SqlResultImpl({}, {}, {}, 4096);
            const rowPage = new SqlPage(
                [], // column types
                [[]],
                true // isLast
            );

            const fake = sandbox.replace(rowPage, 'isLast', sandbox.fake(rowPage.isLast));

            sqlResult.onNextPage(rowPage);

            fake.called.should.be.true;

            sqlResult.last.should.be.true;
            sqlResult.closed.should.be.true;

            sqlResult.currentPage.should.be.eq(rowPage);
        });

        it('should not close on a page other than last page', function () {
            const sqlResult = new SqlResultImpl({}, {}, {}, 4096);
            const rowPage = new SqlPage(
                [], // column types
                [[]],
                false // isLast
            );

            rowPage.getRowCount();

            const fake = sandbox.replace(rowPage, 'isLast', sandbox.fake(rowPage.isLast));

            sqlResult.onNextPage(rowPage);

            fake.called.should.be.true;

            sqlResult.last.should.be.false;
            sqlResult.closed.should.be.false;

            sqlResult.currentPage.should.be.eq(rowPage);
        });

    });
    describe('onExecuteError', function () {
        it('should reject execute promise and set update count to long(-1)', function (done) {
            const sqlResult = new SqlResultImpl({}, {}, {}, 4096);
            sqlResult.updateCount = long.fromNumber(1); // change update count to see if it's changed

            const anError = new Error('whoops');
            simulateExecuteError(1000, sqlResult, anError);

            sqlResult.executeDeferred.promise.then(() => {
                done(new Error('Not expected to run this line'));
            }).catch(err => {
                err.should.be.eq(anError);
                sqlResult.updateCount.eq(long.fromNumber(-1)).should.be.true;
                done();
            }).catch(done);
        });
    });
    describe('onExecuteResponse', function () {

        let sqlResult;
        beforeEach(function () {
            sqlResult = new SqlResultImpl({}, {}, {}, 4096);
        });

        it('should close the result and set updateCount if update count result is received ', function (done) {
            // pass null to make sure row page is not used
            simulateExecutionResponse(1000, sqlResult, 0, null, long.fromNumber(5));

            sqlResult.executeDeferred.promise.then(() => {
                sqlResult.closed.should.be.true;
                should.equal(sqlResult.currentPage, null);
                sqlResult.updateCount.eq(long.fromNumber(5)).should.be.true;
                done();
            }).catch(done);
        });

        it('should call onNextpage and set row metadata if rowset result is received', function (done) {
            const fake = sandbox.replace(sqlResult, 'onNextPage', sandbox.fake(sqlResult.onNextPage));
            const rowMetadata = {};

            // row metadata being not null means rows received
            simulateExecutionResponse(1000, sqlResult, 0, rowMetadata, undefined);

            sqlResult.executeDeferred.promise.then(() => {
                sqlResult.rowMetadata.should.be.eq(rowMetadata);
                fake.calledOnce.should.be.true;
                sqlResult.updateCount.eq(long.fromNumber(-1)).should.be.true;
                done();
            }).catch(done);

        });
    });
});
