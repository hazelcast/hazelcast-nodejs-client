import ClientConnection = require('./ClientConnection');
import ClientMessage = require('../ClientMessage');
import Q = require('q');
import Long = require('long');
import HazelcastClient = require('../HazelcastClient');
import {Data} from '../serialization/Data';
import Address = require('../Address');
import ExceptionCodec = require('../codec/ExceptionCodec');
import {BitsUtil} from '../BitsUtil';

var EXCEPTION_MESSAGE_TYPE = 109;
var INVOCATION_TIMEOUT = 120000;
var INVOCATION_RETRY_DELAY = 1000;

class Invocation {

    constructor(request: ClientMessage) {
        this.request = request;
    }

    request: ClientMessage;
    partitionId: number;
    address: Address;
    deadline: Date = new Date(new Date().getTime() + INVOCATION_TIMEOUT);
    connection: ClientConnection;
    deferred: Q.Deferred<ClientMessage>;
    handler: (...args: any[]) => any;
}

export class InvocationService {

    private correlationCounter = 0;
    private eventHandlers: {[id: number]: Invocation} = {};
    private pending: {[id: number]: Invocation} = {};
    private client: HazelcastClient;
    private smartRoutingEnabled: boolean;
    private invoke: (invocation: Invocation) => Q.Promise<ClientMessage>;

    constructor(hazelcastClient: HazelcastClient) {
        this.client = hazelcastClient;
        this.smartRoutingEnabled = hazelcastClient.getConfig().networkConfig.smartRouting;
        if (hazelcastClient.getConfig().networkConfig.smartRouting) {
            this.invoke = this.invokeSmart;
        } else {
            this.invoke = this.invokeNonSmart;
        }
    }

    invokeOnConnection(connection: ClientConnection, request: ClientMessage,
                       handler?: (...args: any[]) => any): Q.Promise<ClientMessage> {
        var invocation = new Invocation(request);
        invocation.connection = connection;
        if (handler) {
            invocation.handler = handler;
        }
        return this.invoke(invocation);
    }

    invokeOnPartition(request: ClientMessage, partitionId: number): Q.Promise<ClientMessage> {
        var invocation = new Invocation(request);
        invocation.partitionId = partitionId;
        return this.invoke(invocation);
    }

    invokeOnTarget(request: ClientMessage, target: Address): Q.Promise<ClientMessage> {
        var invocation = new Invocation(request);
        invocation.address = target;
        return this.invoke(invocation);
    }

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

    processResponse(buffer: Buffer) {
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
                console.log(remoteException);
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

