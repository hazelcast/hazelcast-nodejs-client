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

const { SqlServiceImpl } = require('../../../lib/sql/SqlService.js');
const { SqlResultImpl } = require('../../../lib/sql/SqlResult.js');
const { SqlRowMetadataImpl } = require('../../../lib/sql/SqlRowMetadata.js');
const { SqlExpectedResultType } = require('../../../lib/sql/SqlStatement.js');
const { SqlQueryId } = require('../../../lib/sql/SqlQueryId.js');
const { SqlErrorCode } = require('../../../lib/sql/SqlErrorCode.js');

const { SqlExecuteCodec } = require('../../../lib/codec/SqlExecuteCodec.js');
const { SqlCloseCodec } = require('../../../lib/codec/SqlCloseCodec.js');
const { SqlFetchCodec } = require('../../../lib/codec/SqlFetchCodec.js');
const { UuidUtil } = require('../../../lib/util/UuidUtil.js');
const { assertTrueEventually } = require('../../TestUtil.js');
const { IllegalArgumentError, HazelcastSqlException } = require('../../../lib/core/HazelcastError.js');

const long = require('long');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('chai');

describe('SqlServiceTest', function () {

    describe('execute', function () {
        let sqlService;

        let fakeExecuteCodec;
        let fakeGetRandomConnection;

        let connectionRegistryStub;
        let handleExecuteResponseStub;
        let serializationServiceStub;
        let invocationServiceStub;
        let connectionManagerStub;
        let fromMemberIdStub;
        let connectionStub;

        const fakeQueryId = {};
        const fakeClientMessage = {};
        const fakeRemoteUUID = UuidUtil.generate();
        const fakeClientResponseMessage = {};

        beforeEach(function () {

            connectionStub = {
                getRemoteUuid: sandbox.fake.returns(fakeRemoteUUID)
            };

            fakeGetRandomConnection = sandbox.fake.returns(connectionStub);
            fakeExecuteCodec = sandbox.fake.returns(fakeClientMessage);
            sandbox.replace(SqlExecuteCodec, 'encodeRequest', fakeExecuteCodec);

            handleExecuteResponseStub = sandbox.stub(SqlServiceImpl.prototype, 'handleExecuteResponse');
            fromMemberIdStub = sandbox.stub(SqlQueryId, 'fromMemberId').returns(fakeQueryId);
            connectionRegistryStub = {
                getRandomConnection: fakeGetRandomConnection
            };
            serializationServiceStub = {toData: sandbox.fake(v => v)};
            invocationServiceStub = {invokeOnConnection: sandbox.fake.resolves(fakeClientResponseMessage)};
            connectionManagerStub = {getClientUuid: sandbox.fake.returns('')};

            // sql service
            sqlService = new SqlServiceImpl(
                connectionRegistryStub,
                serializationServiceStub,
                invocationServiceStub,
                connectionManagerStub
            );
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should return a SqlResultImpl', function () {
            expect(sqlService.execute('s', [], {})).to.be.instanceof(SqlResultImpl);
        });

        it('should call getRandomConnection once with data member argument being true', function () {
            sqlService.execute('s', [], {});
            expect(fakeGetRandomConnection.calledOnceWithExactly(true)).to.be.true;
        });

        it('should call toData on params', function () {
            const params = [1, 2, 3];
            sqlService.execute('s', params, {});
            expect(serializationServiceStub.toData.firstCall.calledWithExactly(1)).to.be.true;
            expect(serializationServiceStub.toData.secondCall.calledWithExactly(2)).to.be.true;
            expect(serializationServiceStub.toData.thirdCall.calledWithExactly(3)).to.be.true;
        });

        it('should call encodeRequest with correct params', function () {
            const params = [1, 2, 3];
            sqlService.execute('s', params, {}); // default options
            expect(fakeExecuteCodec.lastCall.calledWithExactly(
                's',
                [1, 2, 3],
                SqlServiceImpl.DEFAULT_TIMEOUT,
                SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE,
                SqlServiceImpl.DEFAULT_SCHEMA,
                SqlServiceImpl.DEFAULT_EXPECTED_RESULT_TYPE,
                fakeQueryId
            )).to.be.true;

            sqlService.execute('s', params, {
                timeoutMillis: long.ZERO,
                cursorBufferSize: 1,
                returnRawResult: true,
                schema: 'sd',
                expectedResultType: 'ANY'
            });
            expect(fakeExecuteCodec.lastCall.calledWithExactly(
                's',
                [1, 2, 3],
                long.ZERO,
                1,
                'sd',
                SqlExpectedResultType.ANY,
                fakeQueryId
            )).to.be.true;
        });

        it('should throw HazelcastSqlException if no connection to a data member is available', function () {
            connectionRegistryStub = {
                getRandomConnection: sandbox.fake.returns(null)
            };
            sqlService = new SqlServiceImpl(
                connectionRegistryStub,
                serializationServiceStub,
                invocationServiceStub,
                connectionManagerStub
            );
            expect(() => sqlService.execute('s', [], {})).to.throw(HazelcastSqlException)
                .that.has.a.property('code', SqlErrorCode.CONNECTION_PROBLEM);
        });

        it('should construct a SqlResultImpl with default result type if it\'s not specified', function () {
            const sqlResultSpy = sandbox.spy(SqlResultImpl, 'newResult');
            sqlService.execute('s', [], {cursorBufferSize: 1});
            expect(sqlResultSpy.calledOnceWithExactly(
                sqlService,
                connectionStub,
                fakeQueryId,
                1,
                SqlServiceImpl.DEFAULT_FOR_RETURN_RAW_RESULT
            )).to.be.true;
        });

        it('should construct a SqlResultImpl with default cursor buffer size if it\'s not specified', function () {
            const sqlResultSpy = sandbox.spy(SqlResultImpl, 'newResult');
            sqlService.execute('s', [], {returnRawResult: true});
            expect(sqlResultSpy.calledOnceWithExactly(
                sqlService,
                connectionStub,
                fakeQueryId,
                SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE,
                true
            )).to.be.true;
        });

        it('should construct a SqlResultImpl with parameters passed', function () {
            const sqlResultSpy = sandbox.spy(SqlResultImpl, 'newResult');
            sqlService.execute('s', [], {returnRawResult: true, cursorBufferSize: 1});
            expect(sqlResultSpy.calledOnceWithExactly(
                sqlService,
                connectionStub,
                fakeQueryId,
                1,
                true
            )).to.be.true;
        });

        it('should invoke on connection returned from getRandomConnection', function () {
            sqlService.execute('s', [], {});
            expect(invocationServiceStub.invokeOnConnection.calledOnceWithExactly(connectionStub, fakeClientMessage)).to.be.true;
        });

        it('should call handleExecuteResponse if invoke is successful', function () {
            const fakeResult = {};
            sandbox.replace(SqlResultImpl, 'newResult', sinon.fake.returns(fakeResult));
            sqlService.execute('s', [], {});
            return assertTrueEventually(async () => {
                expect(handleExecuteResponseStub.calledOnceWithExactly(
                    sandbox.match.same(fakeClientResponseMessage),
                    sandbox.match.same(fakeResult)
                )).to.be.true;
            }, 100, 1000);
        });

        it('should use connection member id to build a sql query id', function () {
            sqlService.execute('s', [], {});
            expect(fromMemberIdStub.calledOnceWithExactly(fakeRemoteUUID)).to.be.true;
        });

        it('should call result\'s onExecuteError method on invoke error', function () {
            const fakeError = new Error();
            const fakeResult = {onExecuteError: sinon.spy()};

            sandbox.replace(SqlResultImpl, 'newResult', sinon.fake.returns(fakeResult));
            invocationServiceStub = {invokeOnConnection: sandbox.fake.rejects(fakeError)};
            sqlService = new SqlServiceImpl(
                connectionRegistryStub,
                serializationServiceStub,
                invocationServiceStub,
                connectionManagerStub
            );

            sqlService.execute('s', [], {});
            return assertTrueEventually(async () => {
                expect(fakeResult.onExecuteError.calledOnceWithExactly(
                    sandbox.match.same(fakeError)
                )).to.be.true;
            }, 100, 1000);
        });

        it('should throw IllegalArgumentError any of the parameters are invalid', function () {
            // If sql property is not present in the object
            expect(() => sqlService.execute({'sqll': ''})).to.throw(IllegalArgumentError);

            // If timeout is less than -1 throw
            expect(() => sqlService.execute({'sql': '', options: {timeoutMillis: long.fromNumber(-3)}}))
                .to.throw(IllegalArgumentError);
            expect(() => sqlService.execute({'sql': '', options: {timeoutMillis: long.fromNumber(-2)}}))
                .to.throw(IllegalArgumentError);
            expect(() => sqlService.execute({'sql': '', options: {timeoutMillis: long.fromNumber(-1)}})).not.to.throw();
            expect(() => sqlService.execute({'sql': '', options: {timeoutMillis: long.fromNumber(0)}})).not.to.throw();

            // If cursorBufferSize is non positive throw
            expect(() => sqlService.execute({'sql': '', options: {cursorBufferSize: 1}})).not.to.throw();
            expect(() => sqlService.execute({'sql': '', options: {cursorBufferSize: 0}})).to.throw(IllegalArgumentError);
            expect(() => sqlService.execute({'sql': '', options: {cursorBufferSize: -1}})).to.throw(IllegalArgumentError);

            /*
             Depending on the type of these values, they are passed as arguments. If parameter type is not the expected
             type, we expect the method to throw IllegalArgumentError
             */
            ['', 1, null, undefined, {}, [], Symbol(), BigInt(1), long.ZERO, true, 'ANY'].forEach(v => {
                if (typeof v !== 'string') {
                    // invalid sql string
                    expect(() => sqlService.execute(v, [], {})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': v})).to.throw(IllegalArgumentError);
                    // invalid schema
                    expect(() => sqlService.execute('', undefined, {schema: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {schema: v}}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid sql string
                    expect(() => sqlService.execute(v, [], {})).not.to.throw();
                    expect(() => sqlService.execute({'sql': v})).not.to.throw();
                    // valid schema
                    expect(() => sqlService.execute('', [], {schema: v})).not.to.throw();
                    expect(() => sqlService.execute({'sql': '', options: {schema: v}}))
                        .not.to.throw();
                }

                if (!Array.isArray(v) && typeof v !== 'undefined') { // passing undefined is same as not passing
                    // invalid params
                    expect(() => sqlService.execute('', v, {})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', params: v})).to.throw(IllegalArgumentError);
                } else {
                    // valid params
                    expect(() => sqlService.execute('', v, {})).not.to.throw();
                }

                if (typeof v !== 'number') {
                    // invalid cursor buffer size
                    expect(() => sqlService.execute('', [], {cursorBufferSize: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {cursorBufferSize: v}}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid cursor buffer size
                    expect(() => sqlService.execute('', [], {cursorBufferSize: v})).not.to.throw();
                    expect(() => sqlService.execute({'sql': '', options: {cursorBufferSize: v}})).not.to.throw();
                }

                if (!long.isLong(v)) {
                    // invalid timeoutMillis
                    expect(() => sqlService.execute('', [], {timeoutMillis: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {timeoutMillis: v}}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid timeoutMillis
                    expect(() => sqlService.execute('', [], {timeoutMillis: v})).not.to.throw();
                    expect(() => sqlService.execute({'sql': '', options: {timeoutMillis: v}})).not.to.throw();
                }

                if (!(v in SqlExpectedResultType && typeof v === 'string')) { // enum objects at js has both numbers and strings
                    // invalid expectedResultType
                    expect(() => sqlService.execute('', [], {expectedResultType: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {expectedResultType: v}}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid expectedResultType
                    expect(() => sqlService.execute('', [], {expectedResultType: v})).not.to.throw();
                    expect(() => sqlService.execute({'sql': '', options: {expectedResultType: v}}))
                        .not.to.throw();
                }

                if (typeof v !== 'boolean') {
                    // invalid returnRawResult
                    expect(() => sqlService.execute('', [], {returnRawResult: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {returnRawResult: v}}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid returnRawResult
                    expect(() => sqlService.execute('', [], {returnRawResult: v})).not.to.throw();
                    expect(() => sqlService.execute({'sql': '', options: {returnRawResult: v}})).not.to.throw();
                }
            });
        });

    });
    describe('close', function () {
        let sqlService;
        let fakeCloseCodec;
        let invocationServiceStub;

        const fakeClientMessage = {};

        beforeEach(function () {

            fakeCloseCodec = sandbox.fake.returns(fakeClientMessage);
            SqlCloseCodec.encodeRequest = fakeCloseCodec;

            invocationServiceStub = {invokeOnConnection: sandbox.fake.resolves()};

            // sql service
            sqlService = new SqlServiceImpl(
                {},
                {},
                invocationServiceStub,
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

            expect(invocationServiceStub.invokeOnConnection.calledOnceWithExactly(
                sandbox.match.same(fakeConnection),
                sandbox.match.same(fakeClientMessage)
            )).to.be.true;
        });

        it('should encode request using queryId passed', function () {
            const fakeConnection = {};
            const fakeQueryId = {};
            sqlService.close(fakeConnection, fakeQueryId);

            expect(fakeCloseCodec.calledOnceWithExactly(
                sandbox.match.same(fakeQueryId)
            )).to.be.true;
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
            const decodeStub = sandbox.stub(SqlExecuteCodec, 'decodeResponse').returns({
                error: null,
                rowMetadata: [1]
            });

            sqlService.handleExecuteResponse(fakeClientMessage, fakeResult);

            expect(decodeStub.calledOnceWithExactly(fakeClientMessage)).to.be.true;
        });

        it('should call onExecuteError method of result if response error is not null', function () {
            const fakeResponse = {
                error: {
                    originatingMemberId: 1,
                    code: 1,
                    message: 'oops'
                },
                rowMetadata: [],
                rowPage: {},
                updateCount: 1
            };
            const decodeStub = sandbox.stub(SqlExecuteCodec, 'decodeResponse').returns(fakeResponse);
            sqlService.handleExecuteResponse(fakeClientMessage, fakeResult);

            expect(decodeStub.calledOnceWithExactly(fakeClientMessage)).to.be.true;
            expect(fakeResult.onExecuteError.calledWithMatch(fakeResponse.error)).to.be.true;
            expect(fakeResult.onExecuteResponse.called).to.be.false;
        });

        it('should call onExecuteResponse method of result if response error is null', function () {
            const fakeResponse = {
                error: null,
                rowMetadata: [1],
                rowPage: {},
                updateCount: 1
            };
            const decodeStub = sandbox.stub(SqlExecuteCodec, 'decodeResponse').returns(fakeResponse);
            sqlService.handleExecuteResponse(fakeClientMessage, fakeResult);

            expect(decodeStub.calledOnceWithExactly(fakeClientMessage)).to.be.true;

            expect(fakeResult.onExecuteResponse.calledOnceWithExactly(
                sandbox.match(new SqlRowMetadataImpl(fakeResponse.rowMetadata)),
                sandbox.match.same(fakeResponse.rowPage),
                fakeResponse.updateCount
            )).to.be.true;

            expect(fakeResult.onExecuteError.called).to.be.false;
        });
    });

    describe('fetch', function () {
        let sqlService;

        let fakeInvokeOnConnection;
        let encodeFake;
        const fakeClientResponseMessage = {};
        const fakeRequestMessage = {};

        beforeEach(function () {

            encodeFake = sinon.fake.returns(fakeRequestMessage);
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
            const decodeFake = sinon.fake.returns({error: null, rowPage: []});
            sandbox.replace(SqlFetchCodec, 'decodeResponse', decodeFake);
            const fakeQueryId = {};
            sqlService.fetch({}, fakeQueryId, 1);

            expect(encodeFake.calledOnceWithExactly(
                sandbox.match.same(fakeQueryId),
                1
            )).to.be.true;
        });

        it('should invoke on connection', function () {
            const decodeFake = sinon.fake.returns({error: null, rowPage: []});
            sandbox.replace(SqlFetchCodec, 'decodeResponse', decodeFake);
            const fakeConnection = {};
            sqlService.fetch(fakeConnection, {}, 1);

            expect(fakeInvokeOnConnection.calledOnceWithExactly(
                sandbox.match.same(fakeConnection),
                sandbox.match.same(fakeRequestMessage)
            )).to.be.true;
        });

        it('should decode the response', function () {
            const decodeFake = sinon.fake.returns({error: null, rowPage: []});
            sandbox.replace(SqlFetchCodec, 'decodeResponse', decodeFake);

            sqlService.fetch({}, {}, 1).then(() => {
                expect(decodeFake.calledOnceWithExactly(
                    sandbox.match.same(fakeClientResponseMessage)
                )).to.be.true;
            });
        });

        it('should return a promise that will be rejected if response contains an error', function (done) {
            const theError = {
                originatingMemberId: 1,
                code: 1,
                message: 'oops'
            };
            const decodeFake = sinon.fake.returns({
                error: theError, rowPage: []
            });
            sandbox.replace(SqlFetchCodec, 'decodeResponse', decodeFake);

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
            const decodeFake = sinon.fake.returns({
                error: null, rowPage: expectedPage
            });
            sandbox.replace(SqlFetchCodec, 'decodeResponse', decodeFake);

            sqlService.fetch({}, {}, 1).then(actualPage => {
                expect(actualPage).to.be.eq(expectedPage);
                done();
            }).catch(err => {
                done(err);
            });
        });
    });
});
