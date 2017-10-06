import ClientConnection = require('./ClientConnection');
import ClientMessage = require('../ClientMessage');
import Long = require('long');
import Address = require('../Address');
import ExceptionCodec = require('../codec/ExceptionCodec');
import * as Promise from 'bluebird';
import {BitsUtil} from '../BitsUtil';
import {LoggingService} from '../logging/LoggingService';
import {EventEmitter} from 'events';
import HazelcastClient from '../HazelcastClient';

var EXCEPTION_MESSAGE_TYPE = 109;
var INVOCATION_TIMEOUT = 120000;
var INVOCATION_RETRY_DELAY = 1000;
const MAX_FAST_INVOCATION_COUNT = 5;

/**
 * A request to be sent to a hazelcast node.
 */
export class Invocation {

    constructor(request: ClientMessage) {
        this.request = request;
    }

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
    deadline: Date = new Date(new Date().getTime() + INVOCATION_TIMEOUT);
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
    private invocationRetryPauseMillis: number;
    private logger = LoggingService.getLoggingService();

    doInvoke: (invocation: Invocation) => void;

    constructor(hazelcastClient: HazelcastClient) {
        this.client = hazelcastClient;
        this.smartRoutingEnabled = hazelcastClient.getConfig().networkConfig.smartRouting;
        if (hazelcastClient.getConfig().networkConfig.smartRouting) {
            this.doInvoke = this.invokeSmart;
        } else {
            this.doInvoke = this.invokeNonSmart;
        }
        this.invocationRetryPauseMillis = 1000;
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
        var invocation = new Invocation(request);
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
        var invocation = new Invocation(request);
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
        var invocation = new Invocation(request);
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
        return this.invoke(new Invocation(request));
    }

    private invokeSmart(invocation: Invocation): void {
        invocation.invokeCount++;
        if (invocation.hasOwnProperty('connection')) {
            this.send(invocation, invocation.connection);
        } else if (invocation.hasPartitionId()) {
            this.invokeOnPartitionOwner(invocation, invocation.partitionId);
        } else if (invocation.hasOwnProperty('address')) {
            this.invokeOnAddress(invocation, invocation.address);
        } else {
            this.send(invocation, this.client.getClusterService().getOwnerConnection());
        }
    }

    private invokeNonSmart(invocation: Invocation): void {
        invocation.invokeCount++;
        if (invocation.hasOwnProperty('connection')) {
            this.send(invocation, invocation.connection);
        } else {
            this.send(invocation, this.client.getClusterService().getOwnerConnection());
        }
    }

    private invokeOnAddress(invocation: Invocation, address: Address): void {
        this.client.getConnectionManager().getOrConnect(address).then((connection: ClientConnection) => {
            if (connection == null) {
                this.notifyError(invocation, new Error('No connection'));
                return;
            }
            this.send(invocation, connection);
        });
    }

    private invokeOnPartitionOwner(invocation: Invocation, partitionId: number): void {
        var ownerAddress = this.client.getPartitionService().getAddressForPartition(partitionId);
        this.client.getConnectionManager().getOrConnect(ownerAddress).then((connection: ClientConnection) => {
            if (connection == null) {
                this.notifyError(invocation, new Error('No connection'));
                return;
            }
            this.send(invocation, connection);
        });
    }

    private send(invocation: Invocation, connection: ClientConnection): void {
        this.registerInvocation(invocation);
        this.write(invocation, connection);
    }

    private write(invocation: Invocation, connection: ClientConnection): void {
        var logger = this.logger;
        connection.write(invocation.request.getBuffer(), (err: any) => {
            if (err) {
                this.notifyError(invocation, err);
            }
        });
    }

    private notifyError(invocation: Invocation, error: Error) {
        var correlationId = invocation.request.getCorrelationId().toNumber();
        if (this.isRetryable(invocation)) {
            this.logger.warn('InvocationService', 'Retrying(' + invocation.invokeCount + ') correlation-id=' + correlationId);
            if (invocation.invokeCount < MAX_FAST_INVOCATION_COUNT) {
                this.doInvoke(invocation);
            } else {
                setTimeout(this.doInvoke.bind(this, invocation), this.invocationRetryPauseMillis);
            }
        } else {
            this.logger.warn('InvocationService', 'Sending message ' + correlationId + 'failed');
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
                this.eventHandlers[correlationId].handler(clientMessage);
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
                }, INVOCATION_RETRY_DELAY);
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

/**
 * Handles registration and de-registration of cluster-wide events listeners.
 */
export class ListenerService {
    private client: HazelcastClient;
    private listenerIdToCorrelation: { [id: string]: Long} = {};
    private internalEventEmitter: EventEmitter;

    constructor(client: HazelcastClient) {
        this.client = client;
        this.internalEventEmitter = new EventEmitter();
        this.internalEventEmitter.setMaxListeners(0);
    }

    registerListener(request: ClientMessage, handler: any, decoder: any, key: any = undefined): Promise<string> {
        var deferred = Promise.defer<string>();
        var invocation = new Invocation(request);
        invocation.handler = handler;
        this.client.getInvocationService().invoke(invocation).then((responseMessage) => {
            var correlationId = responseMessage.getCorrelationId();
            var response = decoder(responseMessage);
            this.listenerIdToCorrelation[response.response] = correlationId;
            deferred.resolve(response.response);
        });
        return deferred.promise;
    }

    deregisterListener(request: ClientMessage, decoder: any): Promise<boolean> {
        var deferred = Promise.defer<boolean>();
        var invocation = new Invocation(request);
        var listenerIdToCorrelation = this.listenerIdToCorrelation;
        this.client.getInvocationService().invoke(invocation).then((responseMessage) => {
            var correlationId = responseMessage.getCorrelationId().toString();
            if (listenerIdToCorrelation.hasOwnProperty(correlationId)) {
                this.client.getInvocationService().removeEventHandler(listenerIdToCorrelation[correlationId].low);
                delete listenerIdToCorrelation[correlationId];
            }
            var response = decoder(responseMessage);
            deferred.resolve(response.response);
        });
        return deferred.promise;
    }
}
