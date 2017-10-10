import * as Promise from 'bluebird';
import {LoggingService} from '../logging/LoggingService';
import {EventEmitter} from 'events';
import HazelcastClient from '../HazelcastClient';
import {ClientNotActiveError} from '../HazelcastError';
import Address = require('../Address');
import ClientConnection = require('./ClientConnection');
import ConnectionAuthenticator = require('./ConnectionAuthenticator');

const EMIT_CONNECTION_CLOSED = 'connectionClosed';
const EMIT_CONNECTION_OPENED = 'connectionOpened';

/**
 * Maintains connections between the client and members of the cluster.
 */
class ClientConnectionManager extends EventEmitter {
    private client: HazelcastClient;
    private pendingConnections: {[address: string]: Promise.Resolver<ClientConnection>} = {};
    private logger = LoggingService.getLoggingService();
    establishedConnections: {[address: string]: ClientConnection} = {};

    constructor(client: HazelcastClient) {
        super();
        this.client = client;
    }

    /**
     * Returns the {@link ClientConnection} with given {@link Address}. If there is no such connection established,
     * it first connects to the address and then return the {@link ClientConnection}.
     * @param address
     * @param ownerConnection Sets the connected node as owner of this client if true.
     * @returns {Promise<ClientConnection>|Promise<T>}
     */
    getOrConnect(address: Address, ownerConnection: boolean = false): Promise<ClientConnection> {
        var addressIndex = Address.encodeToString(address);
        var result: Promise.Resolver<ClientConnection> = Promise.defer<ClientConnection>();

        var establishedConnection = this.establishedConnections[addressIndex];

        if (establishedConnection) {
            result.resolve(establishedConnection);
            return result.promise;
        }

        var pendingConnection = this.pendingConnections[addressIndex];

        if (pendingConnection) {
            return pendingConnection.promise;
        }

        this.pendingConnections[addressIndex] = result;

        var clientConnection = new ClientConnection(this.client.getConnectionManager(), address,
            this.client.getConfig().networkConfig);

        clientConnection.connect().then(() => {
            clientConnection.registerResponseCallback((data: Buffer) => {
                this.client.getInvocationService().processResponse(data);
            });
        }).then(() => {
            return this.authenticate(clientConnection, ownerConnection);
        }).then(() => {
            this.establishedConnections[Address.encodeToString(clientConnection.address)] = clientConnection;
            this.onConnectionOpened(clientConnection);
            result.resolve(clientConnection);
        }).catch((e: any) => {
            result.resolve(null);
        }).finally(() => {
            delete this.pendingConnections[addressIndex];
        });
        return result.promise;
    }

    /**
     * Destroys the connection with given node address.
     * @param address
     */
    destroyConnection(address: Address): void {
        var addressStr = Address.encodeToString(address);
        if (this.pendingConnections.hasOwnProperty(addressStr)) {
            this.pendingConnections[addressStr].reject(null);
        }
        if (this.establishedConnections.hasOwnProperty(addressStr)) {
            var conn = this.establishedConnections[addressStr];
            delete this.establishedConnections[addressStr];
            conn.close();
            this.onConnectionClosed(conn);
        }
    }

    shutdown() {
        for (var pending in this.pendingConnections) {
            this.pendingConnections[pending].reject(new ClientNotActiveError('Client is shutting down!'));
        }
        for (var conn in this.establishedConnections) {
            this.establishedConnections[conn].close();
        }
    }

    private onConnectionClosed(connection: ClientConnection) {
        this.emit(EMIT_CONNECTION_CLOSED, connection);
    }

    private onConnectionOpened(connection: ClientConnection) {
        this.emit(EMIT_CONNECTION_OPENED, connection);
    }

    private authenticate(connection: ClientConnection, ownerConnection: boolean): Promise<void> {
        var authenticator = new ConnectionAuthenticator(connection, this.client);

        return authenticator.authenticate(ownerConnection);
    }
}

export = ClientConnectionManager;
