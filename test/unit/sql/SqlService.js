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
const { SqlExecuteCodec } = require('../../../lib/codec/SqlExecuteCodec');
const { SqlQueryId } = require('../../../lib/sql/SqlQueryId');
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

        it('should construct a SqlResultImpl with default cursor size 4096 and result type as object', function () {
            sqlService.execute('s', [], {});
            expect(sqlResultSpy.calledOnceWithExactly(
                sqlService,
                connectionStub,
                queryIdStub,
                4096,
                true
            )).to.be.true;
        });

        it('should throw IllegalArgumentError if sql is not string or valid object', function () {
            expect(() => sqlService.execute(1, [], {})).to.throw(IllegalArgumentError);
            expect(() => sqlService.execute(null, [], {})).to.throw(IllegalArgumentError);
            expect(() => sqlService.execute(undefined, [], {})).to.throw(IllegalArgumentError);
            expect(() => sqlService.execute({}, [], {})).to.throw(IllegalArgumentError);
            expect(() => sqlService.execute([], [], {})).to.throw(IllegalArgumentError);

            // In object
            expect(() => sqlService.execute({'sql': ''}, [], {})).not.to.throw(IllegalArgumentError);
            expect(() => sqlService.execute({'sql': '', options: {}, parameters: []}, [], {})).not.to.throw(IllegalArgumentError);
            expect(() => sqlService.execute({'sql': '', options: {}, parameters: []}, [], {})).not.to.throw(IllegalArgumentError);
        });
    });
});
