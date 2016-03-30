import ClientConnection = require('./ClientConnection');
import ClientMessage = require('../ClientMessage');
import Q = require('q');
import Long = require('long');
import HazelcastClient = require('../HazelcastClient');
import {Data} from '../serialization/Data';
import Address = require('../Address');
import ExceptionCodec = require('../codec/ExceptionCodec');
import {BitsUtil} from '../BitsUtil';

export interface Invocation {
    request: ClientMessage;
    partitionId?: number;
    address?: Address;
    connection?: ClientConnection;
    deferred?: Q.Deferred<ClientMessage>;
    handler?: (...args: any[]) => any;
}

export class InvocationService {

    private static EXCEPTION_MESSAGE_TYPE = 109;

    private correlationCounter = 0;
    private eventHandlers: {[id: number]: Invocation} = {};
    private pending: {[id: number]: Invocation} = {};
    private client: HazelcastClient;
    private smartRoutingEnabled: boolean;
    public invoke: (invocation: Invocation) => Q.Promise<ClientMessage>;

    constructor(hazelcastClient: HazelcastClient) {
        this.client = hazelcastClient;
        this.smartRoutingEnabled = hazelcastClient.getConfig().networkConfig.smartRouting;
        if (hazelcastClient.getConfig().networkConfig.smartRouting) {
            this.invoke = this.invokeSmart;
        } else {
            this.invoke = this.invokeNonSmart;
        }
    }

    invokeOnConnection(connection: ClientConnection, request: ClientMessage): Q.Promise<ClientMessage> {
        return this.invoke({request: request, connection: connection});
    }

    invokeOnPartition(request: ClientMessage, partitionId: number): Q.Promise<ClientMessage> {
        return this.invoke({request: request, partitionId: partitionId});
    }

    invokeOnTarget(request: ClientMessage, target: Address): Q.Promise<ClientMessage> {
        return this.invoke({request: request, address: target});
    }

    invokeOnRandomTarget(clientMessage: ClientMessage): Q.Promise<ClientMessage> {
        return this.invoke({request: clientMessage});
    }

    invokeSmart(invocation: Invocation) {
        if (invocation.hasOwnProperty('connection')) {
            return this.send(invocation, invocation.connection);
        } else if (invocation.hasOwnProperty('partitionId')) {
            var addr = this.client.getPartitionService().getAddressForPartition(invocation.partitionId);
            return this.sendToAddress(invocation, addr);
        } else if (invocation.hasOwnProperty('address')) {
            return this.sendToAddress(invocation, invocation.address);
        } else {
            return this.send(invocation, this.client.getClusterService().getOwnerConnection());
        }
    }

    invokeNonSmart(invocation: Invocation) {
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
            Q.fcall(this.eventHandlers[correlationId].handler, clientMessage);
            return;
        }

        var pending = this.pending[correlationId].deferred;
        if (messageType === InvocationService.EXCEPTION_MESSAGE_TYPE) {
            var remoteException = ExceptionCodec.decodeResponse(clientMessage);
            console.log(remoteException);
            pending.reject(remoteException);
        } else {
            pending.resolve(clientMessage);
        }
        delete this.pending[correlationId];
    }
}

