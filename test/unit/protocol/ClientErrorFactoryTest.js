/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

const { expect } = require('chai');
const { IllegalStateError, UndefinedErrorCodeError } = require('../../../');
const { ClientErrorFactory } = require('../../../lib/protocol/ErrorFactory');
const { ClientProtocolErrorCodes } = require('../../../lib/protocol/ClientProtocolErrorCodes');

describe('ClientErrorFactoryTest', function () {

    const factory = new ClientErrorFactory();

    function createErrorHolder(code) {
        return {
            errorCode: code,
            className: 'foo.bar.Baz1',
            message: 'error: foo bar',
            stackTraceElements: [
                {
                    className: 'foo.bar.Baz2',
                    methodName: 'foobar',
                    fileName: 'FooBar.java',
                    lineNumber: 42
                }
            ]
        };
    }

    it('createError: should create error with no cause', function () {
        const code = ClientProtocolErrorCodes.ILLEGAL_STATE;
        const error = factory.createError([createErrorHolder(code)], 0);

        expect(error).to.be.instanceOf(IllegalStateError);
        expect(error.message).to.be.equal('error: foo bar');
        expect(error.cause).to.be.null;
        expect(error.serverStackTrace).to.deep.equal(createErrorHolder(code).stackTraceElements);
    });

    it('createError: should create error with given cause', function () {
        const code = ClientProtocolErrorCodes.ILLEGAL_STATE;
        const error = factory.createError([createErrorHolder(code), createErrorHolder(code)], 0);

        expect(error).to.be.instanceOf(IllegalStateError);
        expect(error.message).to.be.equal('error: foo bar');
        expect(error.serverStackTrace).to.deep.equal(createErrorHolder(code).stackTraceElements);

        const cause = error.cause;
        expect(cause).to.be.instanceOf(IllegalStateError);
        expect(cause.message).to.be.equal('error: foo bar');
        expect(cause.serverStackTrace).to.deep.equal(createErrorHolder(code).stackTraceElements);
        expect(cause.cause).to.be.null;
    });

    it('createError: should create UndefinedErrorCodeError for unknown code', function () {
        const error = factory.createError([createErrorHolder(-1)], 0);

        expect(error).to.be.instanceOf(UndefinedErrorCodeError);
    });
});
