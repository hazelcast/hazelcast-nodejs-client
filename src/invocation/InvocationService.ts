import ClientConnection = require('./ClientConnection');
import ClientMessage = require('../ClientMessage');
import Q = require('q');
import Long = require('long');
import HazelcastClient = require('../HazelcastClient');
import {Data} from '../serialization/Data';
import Address = require('../Address');
import ExceptionCodec = require('../codec/ExceptionCodec');

class InvocationService {

    private static EXCEPTION_MESSAGE_TYPE = 109;

    private correlationCounter = 0;
    private pending: {[id: number]: Q.Deferred<ClientMessage>} = {};
    private client: HazelcastClient;
    private smartRoutingEnabled: boolean;

    constructor(hazelcastClient: HazelcastClient) {
        this.client = hazelcastClient;
        this.smartRoutingEnabled = hazelcastClient.getConfig().networkConfig.smartRouting;
    }

    invokeOnConnection(connection: ClientConnection, request: ClientMessage): Q.Promise<ClientMessage> {
        var correlationId = this.correlationCounter++;
        request.setCorrelationId(Long.fromNumber(correlationId));
        connection.write(request.getBuffer());
        var deferred = Q.defer<ClientMessage>();
        this.pending[correlationId] = deferred;
        return deferred.promise;
    }

    invokeOnPartition(request: ClientMessage, partitionId: number): Q.Promise<ClientMessage> {
        request.setPartitionId(partitionId);
        if (this.smartRoutingEnabled) {
            return this.invokeSmart(request, partitionId);
        } else {
            return this.invokeRegular(request);
        }
    }

    invokeSmart(request: ClientMessage, partitionId: number): Q.Promise<ClientMessage> {
        var address: Address = this.client.getPartitionService().getAddressForPartition(partitionId);
        return this.client.getConnectionManager().getOrConnect(address)
            .then<ClientMessage>((connection: ClientConnection) => {
                return this.invokeOnConnection(connection, request);
            });
    }

    invokeRegular(request: ClientMessage): Q.Promise<ClientMessage> {
        return this.invokeOnConnection(this.client.getClusterService().getOwnerConnection(), request);
    }

    invokeOnRandomTarget(clientMessage: ClientMessage): Q.Promise<ClientMessage> {
        var connection = this.client.getClusterService().getOwnerConnection();
        return this.invokeOnConnection(connection, clientMessage);
    }

    processResponse(buffer: Buffer) {
        var clientMessage = new ClientMessage(buffer);
        var correlationId = clientMessage.getCorrelationId().toNumber();
        var messageType = clientMessage.getMessageType();
        var pending = this.pending[correlationId];

        if (messageType === InvocationService.EXCEPTION_MESSAGE_TYPE) {
            var remoteException = ExceptionCodec.decodeResponse(clientMessage);
            pending.reject(remoteException);
        } else {
            pending.resolve(clientMessage);
        }

        delete this.pending[correlationId];
    }
}

export = InvocationService
