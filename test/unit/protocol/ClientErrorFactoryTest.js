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

    function assertKnownError(error, clazz, code) {
        expect(error).to.be.instanceOf(clazz);
        expect(error.message).to.be.equal('error: foo bar');
        expect(error.serverStackTrace).to.deep.equal(createErrorHolder(code).stackTraceElements);
    }

    function assertUnknownError(error) {
        expect(error).to.be.instanceOf(UndefinedErrorCodeError);
        expect(error.message).to.contain('error: foo bar');
        expect(error.message).to.contain('foo.bar.Baz1');
        expect(error.serverStackTrace).to.deep.equal(createErrorHolder(-1).stackTraceElements);
    }

    it('createError: should create error with no cause', function () {
        const code = ClientProtocolErrorCodes.ILLEGAL_STATE;
        const error = factory.createError([createErrorHolder(code)], 0);

        assertKnownError(error, IllegalStateError, code);
        expect(error.cause).to.be.null;
    });

    it('createError: should create error with given cause', function () {
        const code = ClientProtocolErrorCodes.ILLEGAL_STATE;
        const error = factory.createError([createErrorHolder(code), createErrorHolder(code)], 0);

        assertKnownError(error, IllegalStateError, code);

        const cause = error.cause;
        assertKnownError(cause, IllegalStateError, code);
        expect(cause.cause).to.be.null;
    });

    it('createError: should create UndefinedErrorCodeError for single exception with unknown code', function () {
        const error = factory.createError([createErrorHolder(-1)], 0);

        assertUnknownError(error);
        expect(error.cause).to.be.null;
    });

    it('createError: should create UndefinedErrorCodeError with known cause for chain of exceptions', function () {
        const knownCode = ClientProtocolErrorCodes.ILLEGAL_STATE;
        const error = factory.createError([createErrorHolder(-1), createErrorHolder(knownCode)], 0);

        assertUnknownError(error);

        const cause = error.cause;
        assertKnownError(cause, IllegalStateError, knownCode);
    });
});
