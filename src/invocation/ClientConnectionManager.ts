import Q = require('q');

import Address = require('../Address');
import ClientConnection = require('./ClientConnection');

import InvocationService = require('./InvocationService');

import {GroupConfig, ClientNetworkConfig} from '../Config';

import ConnectionAuthenticator = require('./ConnectionAuthenticator');
import HazelcastClient = require('../HazelcastClient');
import {LoggingService} from '../LoggingService';
import {EventEmitter} from 'events';

const EMIT_CONNECTION_CLOSED = 'connectionClosed';
const EMIT_CONNECTION_OPENED = 'connectionOpened';

class ClientConnectionManager extends EventEmitter {
    private client: HazelcastClient;
    private pendingConnections: {[address: string]: Q.Deferred<ClientConnection>} = {};
    private logger = LoggingService.getLoggingService();
    establishedConnections: {[address: string]: ClientConnection} = {};

    constructor(client: HazelcastClient) {
        super();
        this.client = client;
    }

    getOrConnect(address: Address, ownerConnection: boolean = false): Q.Promise<ClientConnection> {
        var addressIndex = address.toString();
        var result: Q.Deferred<ClientConnection> = Q.defer<ClientConnection>();

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

        var clientConnection = new ClientConnection(address);

        clientConnection.connect().then(() => {
            clientConnection.registerResponseCallback((data: Buffer) => {
                this.client.getInvocationService().processResponse(data);
            });
        }).then(() => {
            return this.authenticate(clientConnection, ownerConnection);
        }).then((authenticated: boolean) => {
            if (authenticated) {
                this.establishedConnections[clientConnection.address.toString()] = clientConnection;
            } else {
                throw new Error('Authentication failed');
            }
        }).then(() => {
            this.onConnectionOpened(clientConnection);
            result.resolve(clientConnection);
        }).catch((e: any) => {
            result.reject(e);
        }).finally(() => {
            delete this.pendingConnections[addressIndex];
        });
        return result.promise;
    }

    destroyConnection(address: Address): void {
        var addressStr = address.toString();
        if (this.pendingConnections.hasOwnProperty(addressStr)) {
            this.pendingConnections[addressStr].reject(null);
        }
        if (this.establishedConnections.hasOwnProperty(addressStr)) {
            var conn = this.establishedConnections[addressStr];
            conn.close();
            delete this.establishedConnections[addressStr];
            this.onConnectionClosed(conn);
        }
    }

    private onConnectionClosed(connection: ClientConnection) {
        this.emit(EMIT_CONNECTION_CLOSED, connection);
    }

    private onConnectionOpened(connection: ClientConnection) {
        this.emit(EMIT_CONNECTION_OPENED, connection);
    }

    private authenticate(connection: ClientConnection, ownerConnection: boolean): Q.Promise<boolean> {
        var authenticator = new ConnectionAuthenticator(connection, this.client);

        return authenticator.authenticate(ownerConnection);
    }
}

export = ClientConnectionManager
