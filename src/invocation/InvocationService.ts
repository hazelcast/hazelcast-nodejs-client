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
/** @ignore *//** */

import {
    ClientNotActiveError,
    HazelcastInstanceNotActiveError,
    OperationTimeoutError,
    IndeterminateOperationStateError,
    IOError,
    RetryableHazelcastError,
    TargetDisconnectedError,
    TargetNotMemberError,
    UUID,
    SchemaNotFoundError
} from '../core';
import {Connection} from '../network/Connection';
import {ILogger} from '../logging/ILogger';
import {ClientMessage, IS_BACKUP_AWARE_FLAG} from '../protocol/ClientMessage';
import {ListenerMessageCodec} from '../listener/ListenerMessageCodec';
import {ClientLocalBackupListenerCodec} from '../codec/ClientLocalBackupListenerCodec';
import {EXCEPTION_MESSAGE_TYPE} from '../codec/builtin/ErrorsCodec';
import {PartitionServiceImpl} from '../PartitionService';
import {
    scheduleWithRepetition,
    cancelRepetitionTask,
    Task,
    deferredPromise,
    DeferredPromise
} from '../util/Util';
import {ClientConfig} from '../config';
import {ListenerService} from '../listener/ListenerService';
import {ClientErrorFactory} from '../protocol/ErrorFactory';
import {LifecycleService} from '../LifecycleService';
import {ConnectionRegistry} from '../network/ConnectionRegistry';
import * as Long from 'long';
import {SchemaService} from '../serialization/compact/SchemaService';

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
    connection: Connection;

    /**
     * Connection on which the request was written. May be different from `connection`.
     */
    sendConnection: Connection;

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
    eventHandler: (...args: any[]) => any;

    /**
     * Handler is responsible for handling the client message and return the object user expects.
     */
    handler: (clientMessage: ClientMessage) => any = x => x;

    /**
     * True if this invocation is urgent (can be invoked even in the client is in the disconnected state), false otherwise.
     */
    urgent = false;

    constructor(invocationService: InvocationService, request: ClientMessage, timeoutMillis?: number) {
        this.invocationService = invocationService;
        this.deadline = timeoutMillis === undefined
            ? Date.now() + this.invocationService.invocationTimeoutMillis
            : Date.now() + timeoutMillis;
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

    fetchSchema(schemaId: Long, invocation: Invocation, clientMessage: ClientMessage): void {
        this.invocationService.schemaService.fetchSchema(schemaId).then(() => {
            // Reset nextFrame since we tried to parse the message once.
            clientMessage.resetNextFrame();
            invocation.complete(clientMessage);
        }).catch(err => {
            invocation.completeWithError(err);
        });
    }

    complete(clientMessage: ClientMessage): void {
        try {
            const result = this.handler(clientMessage);
            this.deferred.resolve(result);
            this.invocationService.deregisterInvocation(this.request.getCorrelationId());
        } catch (e) {
            if (e instanceof SchemaNotFoundError) {
                // We need to fetch the schema to deserialize compact.
                this.invocationService.logger.trace(
                    'SchemaService', `Could not find schema id ${e.schemaId} locally, will search on the cluster`
                );
                this.fetchSchema(e.schemaId, this, clientMessage);
            } else {
                this.completeWithError(e);
            }
        }
    }

    completeWithError(err: Error): void {
        this.deferred.reject(err);
        this.invocationService.deregisterInvocation(this.request.getCorrelationId());
    }
}

const backupListenerCodec: ListenerMessageCodec = {
    encodeAddRequest(_localOnly: boolean): ClientMessage {
        return ClientLocalBackupListenerCodec.encodeRequest();
    },

    decodeAddResponse(msg: ClientMessage): UUID {
        return ClientLocalBackupListenerCodec.decodeResponse(msg);
    },

    encodeRemoveRequest(_listenerId: UUID): ClientMessage {
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
    readonly invocationRetryPauseMillis: number;
    readonly invocationTimeoutMillis: number;
    readonly shouldFailOnIndeterminateState: boolean;
    private readonly operationBackupTimeoutMillis: number;
    private readonly backupAckToClientEnabled: boolean;
    private readonly cleanResourcesMillis: number;
    private readonly redoOperation: boolean;
    private correlationCounter = 1;
    private cleanResourcesTask: Task;
    private isShutdown: boolean;

    constructor(
        clientConfig: ClientConfig,
        readonly logger: ILogger,
        private readonly partitionService: PartitionServiceImpl,
        private readonly errorFactory: ClientErrorFactory,
        private readonly lifecycleService: LifecycleService,
        private readonly connectionRegistry: ConnectionRegistry,
        readonly schemaService: SchemaService
    ) {
        if (clientConfig.network.smartRouting) {
            this.doInvoke = this.invokeSmart;
        } else {
            this.doInvoke = this.invokeNonSmart;
        }
        this.invocationRetryPauseMillis =
            clientConfig.properties[PROPERTY_INVOCATION_RETRY_PAUSE_MILLIS] as number;
        this.invocationTimeoutMillis =
            clientConfig.properties[PROPERTY_INVOCATION_TIMEOUT_MILLIS] as number;
        this.operationBackupTimeoutMillis =
            clientConfig.properties[PROPERTY_BACKUP_TIMEOUT_MILLIS] as number;
        this.shouldFailOnIndeterminateState =
            clientConfig.properties[PROPERTY_FAIL_ON_INDETERMINATE_STATE] as boolean;
        this.cleanResourcesMillis =
            clientConfig.properties[PROPERTY_CLEAN_RESOURCES_MILLIS] as number;
        this.redoOperation = clientConfig.network.redoOperation;
        this.backupAckToClientEnabled = clientConfig.network.smartRouting && clientConfig.backupAckToClientEnabled;
        this.isShutdown = false;
    }

    start(listenerService: ListenerService): Promise<void> {
        this.cleanResourcesTask = this.scheduleCleanResourcesTask(this.cleanResourcesMillis);
        if (this.backupAckToClientEnabled) {
            return listenerService.registerListener(
                    backupListenerCodec,
                    this.backupEventHandler.bind(this)
                ).then(() => {});
        }
        return Promise.resolve();
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

    invoke(invocation: Invocation): Promise<any> {
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
     * @param handler Handler is responsible for handling the client message and return the object user expects.
     * @param eventHandler called with values returned from server for this invocation.
     * @returns a promise that resolves to {@link ClientMessage}
     */
    invokeOnConnection<V>(
        connection: Connection,
        request: ClientMessage,
        handler: (clientMessage: ClientMessage) => V,
        eventHandler?: (...args: any[]) => any
    ): Promise<V> {
        const invocation = new Invocation(this, request);
        invocation.connection = connection;
        invocation.handler = handler;
        if (eventHandler) {
            invocation.eventHandler = eventHandler;
        }
        return this.invoke(invocation);
    }

    /**
     * Invokes given invocation on the node that owns given partition.
     * Optionally overrides invocation timeout.
     */
    invokeOnPartition<V>(request: ClientMessage,
                      partitionId: number,
                      handler: (clientMessage: ClientMessage) => V,
                      timeoutMillis?: number): Promise<V> {
        const invocation = new Invocation(this, request, timeoutMillis);
        invocation.partitionId = partitionId;
        invocation.handler = handler;
        return this.invoke(invocation);
    }

    /**
     * Invokes given invocation on the host with given UUID.
     */
    invokeOnTarget<V>(request: ClientMessage, target: UUID, handler: (clientMessage: ClientMessage) => V): Promise<V> {
        const invocation = new Invocation(this, request);
        invocation.uuid = target;
        invocation.handler = handler;
        return this.invoke(invocation);
    }

    /**
     * Invokes given invocation on any host.
     * Useful when an operation is not bound to any host but a generic operation.
     */
    invokeOnRandomTarget<V>(request: ClientMessage, handler: (clientMessage: ClientMessage) => V): Promise<V> {
        const invocation = new Invocation(this, request);
        invocation.handler = handler;
        return this.invoke(invocation);
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
                this.logger.trace('InvocationService', 'Invocation not found for backup event, invocation id '
                    + correlationId);
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
                    eventHandler.eventHandler(clientMessage);
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
            const remoteError = this.errorFactory.createErrorFromClientMessage(clientMessage);
            this.notifyError(pendingInvocation, remoteError);
        } else {
            pendingInvocation.notify(clientMessage);
        }
    }

    private invokeSmart(invocation: Invocation): void {
        invocation.invokeCount++;
        if (!invocation.urgent) {
            const error = this.connectionRegistry.checkIfInvocationAllowed();
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
            const error = this.connectionRegistry.checkIfInvocationAllowed();
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
        const connection = this.connectionRegistry.getRandomConnection();
        if (connection == null) {
            return Promise.reject(new IOError('No connection found to invoke'));
        }
        return this.send(invocation, connection);
    }

    private invokeOnUuid(invocation: Invocation, target: UUID): Promise<void> {
        const connection = this.connectionRegistry.getConnection(target);
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

    private send(invocation: Invocation, connection: Connection): Promise<void> {
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
        if (!this.lifecycleService.isRunning()) {
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
        if (invocation.hasOwnProperty('eventHandler')) {
            this.eventHandlers.set(correlationId, invocation);
        }
        this.pending.set(correlationId, invocation);
    }

    deregisterInvocation(correlationId: number): void {
        this.pending.delete(correlationId);
    }
}
