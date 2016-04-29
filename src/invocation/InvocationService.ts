import ClientConnection = require('./ClientConnection');
import ClientMessage = require('../ClientMessage');
import * as Q from 'q';
import Long = require('long');
import {Data} from '../serialization/Data';
import Address = require('../Address');
import ExceptionCodec = require('../codec/ExceptionCodec');
import {BitsUtil} from '../BitsUtil';
import {LoggingService} from '../LoggingService';
import {EventEmitter} from 'events';
import HazelcastClient from '../HazelcastClient';

var EXCEPTION_MESSAGE_TYPE = 109;
var INVOCATION_TIMEOUT = 120000;
var INVOCATION_RETRY_DELAY = 1000;

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
    deferred: Q.Deferred<ClientMessage>;

    /**
     * If this is an event listener registration, handler should be set to the function to be called on events.
     * Otherwise, should be set to null.
     */
    handler: (...args: any[]) => any;
}

/**
 * Sends requests to appropriate nodes. Resolves waiting promises with responses.
 */
export class InvocationService {
    private correlationCounter = 0;
    private eventHandlers: {[id: number]: Invocation} = {};
    private pending: {[id: number]: Invocation} = {};
    private client: HazelcastClient;
    private smartRoutingEnabled: boolean;
    private logger = LoggingService.getLoggingService();

    invoke: (invocation: Invocation) => Q.Promise<ClientMessage>;

    constructor(hazelcastClient: HazelcastClient) {
        this.client = hazelcastClient;
        this.smartRoutingEnabled = hazelcastClient.getConfig().networkConfig.smartRouting;
        if (hazelcastClient.getConfig().networkConfig.smartRouting) {
            this.invoke = this.invokeSmart;
        } else {
            this.invoke = this.invokeNonSmart;
        }
    }

    /**
     * Invokes given invocation on specified connection.
     * @param connection
     * @param request
     * @param handler called with values returned from server for this invocation.
     * @returns
     */
    invokeOnConnection(connection: ClientConnection, request: ClientMessage,
                       handler?: (...args: any[]) => any): Q.Promise<ClientMessage> {
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
    invokeOnPartition(request: ClientMessage, partitionId: number): Q.Promise<ClientMessage> {
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
    invokeOnTarget(request: ClientMessage, target: Address): Q.Promise<ClientMessage> {
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
    invokeOnRandomTarget(request: ClientMessage): Q.Promise<ClientMessage> {
        return this.invoke(new Invocation(request));
    }

    private invokeSmart(invocation: Invocation) {
        if (invocation.hasOwnProperty('connection')) {
            return this.send(invocation, invocation.connection);
        } else if (invocation.hasOwnProperty('partitionId')) {
            var address = this.client.getPartitionService().getAddressForPartition(invocation.partitionId);
            return this.sendToAddress(invocation, address);
        } else if (invocation.hasOwnProperty('address')) {
            return this.sendToAddress(invocation, invocation.address);
        } else {
            return this.send(invocation, this.client.getClusterService().getOwnerConnection());
        }
    }

    private invokeNonSmart(invocation: Invocation) {
        if (invocation.hasOwnProperty('connection')) {
            return this.send(invocation, invocation.connection);
        } else {
            return this.send(invocation, this.client.getClusterService().getOwnerConnection());
        }
    }

    private sendToAddress(invocation: Invocation, addres: Address): Q.Promise<ClientMessage> {
        return this.client.getConnectionManager().getOrConnect(addres)
            .then<ClientMessage>((connection: ClientConnection) => {
                return this.send(invocation, connection);
            });
    }

    private send(invocation: Invocation, connection: ClientConnection): Q.Promise<ClientMessage> {
        var correlationId = this.correlationCounter++;
        var message = invocation.request;
        message.setCorrelationId(Long.fromNumber(correlationId));
        if (invocation.hasOwnProperty('partitionId')) {
            message.setPartitionId(invocation.partitionId);
        } else {
            message.setPartitionId(-1);
        }
        invocation.deferred = Q.defer<ClientMessage>();
        if (invocation.hasOwnProperty('handler')) {
            this.eventHandlers[correlationId] = invocation;
        }
        this.pending[correlationId] = invocation;
        connection.write(invocation.request.getBuffer()).catch((e) => {
            invocation.deferred.reject(e);
        });
        return invocation.deferred.promise;
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
                this.logger.error('InvocationService', 'Received exception as response', remoteException);
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

    registerListener(request: ClientMessage, handler: any, decoder: any, key: any = undefined): Q.Promise<string> {
        var deferred = Q.defer<string>();
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

    deregisterListener(request: ClientMessage, decoder: any): Q.Promise<boolean> {
        var deferred = Q.defer<boolean>();
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
