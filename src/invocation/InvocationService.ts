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
import * as Promise from 'bluebird';
import HazelcastClient from '../HazelcastClient';
import {
    ClientNotActiveError,
    HazelcastInstanceNotActiveError,
    InvocationTimeoutError,
    IOError,
    RetryableHazelcastError,
    TargetDisconnectedError,
    TargetNotMemberError,
} from '../HazelcastError';
import {ClientConnection} from '../network/ClientConnection';
import {DeferredPromise} from '../Util';
import {ILogger} from '../logging/ILogger';
import {ClientMessage} from '../ClientMessage';
import {EXCEPTION_MESSAGE_TYPE} from '../codec/builtin/ErrorsCodec';
import {ClientConnectionManager} from '../network/ClientConnectionManager';
import {UUID} from '../core/UUID';
import {PartitionServiceImpl} from '../PartitionService';

const MAX_FAST_INVOCATION_COUNT = 5;
const PROPERTY_INVOCATION_RETRY_PAUSE_MILLIS = 'hazelcast.client.invocation.retry.pause.millis';
const PROPERTY_INVOCATION_TIMEOUT_MILLIS = 'hazelcast.client.invocation.timeout.millis';

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
     * Promise managing object.
     */
    deferred: Promise.Resolver<ClientMessage>;

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
        this.deadline = Date.now() + this.invocationService.getInvocationTimeoutMillis();
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
            return this.request.isRetryable();
        }

        return false;
    }
}

/**
 * Sends requests to appropriate nodes. Resolves waiting promises with responses.
 * @internal
 */
export class InvocationService {

    doInvoke: (invocation: Invocation) => void;
    private correlationCounter = 1;
    private eventHandlers: { [id: number]: Invocation } = {};
    private pending: { [id: number]: Invocation } = {};
    private client: HazelcastClient;
    private readonly invocationRetryPauseMillis: number;
    private readonly invocationTimeoutMillis: number;
    private logger: ILogger;
    private isShutdown: boolean;
    private connectionManager: ClientConnectionManager;
    private partitionService: PartitionServiceImpl;

    constructor(hazelcastClient: HazelcastClient) {
        this.client = hazelcastClient;
        this.connectionManager = hazelcastClient.getConnectionManager();
        this.partitionService = hazelcastClient.getPartitionService() as PartitionServiceImpl;
        this.logger = this.client.getLoggingService().getLogger();
        if (hazelcastClient.getConfig().network.smartRouting) {
            this.doInvoke = this.invokeSmart;
        } else {
            this.doInvoke = this.invokeNonSmart;
        }
        this.invocationRetryPauseMillis =
            this.client.getConfig().properties[PROPERTY_INVOCATION_RETRY_PAUSE_MILLIS] as number;
        this.invocationTimeoutMillis =
            this.client.getConfig().properties[PROPERTY_INVOCATION_TIMEOUT_MILLIS] as number;
        this.isShutdown = false;
    }

    shutdown(): void {
        this.isShutdown = true;
    }

    invoke(invocation: Invocation): Promise<ClientMessage> {
        invocation.deferred = DeferredPromise<ClientMessage>();
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

    getInvocationTimeoutMillis(): number {
        return this.invocationTimeoutMillis;
    }

    getInvocationRetryPauseMillis(): number {
        return this.invocationRetryPauseMillis;
    }

    /**
     * Removes the handler for all event handlers with a specific correlation id.
     * @param id correlation id
     */
    removeEventHandler(id: number): void {
        if (this.eventHandlers.hasOwnProperty('' + id)) {
            delete this.eventHandlers[id];
        }
    }

    /**
     * Extract codec specific properties in a protocol message and resolves waiting promise.
     * @param clientMessage
     */
    processResponse(clientMessage: ClientMessage): void {
        const correlationId = clientMessage.getCorrelationId();
        const messageType = clientMessage.getMessageType();

        if (clientMessage.startFrame.hasEventFlag()) {
            setImmediate(() => {
                if (this.eventHandlers[correlationId] !== undefined) {
                    this.eventHandlers[correlationId].handler(clientMessage);
                }
            });
            return;
        }

        const pendingInvocation = this.pending[correlationId];
        const deferred = pendingInvocation.deferred;
        if (messageType === EXCEPTION_MESSAGE_TYPE) {
            const remoteError = this.client.getErrorFactory().createErrorFromClientMessage(clientMessage);
            this.notifyError(pendingInvocation, remoteError);
        } else {
            delete this.pending[correlationId];
            deferred.resolve(clientMessage);
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
            return Promise.reject(new ClientNotActiveError('Client is shutdown.'));
        }
        this.registerInvocation(invocation);
        return this.write(invocation, connection);
    }

    private write(invocation: Invocation, connection: ClientConnection): Promise<void> {
        return connection.write(invocation.request.toBuffer());
    }

    private notifyError(invocation: Invocation, error: Error): void {
        const correlationId = invocation.request.getCorrelationId();
        if (this.rejectIfNotRetryable(invocation, error)) {
            delete this.pending[correlationId];
            return;
        }
        this.logger.debug('InvocationService',
            'Retrying(' + invocation.invokeCount + ') on correlation-id=' + correlationId, error);
        if (invocation.invokeCount < MAX_FAST_INVOCATION_COUNT) {
            this.doInvoke(invocation);
        } else {
            setTimeout(this.doInvoke.bind(this, invocation), this.getInvocationRetryPauseMillis());
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
            invocation.deferred.reject(new InvocationTimeoutError('Invocation '
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
            this.eventHandlers[correlationId] = invocation;
        }
        this.pending[correlationId] = invocation;
    }
}
