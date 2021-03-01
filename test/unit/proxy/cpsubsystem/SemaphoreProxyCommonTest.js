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
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const Long = require('long');
const { AssertionError } = require('assert');
const { Client } = require('../../../../');
const { SessionlessSemaphoreProxy } = require('../../../../lib/proxy/cpsubsystem/SessionlessSemaphoreProxy');
const { SessionAwareSemaphoreProxy } = require('../../../../lib/proxy/cpsubsystem/SessionAwareSemaphoreProxy');
const { CPSessionManager } = require('../../../../lib/proxy/cpsubsystem/CPSessionManager');
const { RaftGroupId } = require('../../../../lib/proxy/cpsubsystem/RaftGroupId');

describe('SemaphoreProxyCommonTest', function () {

    let clientStub;
    let cpSessionManagerStub;
    const testTypes = ['sessionless', 'sessionaware'];

    function createProxy(type) {
        switch (type) {
            case 'sessionless':
                return new SessionlessSemaphoreProxy(clientStub, prepareGroupId(), 'semaphore@mygroup', 'semaphore');
            case 'sessionaware':
                return new SessionAwareSemaphoreProxy(clientStub, prepareGroupId(), 'semaphore@mygroup', 'semaphore');
            default:
                throw new Error('Unknown type: ' + type);
        }
    }

    function prepareGroupId() {
        return new RaftGroupId('test', Long.fromNumber(0), Long.fromNumber(42));
    }

    beforeEach(function () {
        clientStub = sandbox.stub(Client.prototype);
        cpSessionManagerStub = sandbox.stub(CPSessionManager.prototype);
        clientStub.getCPSubsystem.returns({
            getCPSessionManager: () => cpSessionManagerStub
        });
    });

    afterEach(function () {
        sandbox.restore();
    });

    for (const type of testTypes) {
        describe(`[${type}]`, function () {

            it('unlock: should throw for non-number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.init('permits')).to.throw(AssertionError);
            });

            it('unlock: should throw for negative number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.init(-1)).to.throw(AssertionError);
            });

            it('acquire: should throw for non-number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.acquire('permits')).to.throw(AssertionError);
            });

            it('acquire: should throw for zero', function () {
                const proxy = createProxy(type);
                expect(() => proxy.acquire(0)).to.throw(AssertionError);
            });

            it('acquire: should throw for negative number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.acquire(-1)).to.throw(AssertionError);
            });

            it('tryAcquire: should throw for non-number permits', function () {
                const proxy = createProxy(type);
                expect(() => proxy.tryAcquire('permits')).to.throw(AssertionError);
            });

            it('tryAcquire: should throw for zero permits', function () {
                const proxy = createProxy(type);
                expect(() => proxy.tryAcquire(0)).to.throw(AssertionError);
            });

            it('tryAcquire: should throw for negative permits', function () {
                const proxy = createProxy(type);
                expect(() => proxy.tryAcquire(-1)).to.throw(AssertionError);
            });

            it('tryAcquire: should throw for non-number timeout', function () {
                const proxy = createProxy(type);
                expect(() => proxy.tryAcquire(1, 'timeout')).to.throw(AssertionError);
            });

            it('tryAcquire: should throw for negative timeout', function () {
                const proxy = createProxy(type);
                expect(() => proxy.tryAcquire(1, -1)).to.throw(AssertionError);
            });

            it('release: should throw for non-number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.release('permits')).to.throw(AssertionError);
            });

            it('release: should throw for zero', function () {
                const proxy = createProxy(type);
                expect(() => proxy.release(0)).to.throw(AssertionError);
            });

            it('release: should throw for negative number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.release(-1)).to.throw(AssertionError);
            });

            it('reducePermits: should throw for non-number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.reducePermits('permits')).to.throw(AssertionError);
            });

            it('reducePermits: should throw for negative number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.reducePermits(-1)).to.throw(AssertionError);
            });

            it('increasePermits: should throw for non-number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.increasePermits('permits')).to.throw(AssertionError);
            });

            it('increasePermits: should throw for negative number', function () {
                const proxy = createProxy(type);
                expect(() => proxy.increasePermits(-1)).to.throw(AssertionError);
            });
        });
    }
});
