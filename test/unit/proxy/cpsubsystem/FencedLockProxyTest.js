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

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const Long = require('long');
const {
    Client,
    IllegalMonitorStateError,
    LockOwnershipLostError,
    SessionExpiredError,
    WaitKeyCancelledError
} = require('../../../../');
const { FencedLockProxy } = require('../../../../lib/proxy/cpsubsystem/FencedLockProxy');
const { CPSessionManager } = require('../../../../lib/proxy/cpsubsystem/CPSessionManager');
const { RaftGroupId } = require('../../../../lib/proxy/cpsubsystem/RaftGroupId');

describe('FencedLockProxyTest', function () {

    let clientStub;
    let cpSessionManagerStub;
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
        await proxy.lock();

        prepareGetSession(currentSessionId);
    }

    function stubRequest(methodName, result, firstCallErr) {
        let called = 0;
        const stub = sandbox.stub(proxy, methodName).callsFake(() => {
            if (++called === 1 && firstCallErr !== undefined) {
                return Promise.reject(firstCallErr);
            }
            if (result !== undefined && typeof result === 'number') {
                return Promise.resolve(Long.fromNumber(result));
            }
            return Promise.resolve(result);
        });
        return stub;
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
        clientStub = sandbox.stub(Client.prototype);
        cpSessionManagerStub = sandbox.stub(CPSessionManager.prototype);
        clientStub.getCPSubsystem.returns({
            getCPSessionManager: () => cpSessionManagerStub
        });
        proxy = new FencedLockProxy(clientStub, prepareGroupId(), 'mylock@mygroup', 'mylock');
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
    });

    it('tryLock: should return fence on successful acquire', async function () {
        prepareAcquireSession(1);
        stubRequestTryLock(2);

        const fence = await proxy.tryLock();
        expect(fence.toNumber()).to.be.equal(2);
    });

    it('tryLock: should return release session on failed acquire', async function () {
        prepareAcquireSession(1);
        stubRequestTryLock(0);

        const fence = await proxy.tryLock();
        expect(fence.toNumber()).to.be.equal(0);
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
    });

    it('tryLock: should return invalid fence on expired session error and no timeout', async function () {
        sandbox.useFakeTimers(0);
        prepareAcquireSession(1);
        stubRequestTryLock(2, new SessionExpiredError());

        const promise = proxy.tryLock();
        // advance time as if requests were real
        sandbox.useFakeTimers(100);
        const fence = await promise;

        expect(fence.toNumber()).to.be.equal(0);
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

    it('tryLock: should return invalid fence on wait key cancelled error', async function () {
        prepareAcquireSession(1);
        stubRequestTryLock(2, new WaitKeyCancelledError());

        const fence = await proxy.tryLock();

        expect(fence.toNumber()).to.be.equal(0);
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
    });

    it('tryLock: should throw on unexpected error', async function () {
        prepareAcquireSession(1);
        stubRequestTryLock(2, new Error());

        await expect(proxy.tryLock()).to.be.rejectedWith(Error);
    });

    it('unlock: should release session when lock held', async function () {
        await prepareForUnlock(1, 1);
        stubRequestUnlock();

        await proxy.unlock();
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
    });

    it('unlock: should throw when no lock held', async function () {
        await expect(proxy.unlock()).to.be.rejectedWith(IllegalMonitorStateError);
    });

    it('unlock: should throw when session id has changed', async function () {
        await prepareForUnlock(1, 2);

        await expect(proxy.unlock()).to.be.rejectedWith(LockOwnershipLostError);
    });

    it('unlock: should throw when no active session id', async function () {
        prepareGetSession(-1);

        await expect(proxy.unlock()).to.be.rejectedWith(IllegalMonitorStateError);
    });

    it('unlock: should throw on expired session error', async function () {
        await prepareForUnlock(1, 1);
        stubRequestUnlock(new SessionExpiredError());

        await expect(proxy.unlock()).to.be.rejectedWith(LockOwnershipLostError);
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('isLocked: should throw when session id has changed', async function () {
        await prepareForUnlock(1, 2);

        await expect(proxy.isLocked()).to.be.rejectedWith(LockOwnershipLostError);
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

    it('isLocked: should return true when lock is held', async function () {
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
