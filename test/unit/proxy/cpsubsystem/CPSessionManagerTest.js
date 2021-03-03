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
    SessionExpiredError
} = require('../../../../');
const {
    SessionState,
    CPSessionManager
} = require('../../../../lib/proxy/cpsubsystem/CPSessionManager');
const { DefaultLogger } = require('../../../../lib/logging/DefaultLogger');
const { RaftGroupId } = require('../../../../lib/proxy/cpsubsystem/RaftGroupId');

describe('CPSessionManagerTest', function () {

    afterEach(function () {
        sandbox.restore();
    });

    describe('SessionState', function () {

        it('acquire: should increment counter', function () {
            const state = new SessionState(Long.fromNumber(42), null, 1000);

            expect(state.acquireCount).to.be.equal(0);

            const id = state.acquire(5);
            expect(id.toNumber()).to.be.equal(42);
            expect(state.acquireCount).to.be.equal(5);
        });

        it('release: should decrement counter', function () {
            const state = new SessionState(Long.fromNumber(42), null, 1000);

            state.acquire(3);
            expect(state.acquireCount).to.be.equal(3);

            state.release(2);
            expect(state.acquireCount).to.be.equal(1);
        });

        it('isInUse: should consider current acquire count', function () {
            const state = new SessionState(Long.fromNumber(42), null, 1000);

            expect(state.acquireCount).to.be.equal(0);
            expect(state.isInUse()).to.be.false;

            state.acquire(1);
            expect(state.isInUse()).to.be.true;
        });

        it('isValid: should consider current acquire count', function () {
            sandbox.useFakeTimers(0);
            const state = new SessionState(Long.fromNumber(42), null, 1000);

            // session should be expired now
            sandbox.useFakeTimers(2000);
            expect(state.isValid()).to.be.false;

            state.acquire(1);
            expect(state.isValid()).to.be.true;
        });

        it('isValid: should consider current time', function () {
            sandbox.useFakeTimers(0);
            const state = new SessionState(Long.fromNumber(42), null, 1000);

            expect(state.isValid()).to.be.true;

            // session should be expired now
            sandbox.useFakeTimers(2000);
            expect(state.isValid()).to.be.false;
        });
    });

    describe('CPProxySessionManager', function () {

        const GROUP_ID = 42;
        const GROUP_ID_AS_STRING = prepareGroupId().getStringId();
        const SESSION_ID = 24;
        const TTL_MILLIS = 1000;
        const HEARTBEAT_MILLIS = 100;

        let clientStub;
        let sessionManager;

        function prepareGroupId() {
            return new RaftGroupId('test', Long.fromNumber(0), Long.fromNumber(GROUP_ID));
        }

        function prepareSessionState(groupId) {
            return new SessionState(Long.fromNumber(SESSION_ID), groupId, TTL_MILLIS);
        }

        function stubRequestNewSession() {
            const stub = sandbox.stub(sessionManager, 'requestNewSession');
            stub.returns(Promise.resolve({
                sessionId: Long.fromNumber(SESSION_ID),
                ttlMillis: Long.fromNumber(TTL_MILLIS),
                heartbeatMillis: Long.fromNumber(HEARTBEAT_MILLIS)
            }));
            return stub;
        }

        function stubRequestGenerateThreadId(threadId) {
            const stub = sandbox.stub(sessionManager, 'requestGenerateThreadId');
            stub.returns(Promise.resolve(Long.fromNumber(threadId)));
            return stub;
        }

        beforeEach(function () {
            clientStub = sandbox.stub(Client.prototype);
            const loggerStub = sandbox.stub(DefaultLogger.prototype);
            clientStub.getLoggingService.returns({ getLogger: () => loggerStub });
            sessionManager = new CPSessionManager(clientStub);
        });

        afterEach(async function () {
            // prevents requestCloseSession calls
            sessionManager.sessions.clear();
            await sessionManager.shutdown();
        });

        it('getSessionId: should return no session id for unknown session', function () {
            const id = sessionManager.getSessionId(prepareGroupId());
            expect(id.toNumber()).to.be.equal(-1);
        });

        it('getSessionId: should return session id for known session', function () {
            sessionManager.sessions.set(GROUP_ID_AS_STRING, prepareSessionState());
            const id = sessionManager.getSessionId(prepareGroupId());
            expect(id.toNumber()).to.be.equal(SESSION_ID);
        });

        it('acquireSession: should reject when shut down', async function () {
            await sessionManager.shutdown();

            await expect(sessionManager.acquireSession(prepareGroupId(42))).to.be.rejectedWith(IllegalStateError);
        });

        it('acquireSession: should create new session for unknown group id', async function () {
            stubRequestNewSession();

            const id = await sessionManager.acquireSession(prepareGroupId());
            expect(id.toNumber()).to.be.equal(SESSION_ID);
            expect(sessionManager.sessions.get(GROUP_ID_AS_STRING).acquireCount).to.be.equal(1);
        });

        it('acquireSession: should consider permits when creating new session', async function () {
            stubRequestNewSession();

            const id = await sessionManager.acquireSession(prepareGroupId(), 3);
            expect(id.toNumber()).to.be.equal(SESSION_ID);
            expect(sessionManager.sessions.get(GROUP_ID_AS_STRING).acquireCount).to.be.equal(3);
        });

        it('acquireSession: should create new session for existing invalid session', async function () {
            const requestNewSessionStub = stubRequestNewSession();

            const groupId = prepareGroupId();
            const state = prepareSessionState(groupId);
            sandbox.stub(state, 'isValid').returns(false);
            sessionManager.sessions.set(GROUP_ID_AS_STRING, state);

            const id = await sessionManager.acquireSession(groupId);
            expect(id.toNumber()).to.be.equal(SESSION_ID);
            expect(requestNewSessionStub.withArgs(state.groupId).calledOnce).to.be.true;
            expect(sessionManager.sessions.get(GROUP_ID_AS_STRING).acquireCount).to.be.equal(1);
        });

        it('acquireSession: should not create new session for existing valid session', async function () {
            const requestNewSessionStub = stubRequestNewSession();
            sessionManager.sessions.set(GROUP_ID_AS_STRING, prepareSessionState());

            const id = await sessionManager.acquireSession(prepareGroupId());
            expect(id.toNumber()).to.be.equal(SESSION_ID);
            expect(requestNewSessionStub.notCalled).to.be.true;
            expect(sessionManager.sessions.get(GROUP_ID_AS_STRING).acquireCount).to.be.equal(1);
        });

        it('releaseSession: should decrement acquire counter by 1 for known session', function () {
            sessionManager.sessions.set(GROUP_ID_AS_STRING, prepareSessionState());

            sessionManager.releaseSession(prepareGroupId(), Long.fromNumber(SESSION_ID));
            expect(sessionManager.sessions.get(GROUP_ID_AS_STRING).acquireCount).to.be.equal(-1);
        });

        it('releaseSession: should decrement acquire counter by given permits for known session', function () {
            sessionManager.sessions.set(GROUP_ID_AS_STRING, prepareSessionState());

            sessionManager.releaseSession(prepareGroupId(), Long.fromNumber(SESSION_ID), 3);
            expect(sessionManager.sessions.get(GROUP_ID_AS_STRING).acquireCount).to.be.equal(-3);
        });

        it('releaseSession: should not decrement acquire counter for unknown session', function () {
            sessionManager.sessions.set(GROUP_ID_AS_STRING, prepareSessionState());

            sessionManager.releaseSession(prepareGroupId(), Long.fromNumber(1));
            expect(sessionManager.sessions.get(GROUP_ID_AS_STRING).acquireCount).to.be.equal(0);
        });

        it('invalidateSession: should forget known session', function () {
            sessionManager.sessions.set(GROUP_ID_AS_STRING, prepareSessionState());

            sessionManager.invalidateSession(prepareGroupId(), Long.fromNumber(SESSION_ID));
            expect(sessionManager.sessions.size).to.be.equal(0);
        });

        it('invalidateSession: should do nothing when called for unknown session', function () {
            sessionManager.sessions.set(GROUP_ID_AS_STRING, prepareSessionState());

            sessionManager.invalidateSession(prepareGroupId(), Long.fromNumber(1));
            expect(sessionManager.sessions.size).to.be.equal(1);
        });

        it('createUniqueThreadId: should reject when shut down', async function () {
            await sessionManager.shutdown();

            await expect(sessionManager.createUniqueThreadId(prepareGroupId(42))).to.be.rejectedWith(IllegalStateError);
        });

        it('createUniqueThreadId: should generate new thread id', async function () {
            stubRequestGenerateThreadId(5);

            const id = await sessionManager.createUniqueThreadId(prepareGroupId());
            expect(id.toNumber()).to.be.equal(5);
        });

        it('shutdown: should cancel heartbeat task', async function () {
            sessionManager.heartbeatTask = {};
            const cancelStub = sandbox.stub(sessionManager, 'cancelHeartbeatTask');

            await sessionManager.shutdown();
            expect(cancelStub.calledOnce).to.be.true;
        });

        it('shutdown: should close known sessions', async function () {
            const groupId = prepareGroupId();
            const state = prepareSessionState(groupId);
            sessionManager.sessions.set(GROUP_ID_AS_STRING, state);
            const closeSessionStub = sandbox.stub(sessionManager, 'requestCloseSession');
            closeSessionStub.returns(Promise.resolve());

            await sessionManager.shutdown();
            expect(closeSessionStub.withArgs(state.groupId, state.id).calledOnce).to.be.true;
            expect(sessionManager.sessions.size).to.be.equal(0);
        });

        it('heartbeatTask: should send heartbeats periodically', function (done) {
            stubRequestNewSession();

            const requestHeartbeatStub = sandbox.stub(sessionManager, 'requestHeartbeat');
            requestHeartbeatStub.returns(Promise.resolve());

            const groupId = prepareGroupId();
            sessionManager.acquireSession(groupId)
                .then((sessionId) => {
                    setTimeout(() => {
                        expect(requestHeartbeatStub.withArgs(groupId, sessionId).callCount).to.be.greaterThan(1);
                        expect(sessionManager.sessions.size).to.be.equal(1);
                        done();
                    }, HEARTBEAT_MILLIS * 3);
                })
                .catch(done);
        });

        it('heartbeatTask: should stop sending heartbeats for released session', function (done) {
            stubRequestNewSession();

            const requestHeartbeatStub = sandbox.stub(sessionManager, 'requestHeartbeat');
            requestHeartbeatStub.returns(Promise.resolve());

            const groupId = prepareGroupId();
            sessionManager.acquireSession(groupId)
                .then((sessionId) => {
                    sessionManager.releaseSession(groupId, sessionId);
                    setTimeout(() => {
                        expect(requestHeartbeatStub.notCalled).to.be.true;
                        done();
                    }, HEARTBEAT_MILLIS * 3);
                })
                .catch(done);
        });

        it('heartbeatTask: should invalidate sessions when error received', function (done) {
            stubRequestNewSession();

            sandbox.replace(sessionManager, 'requestHeartbeat', function () {
                return Promise.reject(new SessionExpiredError());
            });

            const groupId = prepareGroupId();
            sessionManager.acquireSession(groupId)
                .then(() => {
                    setTimeout(() => {
                        expect(sessionManager.sessions.size).to.be.equal(0);
                        done();
                    }, HEARTBEAT_MILLIS * 3);
                })
                .catch(done);
        });
    });
});
