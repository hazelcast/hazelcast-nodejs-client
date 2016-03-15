import Q = require('q');

import Address = require('../Address');
import ClientConnection = require('./ClientConnection');

import InvocationService = require('./InvocationService');

import {GroupConfig, ClientNetworkConfig} from '../Config';

import ConnectionAuthenticator = require('./ConnectionAuthenticator');
import HazelcastClient = require('../HazelcastClient');
import {ConnectionListener} from '../ConnectionListener';

class ClientConnectionManager {

    private client: HazelcastClient;
    private listeners: ConnectionListener[] = [];
    private pendingConnections: {[address: string]: Q.Deferred<ClientConnection>} = {};
    establishedConnections: {[address: string]: ClientConnection} = {};

    constructor(client: HazelcastClient) {
        this.client = client;
    }

    getOrConnect(address: Address): Q.Promise<ClientConnection> {
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

        clientConnection.connect().then((connection: ClientConnection) => {
            connection.registerResponseCallback((data: Buffer) => {
                this.client.getInvocationService().processResponse(data);
            });

            var callback = (authenticated: boolean) => {
                if (authenticated) {
                    result.resolve(connection);
                    this.establishedConnections[connection.address.toString()] = connection;
                } else {
                    result.reject(new Error('Authentication failed'));
                }
            };
            this.authenticate(connection).then(callback).then(() => {
                this.onConnectionOpened(connection);
            }).catch((e: any) => {
                result.reject(e);
            }).finally(() => {
                delete this.pendingConnections[addressIndex];
            });
        }).catch((e: any) => {
            result.reject(e);
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
            this.onConnectionClosed(conn);
            delete this.establishedConnections[addressStr];
        }
    }

    addListener(listener: ConnectionListener) {
        this.listeners.push(listener);
    }

    private onConnectionClosed(connection: ClientConnection) {
        this.listeners.forEach((listener) => {
            if (listener.hasOwnProperty('onConnectionClosed')) {
                setImmediate(listener.onConnectionClosed.bind(this), connection);
            }
        });
    }

    private onConnectionOpened(connection: ClientConnection) {
        console.log('Authenticated to ' + connection.address);
        this.listeners.forEach((listener) => {
            if (listener.hasOwnProperty('onConnectionOpened')) {
                setImmediate(listener.onConnectionOpened.bind(this), connection);
            }
        });
    }

    private authenticate(connection: ClientConnection): Q.Promise<boolean> {
        var name = this.client.getConfig().groupConfig.name;
        var password = this.client.getConfig().groupConfig.password;
        var invocationService = this.client.getInvocationService();

        var authenticator = new ConnectionAuthenticator(connection, invocationService, name, password);

        return authenticator.authenticate();
    }
}

export = ClientConnectionManager
