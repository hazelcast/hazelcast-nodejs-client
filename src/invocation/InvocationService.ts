/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
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

import ClientMessage = require('../ClientMessage');
import * as Long from 'long';
import Address = require('../Address');
import ExceptionCodec = require('../codec/ExceptionCodec');
import * as Promise from 'bluebird';
import {BitsUtil} from '../BitsUtil';
import {LoggingService} from '../logging/LoggingService';
import HazelcastClient from '../HazelcastClient';
import {ClientConnection} from './ClientConnection';
import {IllegalStateError, ClientNotActiveError} from '../HazelcastError';
import * as assert from 'assert';

var EXCEPTION_MESSAGE_TYPE = 109;
const MAX_FAST_INVOCATION_COUNT = 5;
const PROPERTY_INVOCATION_RETRY_PAUSE_MILLIS = 'hazelcast.client.invocation.retry.pause.millis';
const PROPERTY_INVOCATION_TIMEOUT_MILLIS = 'hazelcast.client.invocation.timeout.millis';

/**
 * A request to be sent to a hazelcast node.
 */
export class Invocation {

    constructor(client: HazelcastClient, request: ClientMessage) {
        this.client = client;
        this.invocationService = client.getInvocationService();
        this.deadline = new Date(new Date().getTime() + this.invocationService.getInvocationTimeoutMillis());
        this.request = request;
    }

    client: HazelcastClient;

    invocationService: InvocationService;

    /**
     * Representatiton of the request in binary form.
     */
    request: ClientMessage;
    /**
     * Partition id of the request. If request is not bound to a specific partition, should be set to -1.
     */
    partitionId: number;
    /**
     * Address of the request. If request is not bound to any specific address, should be set to null.
     */
    address: Address;
    /**
     * Deadline of validity. Client will not try to send this request to server after the deadline passes.
     */
    deadline: Date;
    /**
     * Connection of the request. If request is not bound to any specific address, should be set to null.
     */
    connection: ClientConnection;

    /**
     * Promise managing object.
     */
    deferred: Promise.Resolver<ClientMessage>;

    invokeCount: number = 0;

    /**
     * If this is an event listener registration, handler should be set to the function to be called on events.
     * Otherwise, should be set to null.
     */
    handler: (...args: any[]) => any;

    /**
     * @returns {boolean}
     */
    hasPartitionId(): boolean {
        return this.hasOwnProperty('partitionId') && this.partitionId >= 0;
    }
}

/**
 * Sends requests to appropriate nodes. Resolves waiting promises with responses.
 */
export class InvocationService {
    private correlationCounter = 1;
    private eventHandlers: {[id: number]: Invocation} = {};
    private pending: {[id: number]: Invocation} = {};
    private client: HazelcastClient;
    private smartRoutingEnabled: boolean;
    private readonly invocationRetryPauseMillis: number;
    private readonly invocationTimeoutMillis: number;
    private logger = LoggingService.getLoggingService();
    private isShutdown: boolean;

    doInvoke: (invocation: Invocation) => void;

    constructor(hazelcastClient: HazelcastClient) {
        this.client = hazelcastClient;
        this.smartRoutingEnabled = hazelcastClient.getConfig().networkConfig.smartRouting;
        if (hazelcastClient.getConfig().networkConfig.smartRouting) {
            this.doInvoke = this.invokeSmart;
        } else {
            this.doInvoke = this.invokeNonSmart;
        }
        this.invocationRetryPauseMillis = this.client.getConfig().properties[PROPERTY_INVOCATION_RETRY_PAUSE_MILLIS];
        this.invocationTimeoutMillis = this.client.getConfig().properties[PROPERTY_INVOCATION_TIMEOUT_MILLIS];
        this.isShutdown = false;
    }

    shutdown(): void {
        this.isShutdown = true;
    }

    invoke(invocation: Invocation): Promise<ClientMessage> {
        var newCorrelationId = Long.fromNumber(this.correlationCounter++);
        invocation.deferred = Promise.defer<ClientMessage>();
        invocation.request.setCorrelationId(newCorrelationId);
        this.doInvoke(invocation);
        return invocation.deferred.promise;
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
        var invocation = new Invocation(this.client, request);
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
        var invocation = new Invocation(this.client, request);
        invocation.partitionId = partitionId;
        return this.invoke(invocation);
    }

    /**
     * Invokes given invocation on the host with given address.
     * @param request
     * @param target
     * @returns
     */
    invokeOnTarget(request: ClientMessage, target: Address): Promise<ClientMessage> {
        var invocation = new Invocation(this.client, request);
        invocation.address = target;
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

    private invokeSmart(invocation: Invocation): void {
        let invocationPromise: Promise<void>;
        invocation.invokeCount++;
        if (invocation.hasOwnProperty('connection')) {
            invocationPromise = this.send(invocation, invocation.connection);
        } else if (invocation.hasPartitionId()) {
            invocationPromise = this.invokeOnPartitionOwner(invocation, invocation.partitionId);
        } else if (invocation.hasOwnProperty('address')) {
            invocationPromise = this.invokeOnAddress(invocation, invocation.address);
        } else {
            invocationPromise = this.invokeOnOwner(invocation);
        }
        invocationPromise.catch((err) => {
            this.notifyError(invocation, err);
        });
    }

    private invokeNonSmart(invocation: Invocation): void {
        let invocationPromise: Promise<void>;
        invocation.invokeCount++;
        if (invocation.hasOwnProperty('connection')) {
            invocationPromise = this.send(invocation, invocation.connection);
        } else {
            invocationPromise = this.invokeOnOwner(invocation);
        }
        invocationPromise.catch((err) => {
            this.notifyError(invocation, err);
        });
    }

    private invokeOnOwner(invocation: Invocation): Promise<void> {
        let owner = this.client.getClusterService().getOwnerConnection();
        if (owner == null) {
            return Promise.reject(new IllegalStateError('Unisocket client\'s owner connection is not available.'));
        }
        return this.send(invocation, owner);
    }

    private invokeOnAddress(invocation: Invocation, address: Address): Promise<void> {
        return this.client.getConnectionManager().getOrConnect(address).then((connection: ClientConnection) => {
            if (connection == null) {
                throw new Error(address.toString() + ' is not available.');
            }
            return this.send(invocation, connection);
        });
    }

    private invokeOnPartitionOwner(invocation: Invocation, partitionId: number): Promise<void> {
        var ownerAddress = this.client.getPartitionService().getAddressForPartition(partitionId);
        return this.client.getConnectionManager().getOrConnect(ownerAddress).then((connection: ClientConnection) => {
            if (connection == null) {
                throw new Error(ownerAddress.toString() + '(partition owner) is not available.');
            }
            return this.send(invocation, connection);
        });
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
        return connection.write(invocation.request.getBuffer());
    }

    private notifyError(invocation: Invocation, error: Error): void {
        var correlationId = invocation.request.getCorrelationId().toNumber();
        if (this.isRetryable(invocation)) {
            this.logger.debug('InvocationService',
                'Retrying(' + invocation.invokeCount + ') on correlation-id=' + correlationId, error);
            if (invocation.invokeCount < MAX_FAST_INVOCATION_COUNT) {
                this.doInvoke(invocation);
            } else {
                setTimeout(this.doInvoke.bind(this, invocation), this.getInvocationRetryPauseMillis());
            }
        } else {
            this.logger.warn('InvocationService', 'Sending message ' + correlationId + ' failed');
            delete this.pending[invocation.request.getCorrelationId().toNumber()];
            invocation.deferred.reject(error);
        }
    }

    private isRetryable(invocation: Invocation) {
        if (invocation.connection != null || invocation.address != null) {
            return false;
        }
        if (invocation.deadline.getTime() < Date.now()) {
            this.logger.debug('InvocationService', 'Invocation ' + invocation.request.getCorrelationId() + ')' +
                ' reached its deadline.');
            return false;
        }
        return true;
    }

    private registerInvocation(invocation: Invocation) {
        var message = invocation.request;
        var correlationId = message.getCorrelationId().toNumber();
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
     * @param buffer
     */
    processResponse(buffer: Buffer): void {
        var clientMessage = new ClientMessage(buffer);
        var correlationId = clientMessage.getCorrelationId().toNumber();
        var messageType = clientMessage.getMessageType();

        if (clientMessage.hasFlags(BitsUtil.LISTENER_FLAG)) {
            setImmediate(() => {
                if (this.eventHandlers[correlationId] !== undefined) {
                    this.eventHandlers[correlationId].handler(clientMessage);
                }
            });
            return;
        }

        var invocationFinished = true;
        var pendingInvocation = this.pending[correlationId];
        var deferred = pendingInvocation.deferred;
        if (messageType === EXCEPTION_MESSAGE_TYPE) {
            var remoteException = ExceptionCodec.decodeResponse(clientMessage);
            var boundToConnection = pendingInvocation.connection;
            var deadlineExceeded = new Date().getTime() > pendingInvocation.deadline.getTime();
            var shouldRetry = !boundToConnection && !deadlineExceeded && remoteException.isRetryable();

            if (shouldRetry) {
                invocationFinished = false;
                setTimeout(() => {
                    this.invoke(pendingInvocation);
                }, this.getInvocationRetryPauseMillis());
            } else {
                this.logger.trace('InvocationService', 'Received exception as response', remoteException);
                deferred.reject(remoteException);
            }
        } else {
            deferred.resolve(clientMessage);
        }

        if (invocationFinished) {
            delete this.pending[correlationId];
        }
    }
}
