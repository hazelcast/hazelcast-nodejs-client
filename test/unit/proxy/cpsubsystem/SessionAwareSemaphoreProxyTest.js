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
const {
    Client,
    IllegalStateError,
    SessionExpiredError,
    WaitKeyCancelledError
} = require('../../../../');
const { SessionAwareSemaphoreProxy } = require('../../../../lib/proxy/cpsubsystem/SessionAwareSemaphoreProxy');
const { CPSessionManager } = require('../../../../lib/proxy/cpsubsystem/CPSessionManager');
const { RaftGroupId } = require('../../../../lib/proxy/cpsubsystem/RaftGroupId');

describe('SessionAwareSemaphoreProxyTest', function () {

    let clientStub;
    let cpSessionManagerStub;
    let proxy;

    const DRAIN_SESSION_ACQ_COUNT = 1024;

    function prepareGroupId() {
        return new RaftGroupId('test', Long.fromNumber(0), Long.fromNumber(42));
    }

    function prepareAcquireSession(sessionId) {
        cpSessionManagerStub.acquireSession.returns(Promise.resolve(Long.fromNumber(sessionId)));
    }

    function prepareGetSession(sessionId) {
        cpSessionManagerStub.getSessionId.returns(Long.fromNumber(sessionId));
    }

    async function prepareForRelease(lockedSessionId, currentSessionId) {
        prepareAcquireSession(lockedSessionId);
        stubRequestAcquire();
        prepareGetSession(currentSessionId);

        return proxy.acquire();
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

    function stubRequestAcquire(acquired, firstCallErr) {
        return stubRequest('requestAcquire', acquired, firstCallErr);
    }

    function stubRequestRelease(firstCallErr) {
        return stubRequest('requestRelease', undefined, firstCallErr);
    }

    function stubRequestDrain(count, firstCallErr) {
        return stubRequest('requestDrain', count, firstCallErr);
    }

    function stubRequestChange(firstCallErr) {
        return stubRequest('requestChange', undefined, firstCallErr);
    }

    function expectReleaseSession(permits) {
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.true;
        if (cpSessionManagerStub.releaseSession.args[0][2] != undefined) {
            expect(cpSessionManagerStub.releaseSession.args[0][2]).to.be.equal(permits);
        } else {
            // undefined assumes release for 1 permit
            expect(permits).to.be.equal(1);
        }
    }

    beforeEach(function () {
        clientStub = sandbox.stub(Client.prototype);
        cpSessionManagerStub = sandbox.stub(CPSessionManager.prototype);
        clientStub.getCPSubsystem.returns({
            getCPSessionManager: () => cpSessionManagerStub
        });
        proxy = new SessionAwareSemaphoreProxy(clientStub, prepareGroupId(), 'semaphore@mygroup', 'semaphore');
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('acquire: should acquire when no errors', async function () {
        prepareAcquireSession(1);
        stubRequestAcquire(true);

        await proxy.acquire();
    });

    it('acquire: should keep trying to acquire on expired session error', async function () {
        prepareAcquireSession(1);
        stubRequestAcquire(true, new SessionExpiredError());

        await proxy.acquire();
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('acquire: should throw on wait key cancelled error', async function () {
        prepareAcquireSession(1);
        stubRequestAcquire(true, new WaitKeyCancelledError());

        await expect(proxy.acquire(2)).to.be.rejectedWith(IllegalStateError);
        expectReleaseSession(2);
    });

    it('acquire: should throw on unexpected error', async function () {
        prepareAcquireSession(1);
        stubRequestAcquire(true, new Error());

        await expect(proxy.acquire()).to.be.rejectedWith(Error);
        expectReleaseSession(1);
    });

    it('tryAcquire: should not release session when acquired', async function () {
        prepareAcquireSession(1);
        stubRequestAcquire(true);

        const result = await proxy.tryAcquire(1);
        expect(result).to.be.true;
        expect(cpSessionManagerStub.releaseSession.calledOnce).to.be.false;
    });

    it('tryAcquire: should release session when acquired', async function () {
        prepareAcquireSession(1);
        stubRequestAcquire(false);

        const result = await proxy.tryAcquire(3);
        expect(result).to.be.false;
        expectReleaseSession(3);
    });

    it('tryAcquire: should return false on expired session error and no timeout', async function () {
        sandbox.useFakeTimers(0);
        prepareAcquireSession(1);
        stubRequestAcquire(true, new SessionExpiredError());

        const promise = proxy.tryAcquire(1);
        // advance time as if requests were real
        sandbox.useFakeTimers(100);
        const result = await promise;

        expect(result).to.be.false;
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('tryAcquire: should keep trying on expired session error and specified timeout', async function () {
        sandbox.useFakeTimers(0);
        prepareAcquireSession(1);
        stubRequestAcquire(true, new SessionExpiredError());

        const promise = proxy.tryAcquire(1, 1000);
        // advance time as if requests were real
        sandbox.useFakeTimers(100);
        const result = await promise;

        expect(result).to.be.true;
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('tryAcquire: should release session on wait key cancelled error', async function () {
        prepareAcquireSession(1);
        stubRequestAcquire(true, new WaitKeyCancelledError());

        const result = await proxy.tryAcquire(1);

        expect(result).to.be.false;
        expectReleaseSession(1);
    });

    it('tryAcquire: should throw on unexpected error', async function () {
        prepareAcquireSession(1);
        stubRequestAcquire(true, new Error());

        await expect(proxy.tryAcquire(2)).to.be.rejectedWith(Error);
        expectReleaseSession(2);
    });

    it('release: should release session when acquired previously', async function () {
        await prepareForRelease(1, 1);
        stubRequestRelease();

        await proxy.release(5);
        expectReleaseSession(5);
    });

    it('release: should throw when no active session id', async function () {
        await prepareForRelease(1, -1);

        await expect(proxy.release()).to.be.rejectedWith(IllegalStateError);
    });

    it('release: should throw on expired session error', async function () {
        await prepareForRelease(1, 1);
        stubRequestRelease(new SessionExpiredError());

        await expect(proxy.release()).to.be.rejectedWith(IllegalStateError);
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('release: should release session and throw on unknown error', async function () {
        await prepareForRelease(1, 1);
        stubRequestRelease(new Error());

        await expect(proxy.release(7)).to.be.rejectedWith(Error);
        expectReleaseSession(7);
    });

    it('drainPermits: should release session and return drained count when no errors', async function () {
        prepareAcquireSession(1);
        stubRequestDrain(7);

        const drained = await proxy.drainPermits();
        expect(drained.toNumber()).to.be.equal(7);
        expectReleaseSession(DRAIN_SESSION_ACQ_COUNT - 7);
    });

    it('drainPermits: should invalidate session and retry on session expired error', async function () {
        prepareAcquireSession(1);
        stubRequestDrain(100, new SessionExpiredError());

        const drained = await proxy.drainPermits();
        expect(drained.toNumber()).to.be.equal(100);
        expectReleaseSession(DRAIN_SESSION_ACQ_COUNT - 100);
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('drainPermits: should throw on unknown error', async function () {
        prepareAcquireSession(1);
        stubRequestDrain(100, new Error());

        await expect(proxy.drainPermits()).to.be.rejectedWith(Error);
        expectReleaseSession(DRAIN_SESSION_ACQ_COUNT);
    });

    it('reducePermits: should release session when no errors', async function () {
        prepareAcquireSession(1);
        stubRequestChange();

        await proxy.reducePermits(3);
        expectReleaseSession(1);
    });

    it('reducePermits: should invalidate session and throw on session expired error', async function () {
        prepareAcquireSession(1);
        stubRequestChange(new SessionExpiredError());

        await expect(proxy.reducePermits(5)).to.be.rejectedWith(IllegalStateError);
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('reducePermits: should release session and throw on unknown error', async function () {
        prepareAcquireSession(1);
        stubRequestChange(new Error());

        await expect(proxy.reducePermits(5)).to.be.rejectedWith(Error);
        expectReleaseSession(1);
    });

    it('increasePermits: should release session when no errors', async function () {
        prepareAcquireSession(1);
        stubRequestChange();

        await proxy.increasePermits(13);
        expectReleaseSession(1);
    });

    it('increasePermits: should invalidate session and throw on session expired error', async function () {
        prepareAcquireSession(1);
        stubRequestChange(new SessionExpiredError());

        await expect(proxy.increasePermits(15)).to.be.rejectedWith(IllegalStateError);
        expect(cpSessionManagerStub.invalidateSession.calledOnce).to.be.true;
    });

    it('increasePermits: should release session and throw on unknown error', async function () {
        prepareAcquireSession(1);
        stubRequestChange(new Error());

        await expect(proxy.increasePermits(51)).to.be.rejectedWith(Error);
        expectReleaseSession(1);
    });
});
