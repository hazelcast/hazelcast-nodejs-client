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
const { SqlExpectedResultType } = require('../../../lib/sql/SqlStatement.js');
const { SqlQueryId } = require('../../../lib/sql/SqlQueryId.js');
const { SqlErrorCode } = require('../../../lib/sql/SqlErrorCode.js');

const { SqlExecuteCodec } = require('../../../lib/codec/SqlExecuteCodec.js');
const { SqlCloseCodec } = require('../../../lib/codec/SqlCloseCodec.js');
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
                expect(handleExecuteResponseStub.calledOnce).to.be.true;
                expect(handleExecuteResponseStub.firstCall.args[0]).to.be.eq(fakeClientResponseMessage);
                expect(handleExecuteResponseStub.firstCall.args[1]).to.be.eq(fakeResult);
                expect(handleExecuteResponseStub.firstCall.args[2]).to.be.eq(connectionStub);
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
                expect(fakeResult.onExecuteError.calledOnce).to.be.true;
                expect(fakeResult.onExecuteError.firstCall.args[0]).to.be.eq(fakeError);
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

            expect(invocationServiceStub.invokeOnConnection.calledOnce).to.be.true;
            expect(invocationServiceStub.invokeOnConnection.firstCall.args[0]).to.be.eq(fakeConnection);
            expect(invocationServiceStub.invokeOnConnection.firstCall.args[1]).to.be.eq(fakeClientMessage);
        });

        it('should encode request using queryId passed', function () {
            const fakeConnection = {};
            const fakeQueryId = {};
            sqlService.close(fakeConnection, fakeQueryId);

            expect(fakeCloseCodec.calledOnce).to.be.true;
            expect(fakeCloseCodec.firstCall.args[0]).to.be.eq(fakeQueryId);
        });

    });
    describe('handleExecuteResponse', function () {

    });

    describe('fetch', function () {

    });
});
