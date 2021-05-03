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
const {
    HzLocalDateTime,
    HzOffsetDateTime,
    HzLocalDate,
    HzLocalTime
} = require('../../../lib/sql/DatetimeClasses');
const { SqlExecuteCodec } = require('../../../lib/codec/SqlExecuteCodec');
const { SqlCloseCodec } = require('../../../lib/codec/SqlCloseCodec');
const { SqlFetchCodec } = require('../../../lib/codec/SqlFetchCodec');
const { UuidUtil } = require('../../../lib/util/UuidUtil');
const { assertTrueEventually } = require('../../TestUtil');
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

        beforeEach(function () {

            fakeEncodeRequest = sandbox.replace(SqlExecuteCodec, 'encodeRequest', sandbox.fake.returns(fakeClientMessage));
            fakeHandleExecuteResponse = sandbox.replace(SqlServiceImpl.prototype, 'handleExecuteResponse', sandbox.fake());
            fakeFromMemberId = sandbox.replace(SqlQueryId, 'fromMemberId', sandbox.fake.returns(fakeQueryId));

            fakeConnection = {
                getRemoteUuid: sandbox.fake.returns(fakeRemoteUUID)
            };
            fakeConnectionRegistry = {
                getRandomConnection: sandbox.fake.returns(fakeConnection)
            };
            fakeSerializationService = { toData: sandbox.fake(v => v) };
            fakeInvocationService = { invokeOnConnection: sandbox.fake.resolves(fakeClientResponseMessage) };
            fakeConnectionManager = { getClientUuid: sandbox.fake.returns(fakeClientUUID) };

            // sql service
            sqlService = new SqlServiceImpl(
                fakeConnectionRegistry,
                fakeSerializationService,
                fakeInvocationService,
                fakeConnectionManager
            );
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should return a SqlResultImpl', function () {
            sqlService.execute('s', [], {}).should.be.instanceof(SqlResultImpl);
        });

        it('should call getRandomConnection once with data member argument being true', function () {
            sqlService.execute('s', [], {});
            fakeConnectionRegistry.getRandomConnection.calledOnceWithExactly(true).should.be.true;
        });

        it('should call toData on params', function () {
            const params = [1, 2, 3];
            sqlService.execute('s', params, {});
            fakeSerializationService.toData.firstCall.calledWithExactly(1).should.be.true;
            fakeSerializationService.toData.secondCall.calledWithExactly(2).should.be.true;
            fakeSerializationService.toData.thirdCall.calledWithExactly(3).should.be.true;
        });

        it('should call toData with string if datetime related wrapper classes are passed', function () {
            const params = [
                new HzLocalDate(1999, 12, 3),
                new HzLocalTime(10, 19, 10, 10),
                new HzOffsetDateTime(new Date(), 100),
                new HzLocalDateTime(new HzLocalDate(1999, 12, 3), new HzLocalTime(10, 19, 10, 10))
            ];
            sqlService.execute('s', params, {});
            fakeSerializationService.toData.getCall(0).args[0].should.be.a('string');
            fakeSerializationService.toData.getCall(1).args[0].should.be.a('string');
            fakeSerializationService.toData.getCall(2).args[0].should.be.a('string');
            fakeSerializationService.toData.getCall(3).args[0].should.be.a('string');
        });

        it('should call encodeRequest with correct params', function () {
            const params = [1, 2, 3];
            sqlService.execute('s', params, {}); // default options
            fakeEncodeRequest.lastCall.calledWithExactly(
                's',
                [1, 2, 3],
                SqlServiceImpl.DEFAULT_TIMEOUT,
                SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE,
                SqlServiceImpl.DEFAULT_SCHEMA,
                SqlServiceImpl.DEFAULT_EXPECTED_RESULT_TYPE,
                fakeQueryId
            ).should.be.true;

            sqlService.execute('s', params, {
                timeoutMillis: long.ZERO,
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
                fakeQueryId
            ).should.be.true;
        });

        it('should throw HazelcastSqlException if no connection to a data member is available', function () {
            fakeConnectionRegistry = {
                getRandomConnection: sandbox.fake.returns(null)
            };
            sqlService = new SqlServiceImpl(
                fakeConnectionRegistry,
                fakeSerializationService,
                fakeInvocationService,
                fakeConnectionManager
            );
            (() => sqlService.execute('s', [], {})).should.throw(HazelcastSqlException)
                .that.has.ownProperty('code', SqlErrorCode.CONNECTION_PROBLEM);
        });

        it('should construct a SqlResultImpl with default result type if it\'s not specified', function () {
            const fake = sandbox.replace(SqlResultImpl, 'newResult', sandbox.fake(SqlResultImpl.newResult));
            sqlService.execute('s', [], { cursorBufferSize: 1 });
            fake.calledOnceWithExactly(
                sqlService,
                fakeConnection,
                fakeQueryId,
                1,
                SqlServiceImpl.DEFAULT_FOR_RETURN_RAW_RESULT,
                fakeClientUUID
            ).should.be.true;
        });

        it('should construct a SqlResultImpl with default cursor buffer size if it\'s not specified', function () {
            const fake = sandbox.replace(SqlResultImpl, 'newResult', sandbox.fake(SqlResultImpl.newResult));

            sqlService.execute('s', [], { returnRawResult: true });
            fake.calledOnceWithExactly(
                sqlService,
                fakeConnection,
                fakeQueryId,
                SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE,
                true,
                fakeClientUUID
            ).should.be.true;
        });

        it('should construct a SqlResultImpl with parameters passed', function () {
            const fake = sandbox.replace(SqlResultImpl, 'newResult', sandbox.fake(SqlResultImpl.newResult));

            sqlService.execute('s', [], { returnRawResult: true, cursorBufferSize: 1 });
            fake.calledOnceWithExactly(
                sqlService,
                fakeConnection,
                fakeQueryId,
                1,
                true,
                fakeClientUUID
            ).should.be.true;
        });

        it('should invoke on connection returned from getRandomConnection', function () {
            sqlService.execute('s', [], {});
            fakeInvocationService.invokeOnConnection.calledOnceWithExactly(fakeConnection, fakeClientMessage).should.be.true;
        });

        it('should call handleExecuteResponse if invoke is successful', function () {
            const fakeResult = {};
            sandbox.replace(SqlResultImpl, 'newResult', sandbox.fake.returns(fakeResult));
            sqlService.execute('s', [], {});
            return assertTrueEventually(async () => {
                fakeHandleExecuteResponse.calledOnceWithExactly(
                    sandbox.match.same(fakeClientResponseMessage),
                    sandbox.match.same(fakeResult)
                ).should.be.true;
            }, 100, 1000);
        });

        it('should use connection member id to build a sql query id', function () {
            sqlService.execute('s', [], {});
            fakeFromMemberId.calledOnceWithExactly(fakeRemoteUUID).should.be.true;
        });

        it('should call result\'s onExecuteError method on invoke error', function () {
            const fakeError = new Error();
            const fakeResult = { onExecuteError: sandbox.fake() };

            sandbox.replace(SqlResultImpl, 'newResult', sandbox.fake.returns(fakeResult));
            fakeInvocationService = { invokeOnConnection: sandbox.fake.rejects(fakeError) };
            sqlService = new SqlServiceImpl(
                fakeConnectionRegistry,
                fakeSerializationService,
                fakeInvocationService,
                fakeConnectionManager
            );

            sqlService.execute('s', [], {});
            return assertTrueEventually(async () => {
                fakeResult.onExecuteError.calledOnceWithExactly(
                    sinon.match.instanceOf(HazelcastSqlException)
                        .and(sinon.match.hasOwn('cause', fakeError))
                ).should.be.true;
            }, 100, 1000);
        });

        it('should throw IllegalArgumentError any of the parameters are invalid', function () {
            // If sql property is not present in the object
            (() => sqlService.execute({ 'random': '' })).should.throw(IllegalArgumentError);

            // If timeout is less than -1 throw
            (() => sqlService.execute({ 'sql': '', options: { timeoutMillis: long.fromNumber(-3) } }))
                .should.throw(IllegalArgumentError);
            (() => sqlService.execute({ 'sql': '', options: { timeoutMillis: long.fromNumber(-2) } }))
                .should.throw(IllegalArgumentError);
            (() => sqlService.execute({
                'sql': '',
                options: { timeoutMillis: long.fromNumber(-1) }
            })).should.not.throw();
            (() => sqlService.execute({
                'sql': '',
                options: { timeoutMillis: long.fromNumber(0) }
            })).should.not.throw();

            // If cursorBufferSize is non positive throw
            (() => sqlService.execute({ 'sql': '', options: { cursorBufferSize: 1 } })).should.not.throw();
            (() => sqlService.execute({
                'sql': '',
                options: { cursorBufferSize: 0 }
            })).should.throw(IllegalArgumentError);
            (() => sqlService.execute({
                'sql': '',
                options: { cursorBufferSize: -1 }
            })).should.throw(IllegalArgumentError);

            /*
             Depending on the type of these values, they are passed as arguments. If parameter type is not the expected
             type, we expect the method to throw IllegalArgumentError
             */
            ['', 1, null, undefined, {}, [], Symbol(), BigInt(1), long.ZERO, true, 'ANY'].forEach(v => {
                if (typeof v !== 'string') {
                    // invalid sql string
                    (() => sqlService.execute(v, [], {})).should.throw(IllegalArgumentError);
                    (() => sqlService.execute({ 'sql': v })).should.throw(IllegalArgumentError);
                    // invalid schema
                    (() => sqlService.execute('', undefined, { schema: v })).should.throw(IllegalArgumentError);
                    (() => sqlService.execute({ 'sql': '', options: { schema: v } }))
                        .should.throw(IllegalArgumentError);
                } else {
                    // valid sql string
                    (() => sqlService.execute(v, [], {})).should.not.throw();
                    (() => sqlService.execute({ 'sql': v })).should.not.throw();
                    // valid schema
                    (() => sqlService.execute('', [], { schema: v })).should.not.throw();
                    (() => sqlService.execute({ 'sql': '', options: { schema: v } }))
                        .should.not.throw();
                }

                if (!Array.isArray(v) && typeof v !== 'undefined') { // passing undefined is same as not passing
                    // invalid params
                    (() => sqlService.execute('', v, {})).should.throw(IllegalArgumentError);
                    (() => sqlService.execute({ 'sql': '', params: v })).should.throw(IllegalArgumentError);
                } else {
                    // valid params
                    (() => sqlService.execute('', v, {})).should.not.throw();
                }

                if (typeof v !== 'number') {
                    // invalid cursor buffer size
                    (() => sqlService.execute('', [], { cursorBufferSize: v })).should.throw(IllegalArgumentError);
                    (() => sqlService.execute({ 'sql': '', options: { cursorBufferSize: v } }))
                        .should.throw(IllegalArgumentError);
                } else {
                    // valid cursor buffer size
                    (() => sqlService.execute('', [], { cursorBufferSize: v })).should.not.throw();
                    (() => sqlService.execute({ 'sql': '', options: { cursorBufferSize: v } })).should.not.throw();
                }

                if (!long.isLong(v)) {
                    // invalid timeoutMillis
                    (() => sqlService.execute('', [], { timeoutMillis: v })).should.throw(IllegalArgumentError);
                    (() => sqlService.execute({ 'sql': '', options: { timeoutMillis: v } }))
                        .should.throw(IllegalArgumentError);
                } else {
                    // valid timeoutMillis
                    (() => sqlService.execute('', [], { timeoutMillis: v })).should.not.throw();
                    (() => sqlService.execute({ 'sql': '', options: { timeoutMillis: v } })).should.not.throw();
                }

                if (!(v in SqlExpectedResultType && typeof v === 'string')) { // enum objects at js has both numbers and strings
                    // invalid expectedResultType
                    (() => sqlService.execute('', [], { expectedResultType: v })).should.throw(IllegalArgumentError);
                    (() => sqlService.execute({ 'sql': '', options: { expectedResultType: v } }))
                        .should.throw(IllegalArgumentError);
                } else {
                    // valid expectedResultType
                    (() => sqlService.execute('', [], { expectedResultType: v })).should.not.throw();
                    (() => sqlService.execute({ 'sql': '', options: { expectedResultType: v } }))
                        .should.not.throw();
                }

                if (typeof v !== 'boolean') {
                    // invalid returnRawResult
                    (() => sqlService.execute('', [], { returnRawResult: v })).should.throw(IllegalArgumentError);
                    (() => sqlService.execute({ 'sql': '', options: { returnRawResult: v } }))
                        .should.throw(IllegalArgumentError);
                } else {
                    // valid returnRawResult
                    (() => sqlService.execute('', [], { returnRawResult: v })).should.not.throw();
                    (() => sqlService.execute({ 'sql': '', options: { returnRawResult: v } })).should.not.throw();
                }
            });
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
                sandbox.match.same(fakeClientMessage)
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
        let sqlService;

        const fakeClientMessage = {};

        let fakeResult;

        beforeEach(function () {
            fakeResult = {
                onExecuteError: sandbox.fake(),
                onExecuteResponse: sandbox.fake()
            };
            // sql service
            sqlService = new SqlServiceImpl(
                {},
                {},
                {},
                {}
            );
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should decode the response', function () {
            const fake = sandbox.replace(SqlExecuteCodec, 'decodeResponse', sandbox.fake.returns({
                error: null,
                rowMetadata: [1]
            }));

            sqlService.handleExecuteResponse(fakeClientMessage, fakeResult);

            fake.calledOnceWithExactly(fakeClientMessage).should.be.true;
        });

        it('should call onExecuteError method of result if response error is not null', function () {
            const fakeResponse = {
                error: {
                    originatingMemberId: 1,
                    code: 1,
                    message: 'Execute error response'
                },
                rowMetadata: [],
                rowPage: {},
                updateCount: 1
            };

            const fake = sandbox.replace(SqlExecuteCodec, 'decodeResponse', sandbox.fake.returns(fakeResponse));

            sqlService.handleExecuteResponse(fakeClientMessage, fakeResult);

            fake.calledOnceWithExactly(fakeClientMessage).should.be.true;
            fakeResult.onExecuteError.calledWithMatch(fakeResponse.error).should.be.true;
            fakeResult.onExecuteResponse.called.should.be.false;
        });

        it('should call onExecuteResponse method of result if response error is null', function () {
            const fakeResponse = {
                error: null,
                rowMetadata: [1],
                rowPage: {},
                updateCount: 1
            };
            const fake = sandbox.replace(SqlExecuteCodec, 'decodeResponse', sandbox.fake.returns(fakeResponse));

            sqlService.handleExecuteResponse(fakeClientMessage, fakeResult);

            fake.calledOnceWithExactly(fakeClientMessage).should.be.true;

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
                {},
                {
                    invokeOnConnection: fakeInvokeOnConnection
                },
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
                sandbox.match.same(fakeRequestMessage)
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

        it('should return a promise that will be rejected if response contains an error', function (done) {
            const theError = {
                originatingMemberId: 1,
                code: 1,
                message: 'oops'
            };
            sandbox.replace(SqlFetchCodec, 'decodeResponse', sandbox.fake.returns({
                error: theError, rowPage: []
            }));

            sqlService.fetch({}, {}, 1).then(() => {
                done(new Error('Expected promise to be rejected'));
            }).catch(err => {
                sandbox.assert.match(err, theError);
                done();
            });
        });

        it('should return a promise that will be resolved with a SqlPage if response does not contain an error',
            function (done) {
                const expectedPage = {};
                const decodeFake = sandbox.fake.returns({
                    error: null, rowPage: expectedPage
                });
                sandbox.replace(SqlFetchCodec, 'decodeResponse', decodeFake);

                sqlService.fetch({}, {}, 1).then(actualPage => {
                    actualPage.should.be.eq(expectedPage);
                    done();
                }).catch(err => {
                    done(err);
                });
            });
    });
});
