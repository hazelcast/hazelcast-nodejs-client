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
const { SqlExpectedResultType } = require('../../../lib/sql/SqlStatement');
const { SqlQueryId } = require('../../../lib/sql/SqlQueryId');
const long = require('long');

const { SqlExecuteCodec } = require('../../../lib/codec/SqlExecuteCodec');
const { UuidUtil } = require('../../../lib/util/UuidUtil');
const { IllegalArgumentError } = require('../../../lib/core/HazelcastError');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('chai');

describe('SqlServiceTest', function () {

    describe('execute', function () {
        let sqlService;

        let sqlResultSpy;
        let handleExecuteResponseSpy;

        let executeCodecStub;
        let connectionRegistryStub;
        let serializationServiceStub;
        let invocationServiceStub;
        let connectionStub;
        let queryIdStub;

        const remoteUUID = UuidUtil.generate();

        beforeEach(function () {
            // spies
            sqlResultSpy = sandbox.spy(SqlResultImpl, 'newResult');
            handleExecuteResponseSpy = sandbox.spy(SqlServiceImpl.prototype, 'handleExecuteResponse');

            // stubs
            connectionStub = {
                getRemoteUuid: sandbox.fake.returns(remoteUUID)
            };

            executeCodecStub = sandbox.stub(SqlExecuteCodec, 'encodeRequest');
            queryIdStub = {};
            sandbox.stub(SqlQueryId, 'fromMemberId').returns(queryIdStub);
            connectionRegistryStub = {
                getRandomConnection: sandbox.fake.returns(connectionStub)
            };
            serializationServiceStub = {toData: sandbox.spy()};
            invocationServiceStub = {invokeOnConnection: sandbox.fake.resolves(null)};

            // sql service
            sqlService = new SqlServiceImpl(
                connectionRegistryStub,
                {},
                invocationServiceStub,
                {}
            );
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('should return a SqlResultImpl', function () {
            expect(sqlService.execute('s', [], {})).to.be.instanceof(SqlResultImpl);
        });

        it('should construct a SqlResultImpl with default result type if it\'s not specified', function () {
            sqlService.execute('s', [], {cursorBufferSize: 1});
            expect(sqlResultSpy.calledOnceWithExactly(
                sqlService,
                connectionStub,
                queryIdStub,
                1,
                SqlServiceImpl.DEFAULT_FOR_RETURN_RAW_RESULT
            )).to.be.true;
        });

        it('should construct a SqlResultImpl with default cursor buffer size if it\'s not specified', function () {
            sqlService.execute('s', [], {returnRawResult: true});
            expect(sqlResultSpy.calledOnceWithExactly(
                sqlService,
                connectionStub,
                queryIdStub,
                SqlServiceImpl.DEFAULT_CURSOR_BUFFER_SIZE,
                true
            )).to.be.true;
        });

        it('should throw IllegalArgumentError any of the parameters are invalid', function () {
            ['', 1, null, undefined, {}, [], Symbol(), BigInt(1), long.ZERO, true, 'ANY'].forEach(v => {
                if (typeof v !== 'string') {
                    // invalid sql string
                    expect(() => sqlService.execute(v, [], {})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': v, options: {}, params: undefined})).to.throw(IllegalArgumentError);
                    // invalid schema
                    expect(() => sqlService.execute('', undefined, {schema: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {schema: v}, params: undefined}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid sql string
                    expect(() => sqlService.execute(v, [], {})).not.to.throw;
                    expect(() => sqlService.execute({'sql': v, options: {}, params: undefined})).not.to.throw;
                    // valid schema
                    expect(() => sqlService.execute('', [], {schema: v})).not.to.throw;
                    expect(() => sqlService.execute({'sql': '', options: {schema: v}, params: undefined}))
                        .not.to.throw;
                }

                if (!Array.isArray(v) && typeof v !== 'undefined') { // passing undefined is same as not passing
                    // invalid params
                    expect(() => sqlService.execute('', v, {})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: undefined, params: v})).to.throw(IllegalArgumentError);
                } else {
                    // valid params
                    expect(() => sqlService.execute('', v, {})).not.to.throw;
                    expect(() => sqlService.execute({'sql': '', options: undefined, params: v})).not.to.throw;
                }

                if (typeof v !== 'number') {
                    // invalid cursor buffer size
                    expect(() => sqlService.execute('', [], {cursorBufferSize: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {cursorBufferSize: v}, params: undefined}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid cursor buffer size
                    expect(() => sqlService.execute('', [], {schema: v})).not.to.throw;
                    expect(() => sqlService.execute({'sql': '', options: {schema: v}, params: undefined})).not.to.throw;
                }

                if (!long.isLong(v)) {
                    // invalid timeoutMillis
                    expect(() => sqlService.execute('', [], {timeoutMillis: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {timeoutMillis: v}, params: undefined}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid timeoutMillis
                    expect(() => sqlService.execute('', [], {timeoutMillis: v})).not.to.throw;
                    expect(() => sqlService.execute({'sql': '', options: {timeoutMillis: v}, params: undefined})).not.to.throw;
                }

                if (!(v in SqlExpectedResultType && typeof v === 'string')) { // enum objects at js has both numbers and strings
                    // invalid expectedResultType
                    expect(() => sqlService.execute('', [], {expectedResultType: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {expectedResultType: v}, params: undefined}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid expectedResultType
                    expect(() => sqlService.execute('', [], {expectedResultType: v})).not.to.throw;
                    expect(() => sqlService.execute({'sql': '', options: {expectedResultType: v}, params: undefined}))
                        .not.to.throw;
                }

                if (typeof v !== 'boolean') {
                    // invalid returnRawResult
                    expect(() => sqlService.execute('', [], {returnRawResult: v})).to.throw(IllegalArgumentError);
                    expect(() => sqlService.execute({'sql': '', options: {returnRawResult: v}, params: undefined}))
                        .to.throw(IllegalArgumentError);
                } else {
                    // valid returnRawResult
                    expect(() => sqlService.execute('', [], {returnRawResult: v})).not.to.throw;
                    expect(() => sqlService.execute({'sql': '', options: {returnRawResult: v}, params: undefined})).not.to.throw;
                }
            });
        });
    });
});
