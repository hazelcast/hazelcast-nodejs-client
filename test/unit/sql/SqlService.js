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

const { SqlServiceImpl } = require('../../../lib/sql/SqlService');
const { SqlResultImpl } = require('../../../lib/sql/SqlResult');
const { SqlRowMetadataImpl } = require('../../../lib/sql/SqlRowMetadata');
const { SqlExpectedResultType } = require('../../../lib/sql/SqlStatement');
const { SqlQueryId } = require('../../../lib/sql/SqlQueryId');
const { SqlErrorCode } = require('../../../lib/sql/SqlErrorCode');
const { SqlExecuteCodec } = require('../../../lib/codec/SqlExecuteCodec');
const { SqlCloseCodec } = require('../../../lib/codec/SqlCloseCodec');
const { SqlFetchCodec } = require('../../../lib/codec/SqlFetchCodec');
const { UuidUtil } = require('../../../lib/util/UuidUtil');
const { assertTrueEventually, getRejectionReasonOrThrow } = require('../../TestUtil');
const { IllegalArgumentError, HazelcastSqlException } = require('../../../lib/core/HazelcastError');

const long = require('long');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const chai = require('chai');
chai.should();

describe('SqlServiceTest', function () {
    describe('execute', function () {
        let sqlService;

        let fakeConnectionRegistry;
        let fakeSerializationService;
        let fakeInvocationService;
        let fakeConnectionManager;
        let fakeConnection;
        let fakeEncodeRequest;
        let fakeHandleExecuteResponse;
        let fakeFromMemberId;

        const fakeQueryId = {};
        const fakeClientMessage = {};
        const fakeRemoteUUID = UuidUtil.generate();
        const fakeClientResponseMessage = {};
        const fakeClientUUID = 'asd';

        const shouldThrowIllegalArgumentError = async (asyncFn) => {
            const error = await getRejectionReasonOrThrow(asyncFn);
            error.should.be.instanceof(IllegalArgumentError);
        };

        beforeEach(function () {
            fakeEncodeRequest = sandbox.replace(SqlExecuteCodec, 'encodeRequest', sandbox.fake.returns(fakeClientMessage));
            fakeHandleExecuteResponse = sandbox.replace(SqlServiceImpl, 'handleExecuteResponse', sandbox.fake());
            fakeFromMemberId = sandbox.replace(SqlQueryId, 'fromMemberId', sandbox.fake.returns(fakeQueryId));

            fakeConnection = {
                getRemoteUuid: sandbox.fake.returns(fakeRemoteUUID),
                isAlive: sandbox.fake.returns(true)
            };
            fakeConnectionRegistry = {
                getConnectionForSql: sandbox.fake.returns(fakeConnection)
            };
            fakeSerializationService = { toData: sandbox.fake(v => v)};
            fakeInvocationService = { invokeOnConnection: sandbox.fake.resolves(fakeClientResponseMessage) };
            fakeConnectionManager = {
                getClientUuid: sandbox.fake.returns(fakeClientUUID),
                getConnectionRegistry: () => fakeConnectionRegistry
            };

            // sql service
            sqlService = new SqlServiceImpl(
                fakeSerializationService,
                fakeInvocationService,
                fakeConnectionManager
            );
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should return a SqlResultImpl', async function () {
            (await sqlService.execute('s', [], {})).should.be.instanceof(SqlResultImpl);
        });

        it('should call getConnectionForSql', async function () {
            await sqlService.execute('s', [], {});
            fakeConnectionRegistry.getConnectionForSql.calledOnce.should.be.true;
        });

        it('should call toData on params', async function () {
            const params = [1, 2, 3];
            await sqlService.execute('s', params, {});
            fakeSerializationService.toData.firstCall.calledWithExactly(1).should.be.true;
            fakeSerializationService.toData.secondCall.calledWithExactly(2).should.be.true;
            fakeSerializationService.toData.thirdCall.calledWithExactly(3).should.be.true;
        });

        it('should call encodeRequest with correct params', async function () {
            const params = [1, 2, 3];
            await sqlService.execute('s', params, {}); // default options
            fakeEncodeRequest.lastCall.calledWithExactly(
                's',
                [1, 2, 3],
                SqlServiceImpl.DEFAULT_TIMEOUT,
                SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE,
                SqlServiceImpl.DEFAULT_SCHEMA,
                SqlServiceImpl.DEFAULT_EXPECTED_RESULT_TYPE,
                fakeQueryId,
                false
            ).should.be.true;

            await sqlService.execute('s', params, {
                timeoutMillis: 0,
                cursorBufferSize: 1,
                returnRawResult: true,
                schema: 'sd',
                expectedResultType: 'ANY'
            });
            fakeEncodeRequest.lastCall.calledWithExactly(
                's',
                [1, 2, 3],
                long.ZERO,
                1,
                'sd',
                SqlExpectedResultType.ANY,
                fakeQueryId,
                false
            ).should.be.true;
        });

        it('should throw HazelcastSqlException if no connection is available', async function () {
            fakeConnectionManager.getConnectionRegistry().getConnectionForSql = sandbox.fake.returns(null);

            sqlService = new SqlServiceImpl(
                fakeSerializationService,
                fakeInvocationService,
                fakeConnectionManager
            );
            const error = await getRejectionReasonOrThrow(async () => {
                await sqlService.execute('s', [], {});
            });
            error.should.be.instanceof(HazelcastSqlException).that.has.ownProperty('code', SqlErrorCode.CONNECTION_PROBLEM);
        });

        it('should throw HazelcastSqlException that has proper cause if invocation fails', async function () {
            const err = new Error('Invocation failed');
            fakeInvocationService.invokeOnConnection = sandbox.fake.rejects(err);
            sqlService = new SqlServiceImpl(
                fakeSerializationService,
                fakeInvocationService,
                fakeConnectionManager
            );
            const error = await getRejectionReasonOrThrow(async () => {
                await sqlService.execute('SELECT * FROM map', [], {});
            });
            error.should.be.instanceof(HazelcastSqlException);
            error.should.have.ownProperty('cause', err);
            error.should.have.ownProperty('code', SqlErrorCode.GENERIC);
        });

        it('should construct a SqlResultImpl with default result type if it\'s not specified', async function () {
            const fake = sandbox.replace(SqlResultImpl, 'newResult', sandbox.fake(SqlResultImpl.newResult));
            await sqlService.execute('s', [], { cursorBufferSize: 1 });
            fake.calledWith(
                sandbox.match(sqlService),
                sandbox.match.func,
                sandbox.match(fakeConnection),
                sandbox.match(fakeQueryId),
                sandbox.match(1),
                sandbox.match(SqlServiceImpl.DEFAULT_FOR_RETURN_RAW_RESULT),
                sandbox.match(fakeClientUUID)
            ).should.be.true;
        });

        it('should construct a SqlResultImpl with default cursor buffer size if it\'s not specified', async function () {
            const fake = sandbox.replace(SqlResultImpl, 'newResult', sandbox.fake(SqlResultImpl.newResult));

            await sqlService.execute('s', [], { returnRawResult: true });
            fake.calledWith(
                sandbox.match(sqlService),
                sandbox.match.func,
                sandbox.match(fakeConnection),
                sandbox.match(fakeQueryId),
                sandbox.match(SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE),
                sandbox.match(true),
                sandbox.match(fakeClientUUID)
            ).should.be.true;
        });

        it('should construct a SqlResultImpl with parameters passed', async function () {
            const fake = sandbox.replace(SqlResultImpl, 'newResult', sandbox.fake(SqlResultImpl.newResult));

            await sqlService.execute('s', [], { returnRawResult: true, cursorBufferSize: 1 });
            fake.calledWithMatch(
                sandbox.match(sqlService),
                sandbox.match.func,
                sandbox.match(fakeConnection),
                sandbox.match(fakeQueryId),
                sandbox.match(1),
                sandbox.match(true),
                sandbox.match(fakeClientUUID)
            ).should.be.true;
        });

        it('should invoke on connection returned from getConnectionForSql', async function () {
            await sqlService.execute('s', [], {});
            fakeInvocationService.invokeOnConnection.calledOnceWithExactly(
                fakeConnection, fakeClientMessage, sandbox.match.func
            ).should.be.true;
        });

        it('should call handleExecuteResponse if invoke is successful', async function () {
            const fakeResult = {};
            sandbox.replace(SqlResultImpl, 'newResult', sandbox.fake.returns(fakeResult));
            await sqlService.execute('s', [], {});
            return assertTrueEventually(async () => {
                fakeHandleExecuteResponse.calledOnceWithExactly(
                    sandbox.match.same(fakeClientResponseMessage),
                    sandbox.match.same(fakeResult)
                ).should.be.true;
            }, 100, 1000);
        });

        it('should use connection member id to build a sql query id', async function () {
            await sqlService.execute('s', [], {});
            fakeFromMemberId.calledOnceWithExactly(fakeRemoteUUID).should.be.true;
        });

        it('should throw HazelcastSqlException any of the parameters are invalid', async function () {
            // If sql property is not present in the object
            await shouldThrowIllegalArgumentError(async () => await sqlService.executeStatement({ 'random': '' }));

            // If timeout is less than -1 throw
            await shouldThrowIllegalArgumentError(
                async () => await sqlService.executeStatement({ 'sql': 'ss', options: { timeoutMillis: -3 }})
            );

            await shouldThrowIllegalArgumentError(
                async () => await sqlService.executeStatement({ 'sql': 'ss', options: { timeoutMillis: -2 }})
            );

            // Valid timeout cases:
            await sqlService.executeStatement({ 'sql': 'ss', options: { timeoutMillis: -1 } });
            await sqlService.executeStatement({ 'sql': 'ss', options: { timeoutMillis: 0 } });

            // If cursorBufferSize is non positive throw
            await shouldThrowIllegalArgumentError(
                async () => await sqlService.executeStatement({
                    'sql': 'ss',
                    options: { cursorBufferSize: 0 }
                })
            );
            await shouldThrowIllegalArgumentError(
                async () => await sqlService.executeStatement({
                    'sql': 'ss',
                    options: { cursorBufferSize: -1 }
                })
            );

            // empty sql not allowed
            await shouldThrowIllegalArgumentError(async () => await sqlService.execute('', [], {}));
            await shouldThrowIllegalArgumentError(async () => await sqlService.executeStatement({ 'sql': '' }));

            /*
             Depending on the type of these values, they are passed as arguments. If parameter type is not the expected
             type, we expect the method to throw IllegalArgumentError
             */
            for (const v of ['ss', 1, null, undefined, {}, [], Symbol(), BigInt(1), long.ZERO, true, 'ANY']) {
                if (typeof v !== 'string') {
                    // invalid sql string
                    await shouldThrowIllegalArgumentError(async () => await sqlService.execute(v, [], {}));
                    await shouldThrowIllegalArgumentError(async () => await sqlService.executeStatement({ 'sql': v }));
                } else {
                    // valid sql string
                    await sqlService.execute(v, [], {});
                    await sqlService.executeStatement({ 'sql': v });
                }

                if (typeof v !== 'string') {
                    // invalid schema
                    await shouldThrowIllegalArgumentError(async () => await sqlService.execute('', undefined, { schema: v }));
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.executeStatement({ 'sql': 'ss', options: { schema: v } })
                    );
                } else {
                    // valid schema
                    await sqlService.execute('ss', [], { schema: v });
                    await sqlService.executeStatement({ 'sql': 'ss', options: { schema: v } });
                }

                if (!Array.isArray(v) && typeof v !== 'undefined') { // passing undefined is same as not passing
                    // invalid params
                    await shouldThrowIllegalArgumentError(async () => await sqlService.execute('ss', v, {}));
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.executeStatement({ 'sql': 'ss', params: v })
                    );
                } else {
                    // valid params
                    await sqlService.execute('ss', v, {});
                }

                if (typeof v !== 'number') {
                    // invalid cursor buffer size
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.execute('ss', [], { cursorBufferSize: v })
                    );
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.executeStatement({ 'sql': 'ss', options: { cursorBufferSize: v } })
                    );
                } else {
                    // valid cursor buffer size
                    await sqlService.execute('ss', [], { cursorBufferSize: v });
                    await sqlService.executeStatement({ 'sql': 'ss', options: { cursorBufferSize: v } });
                }

                if (typeof v !== 'number') {
                    // invalid timeoutMillis
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.execute('ss', [], { timeoutMillis: v })
                    );
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.executeStatement({ 'sql': 'ss', options: { timeoutMillis: v } })
                    );
                } else {
                    // valid timeoutMillis
                    await sqlService.execute('ss', [], { timeoutMillis: v });
                    await sqlService.executeStatement({ 'sql': 'ss', options: { timeoutMillis: v } });
                }

                if (!(v in SqlExpectedResultType && typeof v === 'string')) { // enum objects at js has both numbers and strings
                    // invalid expectedResultType
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.execute('ss', [], { expectedResultType: v })
                    );
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.executeStatement({ 'sql': 'ss', options: { expectedResultType: v } })
                    );
                } else {
                    // valid expectedResultType
                    await sqlService.execute('ss', [], { expectedResultType: v });
                    await sqlService.executeStatement({ 'sql': 'ss', options: { expectedResultType: v } });
                }

                if (typeof v !== 'boolean') {
                    // invalid returnRawResult
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.execute('ss', [], { returnRawResult: v })
                    );
                    await shouldThrowIllegalArgumentError(
                        async () => await sqlService.executeStatement({ 'sql': 'ss', options: { returnRawResult: v } })
                    );
                } else {
                    // valid returnRawResult
                    await sqlService.execute('ss', [], { returnRawResult: v });
                    await sqlService.executeStatement({ 'sql': 'ss', options: { returnRawResult: v } });
                }
            }
        });
    });
    describe('close', function () {
        let sqlService;
        let fakeCloseCodec;
        let fakeInvocationService;

        const fakeClientMessage = {};

        beforeEach(function () {
            fakeCloseCodec = sandbox.fake.returns(fakeClientMessage);
            SqlCloseCodec.encodeRequest = fakeCloseCodec;

            fakeInvocationService = { invokeOnConnection: sandbox.fake.resolves(undefined) };

            // sql service
            sqlService = new SqlServiceImpl(
                {},
                fakeInvocationService,
                {}
            );
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should call invokeOnConnection with connection provided and message created', function () {
            const fakeConnection = {};
            const fakeQueryId = {};
            sqlService.close(fakeConnection, fakeQueryId);

            fakeInvocationService.invokeOnConnection.calledOnceWithExactly(
                sandbox.match.same(fakeConnection),
                sandbox.match.same(fakeClientMessage),
                sandbox.match.func
            ).should.be.true;
        });

        it('should encode request using queryId passed', function () {
            const fakeConnection = {};
            const fakeQueryId = {};
            sqlService.close(fakeConnection, fakeQueryId);

            fakeCloseCodec.calledOnceWithExactly(
                sandbox.match.same(fakeQueryId)
            ).should.be.true;
        });
    });
    describe('handleExecuteResponse', function () {
        let fakeResult;

        beforeEach(function () {
            fakeResult = {
                onExecuteError: sandbox.fake(),
                onExecuteResponse: sandbox.fake()
            };
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should call onExecuteError method of result if response error is not null', function () {
            const fakeResponse = {
                error: {
                    originatingMemberId: 1,
                    code: 1,
                    message: 'Execute error response',
                    suggestion: null
                },
                rowMetadata: [],
                rowPage: {},
                updateCount: 1
            };

            (() => SqlServiceImpl.handleExecuteResponse(fakeResponse, fakeResult)).should.throw(HazelcastSqlException);

            fakeResult.onExecuteResponse.called.should.be.false;
        });

        it('should call onExecuteResponse method of result if response error is null', function () {
            const fakeResponse = {
                error: null,
                rowMetadata: [1],
                rowPage: {},
                updateCount: 1
            };
            SqlServiceImpl.handleExecuteResponse(fakeResponse, fakeResult);

            fakeResult.onExecuteResponse.calledOnceWithExactly(
                sandbox.match(new SqlRowMetadataImpl(fakeResponse.rowMetadata)),
                sandbox.match.same(fakeResponse.rowPage),
                fakeResponse.updateCount
            ).should.be.true;

            fakeResult.onExecuteError.called.should.be.false;
        });
    });
    describe('fetch', function () {
        let sqlService;

        let fakeInvokeOnConnection;
        let encodeFake;
        const fakeClientResponseMessage = {};
        const fakeRequestMessage = {};

        beforeEach(function () {
            encodeFake = sandbox.fake.returns(fakeRequestMessage);
            sandbox.replace(SqlFetchCodec, 'encodeRequest', encodeFake);

            fakeInvokeOnConnection = sandbox.fake.resolves(fakeClientResponseMessage);
            // sql service
            sqlService = new SqlServiceImpl(
                {},
                {invokeOnConnection: fakeInvokeOnConnection},
                {}
            );
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should encode a request', function () {
            const decodeFake = sandbox.fake.returns({ error: null, rowPage: [] });
            sandbox.replace(SqlFetchCodec, 'decodeResponse', decodeFake);
            const fakeQueryId = {};
            sqlService.fetch({}, fakeQueryId, 1);

            encodeFake.calledOnceWithExactly(
                sandbox.match.same(fakeQueryId),
                1
            ).should.be.true;
        });

        it('should invoke on connection', function () {
            sandbox.replace(SqlFetchCodec, 'decodeResponse', sandbox.fake.returns({ error: null, rowPage: [] }));
            const fakeConnection = {};
            sqlService.fetch(fakeConnection, {}, 1);

            fakeInvokeOnConnection.calledOnceWithExactly(
                sandbox.match.same(fakeConnection),
                sandbox.match.same(fakeRequestMessage),
                sandbox.match.func
            ).should.be.true;
        });

        it('should decode the response', function () {
            const decodeFake = sandbox.fake.returns({ error: null, rowPage: [] });
            sandbox.replace(SqlFetchCodec, 'decodeResponse', decodeFake);

            sqlService.fetch({}, {}, 1).then(() => {
                decodeFake.calledOnceWithExactly(
                    sandbox.match.same(fakeClientResponseMessage)
                ).should.be.true;
            });
        });
    });
});
