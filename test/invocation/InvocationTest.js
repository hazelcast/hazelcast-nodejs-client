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
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { Client, IndeterminateOperationStateError } = require('../../');
const { Invocation, InvocationService } = require('../../lib/invocation/InvocationService');
const { LifecycleServiceImpl } = require('../../lib/LifecycleService');
const { ClientMessage } = require('../../lib/protocol/ClientMessage');
const { DefaultLogger } = require('../../lib/logging/DefaultLogger');

describe('InvocationTest', function () {

    let clientStub;
    let serviceStub;

    beforeEach(function () {
        clientStub = sandbox.stub(Client.prototype);
        serviceStub = sandbox.stub(InvocationService.prototype);
        clientStub.getInvocationService.returns(serviceStub);
        clientStub.getLifecycleService.returns(sandbox.stub(LifecycleServiceImpl.prototype));
        const loggerStub = sandbox.stub(DefaultLogger.prototype);
        clientStub.getLoggingService.returns({ getLogger: () => loggerStub });
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('notify: should complete when no expected backups', function () {
        const invocation = new Invocation(clientStub);
        const messageStub = sandbox.stub(ClientMessage.prototype);
        messageStub.getNumberOfBackupAcks.returns(0);

        const completeStub = sandbox.stub(invocation, 'complete');
        invocation.notify(messageStub);

        expect(completeStub.withArgs(messageStub).calledOnce).to.be.true;
    });

    it('notify: should not complete when expected and no received backups', function () {
        const invocation = new Invocation(clientStub);
        const messageStub = sandbox.stub(ClientMessage.prototype);
        messageStub.getNumberOfBackupAcks.returns(1);

        const completeStub = sandbox.stub(invocation, 'complete');
        invocation.notify(messageStub);

        expect(completeStub.notCalled).to.be.true;
        expect(invocation.pendingResponseReceivedMillis).to.be.greaterThan(0);
        expect(invocation.backupsAcksExpected).to.be.equal(1);
        expect(invocation.pendingResponseMessage).to.be.equal(messageStub);
    });

    it('notify: should complete when expected and received backups are equal', function () {
        const invocation = new Invocation(clientStub);
        invocation.backupsAcksReceived = 1;
        const messageStub = sandbox.stub(ClientMessage.prototype);
        messageStub.getNumberOfBackupAcks.returns(1);

        const completeStub = sandbox.stub(invocation, 'complete');
        invocation.notify(messageStub);

        expect(completeStub.withArgs(messageStub).calledOnce).to.be.true;
    });

    it('notifyBackupComplete: should not complete when no pending message', function () {
        const invocation = new Invocation(clientStub);

        const completeStub = sandbox.stub(invocation, 'complete');
        invocation.notifyBackupComplete();

        expect(completeStub.notCalled).to.be.true;
        expect(invocation.backupsAcksReceived).to.be.equal(1);
    });

    it('notifyBackupComplete: should not complete when not all acks received', function () {
        const invocation = new Invocation(clientStub);
        const messageStub = sandbox.stub(ClientMessage.prototype);
        invocation.pendingResponseMessage = messageStub;
        invocation.backupsAcksReceived = 1;
        invocation.backupsAcksExpected = 3;

        const completeStub = sandbox.stub(invocation, 'complete');
        invocation.notifyBackupComplete();

        expect(completeStub.notCalled).to.be.true;
        expect(invocation.backupsAcksReceived).to.be.equal(2);
    });

    it('notifyBackupComplete: should complete when all acks received', function () {
        const invocation = new Invocation(clientStub);
        const messageStub = sandbox.stub(ClientMessage.prototype);
        invocation.pendingResponseMessage = messageStub;
        invocation.backupsAcksReceived = 1;
        invocation.backupsAcksExpected = 2;

        const completeStub = sandbox.stub(invocation, 'complete');
        invocation.notifyBackupComplete();

        expect(completeStub.withArgs(messageStub).calledOnce).to.be.true;
        expect(invocation.backupsAcksReceived).to.be.equal(2);
    });

    it('detectAndHandleBackupTimeout: should not complete when all acks received', function () {
        const invocation = new Invocation(clientStub);
        const messageStub = sandbox.stub(ClientMessage.prototype);
        invocation.pendingResponseMessage = messageStub;
        invocation.backupsAcksReceived = 1;
        invocation.backupsAcksExpected = 1;

        const completeStub = sandbox.stub(invocation, 'complete');
        invocation.detectAndHandleBackupTimeout(1);

        expect(completeStub.notCalled).to.be.true;
    });

    it('detectAndHandleBackupTimeout: should not complete when not all acks received and timeout not reached', function () {
        const invocation = new Invocation(clientStub);
        const messageStub = sandbox.stub(ClientMessage.prototype);
        invocation.pendingResponseMessage = messageStub;
        invocation.backupsAcksReceived = 1;
        invocation.backupsAcksExpected = 1;

        invocation.pendingResponseReceivedMillis = 40;
        sandbox.useFakeTimers(40); // 40 + 1 > 40

        const completeStub = sandbox.stub(invocation, 'complete');
        invocation.detectAndHandleBackupTimeout(1);

        expect(completeStub.notCalled).to.be.true;
    });

    it('detectAndHandleBackupTimeout: should complete when not all acks received and timeout reached', function () {
        serviceStub.shouldFailOnIndeterminateState = false;

        const invocation = new Invocation(clientStub);
        const messageStub = sandbox.stub(ClientMessage.prototype);
        invocation.pendingResponseMessage = messageStub;
        invocation.backupsAcksReceived = 0;
        invocation.backupsAcksExpected = 1;

        invocation.pendingResponseReceivedMillis = 40;
        sandbox.useFakeTimers(42); // 40 + 1 < 42

        const completeStub = sandbox.stub(invocation, 'complete');
        invocation.detectAndHandleBackupTimeout(1);

        expect(completeStub.withArgs(messageStub).calledOnce).to.be.true;
    });

    it('detectAndHandleBackupTimeout: should complete with error when prop is set', function () {
        serviceStub.shouldFailOnIndeterminateState = true;

        const invocation = new Invocation(clientStub);
        const messageStub = sandbox.stub(ClientMessage.prototype);
        invocation.pendingResponseMessage = messageStub;
        invocation.request = messageStub;
        invocation.backupsAcksReceived = 0;
        invocation.backupsAcksExpected = 1;

        invocation.pendingResponseReceivedMillis = 40;
        sandbox.useFakeTimers(42); // 40 + 1 < 42

        const completeWithErrorStub = sandbox.stub(invocation, 'completeWithError');
        invocation.detectAndHandleBackupTimeout(1);

        expect(completeWithErrorStub.calledOnce).to.be.true;
        expect(completeWithErrorStub.args[0][0]).to.be.instanceof(IndeterminateOperationStateError);
    });
});
