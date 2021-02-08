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

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const Long = require('long');
const { AssertionError } = require('assert');
const {
    IllegalMonitorStateError,
    LockOwnershipLostError,
    SessionExpiredError,
    WaitKeyCancelledError
} = require('../../../../');
const { FencedLockProxy } = require('../../../../lib/proxy/cpsubsystem/FencedLockProxy');
const { CPSessionManager } = require('../../../../lib/proxy/cpsubsystem/CPSessionManager');
const { RaftGroupId } = require('../../../../lib/proxy/cpsubsystem/RaftGroupId');
const { CPSubsystemImpl } = require('../../../../lib/CPSubsystem');
const { InvocationService } = require('../../../../lib/invocation/InvocationService');
const { SerializationServiceV1 } = require('../../../../lib/serialization/SerializationService');

describe('FencedLockProxyTest', function () {

    let cpSubsystemStub;
    let cpSessionManagerStub;
    let serializationServiceStub;
    let invocationServiceStub;
    let proxy;

    function prepareGroupId() {
        return new RaftGroupId('test', Long.fromNumber(0), Long.fromNumber(42));
    }

    function prepareAcquireSession(sessionId) {
        cpSessionManagerStub.acquireSession.returns(Promise.resolve(Long.fromNumber(sessionId)));
    }

    function prepareGetSession(sessionId) {
        cpSessionManagerStub.getSessionId.returns(Long.fromNumber(sessionId));
    }

    async function prepareForUnlock(lockedSessionId, currentSessionId) {
        prepareAcquireSession(lockedSessionId);
        stubRequestLock(2);
        prepareGetSession(currentSessionId);

        return proxy.lock();
    }

    function stubRequest(methodName, result, firstCallErr) {
        let called = 0;
        return sandbox.stub(proxy, methodName).callsFake(() => {
            if (++called === 1 && firstCallErr !== undefined) {
                return Promise.reject(firstCallErr);
            }
            if (result !== undefined && typeof result === 'number') {
                return Promise.resolve(Long.fromNumber(result));
            }
            return Promise.resolve(result);
        });
    }

    function stubRequestLock(fence, firstCallErr) {
        return stubRequest('requestLock', fence, firstCallErr);
    }

    function stubRequestTryLock(fence, firstCallErr) {
        return stubRequest('requestTryLock', fence, firstCallErr);
    }

    function stubRequestUnlock(firstCallErr) {
        return stubRequest('requestUnlock', undefined, firstCallErr);
    }

    function stubRequestLockOwnershipState(state, firstCallErr) {
        return stubRequest('requestLockOwnershipState', {
            fence: Long.fromNumber(state.fence),
            sessionId: Long.fromNumber(state.sessionId),
            threadId: Long.fromNumber(state.threadId)
        }, firstCallErr);
    }

    beforeEach(function () {
        cpSessionManagerStub = sandbox.stub(CPSessionManager.prototype);
        serializationServiceStub = sandbox.stub(SerializationServiceV1.prototype);
        invocationServiceStub = sandbox.stub(InvocationService.prototype);
        cpSubsystemStub = sandbox.stub(CPSubsystemImpl.prototype);
        cpSubsystemStub.getCPSessionManager.returns(cpSessionManagerStub);

        proxy = new FencedLockProxy(
            prepareGroupId(),
            'mylock@mygroup',
            'mylock',
            serializationServiceStub,
            invocationServiceStub,
            cpSubsystemStub
        );
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('lock: should return fence on successful acquire', async function () {
        prepareAcquireSession(1);
        stubRequestLock(2);

        const fence = await proxy.lock();
        expect(fence.toNumber()).to.be.equal(2);
    });

    it('lock: should keep trying to acquire on expired session error', async function () {
        prepareAcquireSession(1);
        stubRequestLock(2, new SessionExpiredError());

        const fence = await proxy.lock();
        expect(fence.toNumber()).to.be.equal(2);
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('lock: should throw on wait key cancelled error', async function () {
        prepareAcquireSession(1);
        stubRequestLock(2, new WaitKeyCancelledError());

        await expect(proxy.lock()).to.be.rejectedWith(IllegalMonitorStateError);
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
    });

    it('lock: should throw on unexpected error', async function () {
        prepareAcquireSession(1);
        stubRequestLock(2, new Error());

        await expect(proxy.lock()).to.be.rejectedWith(Error);
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
    });

    it('tryLock: should not release session on successful acquire', async function () {
        prepareAcquireSession(1);
        stubRequestTryLock(2);

        const fence = await proxy.tryLock();
        expect(fence.toNumber()).to.be.equal(2);
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.false;
    });

    it('tryLock: should release session on failed acquire', async function () {
        prepareAcquireSession(1);
        stubRequestTryLock(0);

        const fence = await proxy.tryLock();
        expect(fence).to.be.undefined;
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
    });

    it('tryLock: should return undefined on expired session error and no timeout', async function () {
        sandbox.useFakeTimers(0);
        prepareAcquireSession(1);
        stubRequestTryLock(2, new SessionExpiredError());

        const promise = proxy.tryLock();
        // advance time as if requests were real
        sandbox.useFakeTimers(100);
        const fence = await promise;

        expect(fence).to.be.undefined;
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('tryLock: should keep trying on expired session error and specified timeout', async function () {
        sandbox.useFakeTimers(0);
        prepareAcquireSession(1);
        stubRequestTryLock(2, new SessionExpiredError());

        const promise = proxy.tryLock(1000);
        // advance time as if requests were real
        sandbox.useFakeTimers(100);
        const fence = await promise;

        expect(fence.toNumber()).to.be.equal(2);
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('tryLock: should release session on wait key cancelled error', async function () {
        prepareAcquireSession(1);
        stubRequestTryLock(2, new WaitKeyCancelledError());

        const fence = await proxy.tryLock();

        expect(fence).to.be.undefined;
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
    });

    it('tryLock: should throw on unexpected error', async function () {
        prepareAcquireSession(1);
        stubRequestTryLock(2, new Error());

        await expect(proxy.tryLock()).to.be.rejectedWith(Error);
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
    });

    it('tryLock: should throw when timeout is not a number', function () {
        expect(() => proxy.tryLock('invalid timeout')).to.throw(AssertionError);
    });

    it('unlock: should release session when lock held', async function () {
        const fence = await prepareForUnlock(1, 1);
        stubRequestUnlock();

        await proxy.unlock(fence);
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
    });

    it('unlock: should throw on no argument', function () {
        expect(() => proxy.unlock()).to.throw(TypeError);
    });

    it('unlock: should throw on invalid fence given', function () {
        expect(() => proxy.unlock(Long.fromNumber(1))).to.throw(TypeError);
    });

    it('unlock: should throw when session id has changed', async function () {
        const fence = await prepareForUnlock(1, 2);

        await expect(proxy.unlock(fence)).to.be.rejectedWith(LockOwnershipLostError);
    });

    it('unlock: should throw when no active session id and no lock is held', async function () {
        const fence = await prepareForUnlock(1, -1);
        // clean up internal map as if the lock is not held
        proxy.lockedSessionIds.clear();

        await expect(proxy.unlock(fence)).to.be.rejectedWith(IllegalMonitorStateError);
    });

    it('unlock: should throw on expired session error', async function () {
        const fence = await prepareForUnlock(1, 1);
        stubRequestUnlock(new SessionExpiredError());

        await expect(proxy.unlock(fence)).to.be.rejectedWith(LockOwnershipLostError);
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('isLocked: should return true when lock is held', async function () {
        prepareGetSession(1);
        stubRequestLockOwnershipState({
            fence: 2,
            sessionId: 3,
            threadId: 3
        });

        const result = await proxy.isLocked();
        expect(result).to.be.true;
    });

    it('isLocked: should return false when lock is not held', async function () {
        prepareGetSession(1);
        stubRequestLockOwnershipState({
            fence: 0,
            sessionId: 0,
            threadId: 0
        });

        const result = await proxy.isLocked();
        expect(result).to.be.false;
    });

    it('isLocked: should throw on unexpected error', async function () {
        prepareGetSession(1);
        stubRequestLockOwnershipState({}, new Error());

        await expect(proxy.isLocked()).to.be.rejectedWith(Error);
    });
});
