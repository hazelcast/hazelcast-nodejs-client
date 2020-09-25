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
/** @ignore *//** */

import * as assert from 'assert';
import {HazelcastClient} from '../HazelcastClient';
import {
    ClientNotActiveError,
    HazelcastInstanceNotActiveError,
    OperationTimeoutError,
    IndeterminateOperationStateError,
    IOError,
    RetryableHazelcastError,
    TargetDisconnectedError,
    TargetNotMemberError,
    UUID
} from '../core';
import {ClientConnection} from '../network/ClientConnection';
import {ILogger} from '../logging/ILogger';
import {ClientMessage, IS_BACKUP_AWARE_FLAG} from '../protocol/ClientMessage';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {ClientLocalBackupListenerCodec} from '../codec/ClientLocalBackupListenerCodec';
import {EXCEPTION_MESSAGE_TYPE} from '../codec/builtin/ErrorsCodec';
import {ClientConnectionManager} from '../network/ClientConnectionManager';
import {PartitionServiceImpl} from '../PartitionService';
import {
    scheduleWithRepetition,
    cancelRepetitionTask,
    Task,
    deferredPromise,
    DeferredPromise
} from '../util/Util';

const MAX_FAST_INVOCATION_COUNT = 5;
const PROPERTY_INVOCATION_RETRY_PAUSE_MILLIS = 'hazelcast.client.invocation.retry.pause.millis';
const PROPERTY_INVOCATION_TIMEOUT_MILLIS = 'hazelcast.client.invocation.timeout.millis';
const PROPERTY_CLEAN_RESOURCES_MILLIS = 'hazelcast.client.internal.clean.resources.millis';
const PROPERTY_BACKUP_TIMEOUT_MILLIS = 'hazelcast.client.operation.backup.timeout.millis';
const PROPERTY_FAIL_ON_INDETERMINATE_STATE = 'hazelcast.client.operation.fail.on.indeterminate.state';

/**
 * A request to be sent to a hazelcast node.
 * @internal
 */
export class Invocation {

    client: HazelcastClient;

    invocationService: InvocationService;

    /**
     * Representation of the request in binary form.
     */
    request: ClientMessage;

    /**
     * Partition id of the request. If request is not bound to a specific partition, should be set to -1.
     */
    partitionId: number;

    /**
     * UUID of the request. If request is not bound to any specific UUID, should be set to null.
     */
    uuid: UUID;

    /**
     * Deadline of validity. Client will not try to send this request to server after the deadline passes.
     */
    deadline: number;

    /**
     * Connection of the request. If request is not bound to any specific address, should be set to null.
     */
    connection: ClientConnection;

    /**
     * Connection on which the request was written. May be different from `connection`.
     */
    sendConnection: ClientConnection;

    /**
     * Promise managing object.
     */
    deferred: DeferredPromise<ClientMessage>;

    /**
     * Contains the pending response from the primary. It is pending because it could be that backups need to complete.
     */
    pendingResponseMessage: ClientMessage;

    /**
     * Number of backups acks received.
     */
    backupsAcksReceived = 0;

    /**
     * Number of expected backups. It is set correctly as soon as the pending response is set.
     */
    backupsAcksExpected = -1;

    /**
     * The time in millis when the response of the primary has been received.
     */
    pendingResponseReceivedMillis = -1;

    invokeCount = 0;

    /**
     * If this is an event listener registration, handler should be set to the function to be called on events.
     * Otherwise, should be set to null.
     */
    handler: (...args: any[]) => any;

    /**
     * True if this invocation is urgent (can be invoked even in the client is in the disconnected state), false otherwise.
     */
    urgent = false;

    constructor(client: HazelcastClient, request: ClientMessage) {
        this.client = client;
        this.invocationService = client.getInvocationService();
        this.deadline = Date.now() + this.invocationService.invocationTimeoutMillis;
        this.request = request;
    }

    /**
     * @returns {boolean}
     */
    hasPartitionId(): boolean {
        return this.hasOwnProperty('partitionId') && this.partitionId >= 0;
    }

    shouldRetry(err: Error): boolean {
        if (this.connection != null
                && (err instanceof IOError || err instanceof TargetDisconnectedError)) {
            return false;
        }

        if (this.uuid != null && err instanceof TargetNotMemberError) {
            // when invocation is sent to a specific member
            // and target is no longer a member, we should not retry
            // note that this exception could come from the server
            return false;
        }

        if (err instanceof IOError
                || err instanceof HazelcastInstanceNotActiveError
                || err instanceof RetryableHazelcastError) {
            return true;
        }

        if (err instanceof TargetDisconnectedError) {
            return this.request.isRetryable() || this.invocationService.redoOperationEnabled();
        }

        return false;
    }

    notify(clientMessage: ClientMessage): void {
        assert(clientMessage != null, 'Response can not be null');
        const expectedBackups = clientMessage.getNumberOfBackupAcks();
        if (expectedBackups > this.backupsAcksReceived) {
            this.pendingResponseReceivedMillis = Date.now();
            this.backupsAcksExpected = expectedBackups;
            this.pendingResponseMessage = clientMessage;
            return;
        }
        this.complete(clientMessage);
    }

    notifyBackupComplete(): void {
        this.backupsAcksReceived++;
        if (this.pendingResponseMessage == null) {
            return;
        }
        if (this.backupsAcksExpected !== this.backupsAcksReceived) {
            return;
        }
        this.complete(this.pendingResponseMessage);
    }

    detectAndHandleBackupTimeout(timeoutMillis: number): void {
        if (this.pendingResponseMessage == null) {
            return;
        }
        if (this.backupsAcksExpected === this.backupsAcksReceived) {
            return;
        }
        const expirationTime = this.pendingResponseReceivedMillis + timeoutMillis;
        const timeoutReached = expirationTime > 0 && expirationTime < Date.now();
        if (!timeoutReached) {
            return;
        }
        if (this.invocationService.shouldFailOnIndeterminateState) {
            this.completeWithError(new IndeterminateOperationStateError('Invocation '
                + this.request.getCorrelationId() + ' failed because of missed backup acks'));
            return;
        }
        this.complete(this.pendingResponseMessage);
    }

    complete(clientMessage: ClientMessage): void {
        this.deferred.resolve(clientMessage);
        this.invocationService.deregisterInvocation(this.request.getCorrelationId());
    }

    completeWithError(err: Error): void {
        this.deferred.reject(err);
        this.invocationService.deregisterInvocation(this.request.getCorrelationId());
    }
}

const backupListenerCodec: ListenerMessageCodec = {
    encodeAddRequest(localOnly: boolean): ClientMessage {
        return ClientLocalBackupListenerCodec.encodeRequest();
    },

    decodeAddResponse(msg: ClientMessage): UUID {
        return ClientLocalBackupListenerCodec.decodeResponse(msg);
    },

    encodeRemoveRequest(listenerId: UUID): ClientMessage {
        return null;
    }
}

/**
 * Sends requests to appropriate nodes. Resolves waiting promises with responses.
 * @internal
 */
export class InvocationService {

    private readonly doInvoke: (invocation: Invocation) => void;
    private readonly eventHandlers: Map<number, Invocation> = new Map();
    private readonly pending: Map<number, Invocation> = new Map();
    private readonly client: HazelcastClient;
    readonly invocationRetryPauseMillis: number;
    readonly invocationTimeoutMillis: number;
    readonly shouldFailOnIndeterminateState: boolean;
    private readonly operationBackupTimeoutMillis: number;
    private readonly backupAckToClientEnabled: boolean;
    private readonly logger: ILogger;
    private readonly connectionManager: ClientConnectionManager;
    private readonly partitionService: PartitionServiceImpl;
    private readonly cleanResourcesMillis: number;
    private readonly redoOperation: boolean;
    private correlationCounter = 1;
    private cleanResourcesTask: Task;
    private isShutdown: boolean;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.connectionManager = client.getConnectionManager();
        this.partitionService = client.getPartitionService() as PartitionServiceImpl;
        this.logger = this.client.getLoggingService().getLogger();
        const config = client.getConfig();
        if (config.network.smartRouting) {
            this.doInvoke = this.invokeSmart;
        } else {
            this.doInvoke = this.invokeNonSmart;
        }
        this.invocationRetryPauseMillis =
            config.properties[PROPERTY_INVOCATION_RETRY_PAUSE_MILLIS] as number;
        this.invocationTimeoutMillis =
            config.properties[PROPERTY_INVOCATION_TIMEOUT_MILLIS] as number;
        this.operationBackupTimeoutMillis =
            config.properties[PROPERTY_BACKUP_TIMEOUT_MILLIS] as number;
        this.shouldFailOnIndeterminateState =
            config.properties[PROPERTY_FAIL_ON_INDETERMINATE_STATE] as boolean;
        this.cleanResourcesMillis =
            config.properties[PROPERTY_CLEAN_RESOURCES_MILLIS] as number;
        this.redoOperation = config.network.redoOperation;
        this.backupAckToClientEnabled = config.network.smartRouting && config.backupAckToClientEnabled;
        this.isShutdown = false;
    }

    start(): void {
        if (this.backupAckToClientEnabled) {
            const listenerService = this.client.getListenerService();
            listenerService.registerListener(backupListenerCodec, this.backupEventHandler.bind(this));
        }
        this.cleanResourcesTask = this.scheduleCleanResourcesTask(this.cleanResourcesMillis);
    }

    private scheduleCleanResourcesTask(periodMillis: number): Task {
        return scheduleWithRepetition(() => {
            for (const invocation of this.pending.values()) {
                const connection = invocation.sendConnection;
                if (connection === undefined) {
                    continue;
                }
                if (!connection.isAlive()) {
                    this.notifyError(invocation, new TargetDisconnectedError(connection.getClosedReason()));
                    continue;
                }
                if (this.backupAckToClientEnabled) {
                    invocation.detectAndHandleBackupTimeout(this.operationBackupTimeoutMillis);
                }
            }
        }, periodMillis, periodMillis);
    }

    shutdown(): void {
        if (this.isShutdown) {
            return;
        }
        this.isShutdown = true;
        if (this.cleanResourcesTask !== undefined) {
            cancelRepetitionTask(this.cleanResourcesTask);
        }
        for (const invocation of this.pending.values()) {
            this.notifyError(invocation, new ClientNotActiveError('Client is shutting down.'));
        }
    }

    redoOperationEnabled() {
        return this.redoOperation;
    }

    invoke(invocation: Invocation): Promise<ClientMessage> {
        invocation.deferred = deferredPromise<ClientMessage>();
        const newCorrelationId = this.correlationCounter++;
        invocation.request.setCorrelationId(newCorrelationId);
        this.doInvoke(invocation);
        return invocation.deferred.promise;
    }

    invokeUrgent(invocation: Invocation): Promise<ClientMessage> {
        invocation.urgent = true;
        return this.invoke(invocation);
    }

    /**
     * Invokes given invocation on specified connection.
     * @param connection
     * @param request
     * @param handler called with values returned from server for this invocation.
     * @returns
     */
    invokeOnConnection(connection: ClientConnection, request: ClientMessage,
                       handler?: (...args: any[]) => any): Promise<ClientMessage> {
        const invocation = new Invocation(this.client, request);
        invocation.connection = connection;
        if (handler) {
            invocation.handler = handler;
        }
        return this.invoke(invocation);
    }

    /**
     * Invokes given invocation on the node that owns given partition.
     * @param request
     * @param partitionId
     * @returns
     */
    invokeOnPartition(request: ClientMessage, partitionId: number): Promise<ClientMessage> {
        const invocation = new Invocation(this.client, request);
        invocation.partitionId = partitionId;
        return this.invoke(invocation);
    }

    /**
     * Invokes given invocation on the host with given UUID.
     * @param request
     * @param target
     * @returns
     */
    invokeOnTarget(request: ClientMessage, target: UUID): Promise<ClientMessage> {
        const invocation = new Invocation(this.client, request);
        invocation.uuid = target;
        return this.invoke(invocation);
    }

    /**
     * Invokes given invocation on any host.
     * Useful when an operation is not bound to any host but a generic operation.
     * @param request
     * @returns
     */
    invokeOnRandomTarget(request: ClientMessage): Promise<ClientMessage> {
        return this.invoke(new Invocation(this.client, request));
    }

    /**
     * Removes the handler for all event handlers with a specific correlation id.
     */
    removeEventHandler(correlationId: number): void {
        this.eventHandlers.delete(correlationId);
    }

    backupEventHandler(clientMessage: ClientMessage): void {
        ClientLocalBackupListenerCodec.handle(clientMessage, (correlationId: Long) => {
            const invocation = this.pending.get(correlationId.toNumber());
            if (invocation === undefined) {
                this.logger.trace('InvocationService', 'Invocation not found for backup event, '
                    + 'invocation id ' + correlationId);
                return;
            }
            invocation.notifyBackupComplete();
        });
    }

    /**
     * Extracts codec specific properties in a protocol message and resolves waiting promise.
     */
    processResponse(clientMessage: ClientMessage): void {
        const correlationId = clientMessage.getCorrelationId();

        if (clientMessage.startFrame.hasEventFlag() || clientMessage.startFrame.hasBackupEventFlag()) {
            process.nextTick(() => {
                const eventHandler = this.eventHandlers.get(correlationId);
                if (eventHandler !== undefined) {
                    eventHandler.handler(clientMessage);
                }
            });
            return;
        }

        const pendingInvocation = this.pending.get(correlationId);
        if (pendingInvocation === undefined) {
            if (!this.isShutdown) {
                this.logger.warn('InvocationService',
                    'Found no registration for invocation id ' + correlationId);
            }
            return;
        }
        const messageType = clientMessage.getMessageType();
        if (messageType === EXCEPTION_MESSAGE_TYPE) {
            const remoteError = this.client.getErrorFactory().createErrorFromClientMessage(clientMessage);
            this.notifyError(pendingInvocation, remoteError);
        } else {
            pendingInvocation.notify(clientMessage);
        }
    }

    private invokeSmart(invocation: Invocation): void {
        invocation.invokeCount++;
        if (!invocation.urgent) {
            const error = this.connectionManager.checkIfInvocationAllowed();
            if (error != null) {
                this.notifyError(invocation, error);
                return;
            }
        }

        let invocationPromise: Promise<void>;
        if (invocation.hasOwnProperty('connection')) {
            invocationPromise = this.send(invocation, invocation.connection);
            invocationPromise.catch((err) => {
                this.notifyError(invocation, err);
            });
            return;
        }

        if (invocation.hasPartitionId()) {
            invocationPromise = this.invokeOnPartitionOwner(invocation, invocation.partitionId);
        } else if (invocation.hasOwnProperty('uuid')) {
            invocationPromise = this.invokeOnUuid(invocation, invocation.uuid);
        } else {
            invocationPromise = this.invokeOnRandomConnection(invocation);
        }

        invocationPromise.catch(() => {
            return this.invokeOnRandomConnection(invocation);
        }).catch((err) => {
            this.notifyError(invocation, err);
        });
    }

    private invokeNonSmart(invocation: Invocation): void {
        invocation.invokeCount++;
        if (!invocation.urgent) {
            const error = this.connectionManager.checkIfInvocationAllowed();
            if (error != null) {
                this.notifyError(invocation, error);
                return;
            }
        }

        let invocationPromise: Promise<void>;
        if (invocation.hasOwnProperty('connection')) {
            invocationPromise = this.send(invocation, invocation.connection);
        } else {
            invocationPromise = this.invokeOnRandomConnection(invocation);
        }
        invocationPromise.catch((err) => {
            this.notifyError(invocation, err);
        });
    }

    private invokeOnRandomConnection(invocation: Invocation): Promise<void> {
        const connection = this.connectionManager.getRandomConnection();
        if (connection == null) {
            return Promise.reject(new IOError('No connection found to invoke'));
        }
        return this.send(invocation, connection);
    }

    private invokeOnUuid(invocation: Invocation, target: UUID): Promise<void> {
        const connection = this.connectionManager.getConnection(target);
        if (connection == null) {
            this.logger.trace('InvocationService', `Client is not connected to target: ${target}`);
            return Promise.reject(new IOError('No connection found to invoke'));
        }
        return this.send(invocation, connection);
    }

    private invokeOnPartitionOwner(invocation: Invocation, partitionId: number): Promise<void> {
        const partitionOwner = this.partitionService.getPartitionOwner(partitionId);
        if (partitionOwner == null) {
            this.logger.trace('InvocationService', 'Partition owner is not assigned yet');
            return Promise.reject(new IOError('No connection found to invoke'));
        }
        return this.invokeOnUuid(invocation, partitionOwner);
    }

    private send(invocation: Invocation, connection: ClientConnection): Promise<void> {
        assert(connection != null);
        if (this.isShutdown) {
            return Promise.reject(new ClientNotActiveError('Client is shutting down.'));
        }
        if (this.backupAckToClientEnabled) {
            invocation.request.getStartFrame().addFlag(IS_BACKUP_AWARE_FLAG);
        }
        this.registerInvocation(invocation);
        return connection.write(invocation.request)
            .then(() => {
                invocation.sendConnection = connection;
            });
    }

    private notifyError(invocation: Invocation, error: Error): void {
        const correlationId = invocation.request.getCorrelationId();
        if (this.rejectIfNotRetryable(invocation, error)) {
            this.pending.delete(correlationId);
            return;
        }
        this.logger.debug('InvocationService',
            'Retrying(' + invocation.invokeCount + ') on correlation-id=' + correlationId, error);
        if (invocation.invokeCount < MAX_FAST_INVOCATION_COUNT) {
            this.doInvoke(invocation);
        } else {
            setTimeout(this.doInvoke.bind(this, invocation), this.invocationRetryPauseMillis);
        }
    }

    /**
     * Determines if an error is retryable. The given invocation is rejected with
     * appropriate error if the error is not retryable.
     *
     * @param invocation
     * @param error
     * @returns `true` if invocation is rejected, `false` otherwise
     */
    private rejectIfNotRetryable(invocation: Invocation, error: Error): boolean {
        if (!this.client.getLifecycleService().isRunning()) {
            invocation.deferred.reject(new ClientNotActiveError('Client is shutting down.', error));
            return true;
        }

        if (!invocation.shouldRetry(error)) {
            invocation.deferred.reject(error);
            return true;
        }

        if (invocation.deadline < Date.now()) {
            this.logger.trace('InvocationService', 'Error will not be retried because invocation timed out');
            invocation.deferred.reject(new OperationTimeoutError('Invocation '
                + invocation.request.getCorrelationId() + ') reached its deadline.', error));
            return true;
        }
    }

    private registerInvocation(invocation: Invocation): void {
        const message = invocation.request;
        const correlationId = message.getCorrelationId();
        if (invocation.hasPartitionId()) {
            message.setPartitionId(invocation.partitionId);
        } else {
            message.setPartitionId(-1);
        }
        if (invocation.hasOwnProperty('handler')) {
            this.eventHandlers.set(correlationId, invocation);
        }
        this.pending.set(correlationId, invocation);
    }

    deregisterInvocation(correlationId: number): void {
        this.pending.delete(correlationId);
    }
}
