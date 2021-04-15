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

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('chai');

describe('SqlServiceTest', function () {

    describe('execute', function () {
        let sqlService;
        let connectionRegistryStub;
        let serializationServiceStub;
        let invocationServiceStub;
        let sqlResultSpy;
        let handleExecuteResponseStub;
        const remoteUUID = UuidUtil.generate();

        beforeEach(function () {
            // spies
            sqlResultSpy = sandbox.spy(SqlResultImpl, 'newResult');
            handleExecuteResponseStub = sandbox.spy(SqlServiceImpl.prototype, 'handleExecuteResponse');
            sandbox.spy(SqlExecuteCodec, 'encodeRequest');
            sandbox.spy(SqlQueryId, 'fromMemberId');

            // stubs
            connectionRegistryStub = {
                getRandomConnection: sandbox.fake.returns({
                    getRemoteUuid: sandbox.fake.returns(remoteUUID)
                })
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
            expect(sqlResultSpy.called).to.be.true;
        });
    });
});
