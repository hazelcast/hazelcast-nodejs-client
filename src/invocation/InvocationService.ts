import ClientConnection = require('./ClientConnection');
import ClientMessage = require('../ClientMessage');
import Q = require('q');
import Long = require('long');
import HazelcastClient = require('../HazelcastClient');
import {Data} from '../serialization/Data';
import Address = require('../Address');

class InvocationService {

    private correlationCounter = 0;
    private pending: {[id: number]: Q.Deferred<ClientMessage>} = {};
    private client: HazelcastClient;

    constructor(hazelcastClient: HazelcastClient) {
        this.client = hazelcastClient;
    }

    invokeOnConnection(connection: ClientConnection, clientMessage: ClientMessage): Q.Promise<ClientMessage> {
        var correlationId = this.correlationCounter++;
        clientMessage.setCorrelationId(Long.fromNumber(correlationId));
        connection.write(clientMessage.getBuffer());
        var deferred = Q.defer<ClientMessage>();
        this.pending[correlationId] = deferred;
        return deferred.promise;
    }

    invokeOnPartition(clientMessage: ClientMessage, partitionId: number): Q.Promise<ClientMessage> {
        clientMessage.setPartitionId(partitionId);
        var address: Address = this.client.getPartitionService().getAddressForPartition(partitionId);
        return this.client.getConnectionManager().getOrConnect(address)
            .then<ClientMessage>((connection: ClientConnection) => {
                return this.invokeOnConnection(connection, clientMessage);
            });
    }

    processResponse(buffer: Buffer) {
        var clientMessage = new ClientMessage(buffer);
        var correlationId = clientMessage.getCorrelationId().toNumber();
        this.pending[correlationId].resolve(clientMessage);
    }
}

export = InvocationService
