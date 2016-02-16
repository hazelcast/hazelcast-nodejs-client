import ClientConnection = require('./ClientConnection');
import ClientMessage = require('../ClientMessage');
import Q = require('q');
import Long = require('long');
import HazelcastClient = require('../HazelcastClient');
import {Data} from '../serialization/Data';

class InvocationService {

    private correlationCounter = 0;
    private pending: {[id: number]: Q.Deferred<ClientMessage>} = {};
    private client: HazelcastClient;

    constructor(hazelcastClient: HazelcastClient) {
        this.client = hazelcastClient;
    }

    public invokeOnConnection(connection: ClientConnection, clientMessage: ClientMessage): Q.Promise<ClientMessage> {
        var correlationId = this.correlationCounter++;
        clientMessage.setCorrelationId(Long.fromNumber(correlationId));
        connection.write(clientMessage.getBuffer());
        var deferred = Q.defer<ClientMessage>();
        this.pending[correlationId] = deferred;
        return deferred.promise;
    }

    public invokeOnPartition(clientMessage: ClientMessage, partitionId: number): Q.Promise<ClientMessage> {
        clientMessage.setPartitionId(partitionId);
        var connection: ClientConnection = this.client.getConnectionManager().getOwnerConnection();
        return this.invokeOnConnection(connection, clientMessage);
    }

    public processResponse(buffer: Buffer) {
        var clientMessage = new ClientMessage(buffer);
        var correlationId = clientMessage.getCorrelationId().toNumber();
        this.pending[correlationId].resolve(clientMessage);
    }
}

export = InvocationService
