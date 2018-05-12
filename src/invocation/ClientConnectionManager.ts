/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Promise from 'bluebird';
import {LoggingService} from '../logging/LoggingService';
import {EventEmitter} from 'events';
import HazelcastClient from '../HazelcastClient';
import {ClientNotActiveError, HazelcastError} from '../HazelcastError';
import {ClientConnection} from './ClientConnection';
import {ConnectionAuthenticator} from './ConnectionAuthenticator';
import * as net from 'net';
import * as tls from 'tls';
import {loadNameFromPath} from '../Util';
import {BasicSSLOptionsFactory} from '../connection/BasicSSLOptionsFactory';
import Address = require('../Address');

const EMIT_CONNECTION_CLOSED = 'connectionClosed';
const EMIT_CONNECTION_OPENED = 'connectionOpened';

/**
 * Maintains connections between the client and members of the cluster.
 */
export class ClientConnectionManager extends EventEmitter {
    establishedConnections: { [address: string]: ClientConnection } = {};
    private client: HazelcastClient;
    private pendingConnections: { [address: string]: Promise.Resolver<ClientConnection> } = {};
    private logger = LoggingService.getLoggingService();

    constructor(client: HazelcastClient) {
        super();
        this.client = client;
    }

    getActiveConnections(): { [address: string]: ClientConnection } {
        return this.establishedConnections;
    }

    /**
     * Returns the {@link ClientConnection} with given {@link Address}. If there is no such connection established,
     * it first connects to the address and then return the {@link ClientConnection}.
     * @param address
     * @param ownerConnection Sets the connected node as owner of this client if true.
     * @returns {Promise<ClientConnection>|Promise<T>}
     */
    getOrConnect(address: Address, ownerConnection: boolean = false): Promise<ClientConnection> {
        let addressIndex = address.toString();
        let connectionResolver: Promise.Resolver<ClientConnection> = Promise.defer<ClientConnection>();

        let establishedConnection = this.establishedConnections[addressIndex];
        if (establishedConnection) {
            connectionResolver.resolve(establishedConnection);
            return connectionResolver.promise;
        }

        let pendingConnection = this.pendingConnections[addressIndex];
        if (pendingConnection) {
            return pendingConnection.promise;
        }

        this.pendingConnections[addressIndex] = connectionResolver;

        let processResponseCallback = (data: Buffer) => {
            this.client.getInvocationService().processResponse(data);
        };

        this.triggerConnect(address).then((socket: net.Socket) => {
            let clientConnection = new ClientConnection(this.client, address, socket);

            return this.initiateCommunication(clientConnection).then(() => {
                return clientConnection.registerResponseCallback(processResponseCallback);
            }).then(() => {
                return this.authenticate(clientConnection, ownerConnection);
            }).then(() => {
                this.establishedConnections[clientConnection.getAddress().toString()] = clientConnection;
                this.onConnectionOpened(clientConnection);
                connectionResolver.resolve(clientConnection);
            });
        }).catch((e: any) => {
            connectionResolver.resolve(null);
        }).finally(() => {
            delete this.pendingConnections[addressIndex];
        });

        let connectionTimeout = this.client.getConfig().networkConfig.connectionTimeout;
        if (connectionTimeout !== 0) {
            return connectionResolver.promise.timeout(connectionTimeout, new HazelcastError('Connection timed-out'));
        }
        return connectionResolver.promise;
    }

    /**
     * Destroys the connection with given node address.
     * @param address
     */
    destroyConnection(address: Address): void {
        var addressStr = address.toString();
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

    private triggerConnect(address: Address): Promise<net.Socket> {
        if (this.client.getConfig().networkConfig.sslOptions) {
            let opts = this.client.getConfig().networkConfig.sslOptions;
            return this.connectTLSSocket(address, opts);
        } else if (this.client.getConfig().networkConfig.sslOptionsFactoryConfig) {
            let factoryConfig = this.client.getConfig().networkConfig.sslOptionsFactoryConfig;
            let factoryProperties = this.client.getConfig().networkConfig.sslOptionsFactoryProperties;
            let factory: any;
            if (factoryConfig.path) {
                factory = new (loadNameFromPath(factoryConfig.path, factoryConfig.exportedName))();
            } else {
                factory = new BasicSSLOptionsFactory();
            }
            return factory.init(factoryProperties).then(() => {
                return this.connectTLSSocket(address, factory.getSSLOptions());
            });
        } else {
            return this.connectNetSocket(address);
        }
    }

    private connectTLSSocket(address: Address, configOpts: any): Promise<tls.TLSSocket> {
        let connectionResolver = Promise.defer<tls.TLSSocket>();
        let socket = tls.connect(address.port, address.host, configOpts);
        socket.once('secureConnect', () => {
            connectionResolver.resolve(socket);
        });
        socket.on('error', (e: any) => {
            this.logger.warn('ClientConnectionManager', 'Could not connect to address ' + address.toString(), e);
            connectionResolver.reject(e);
            if (e.code === 'EPIPE' || e.code === 'ECONNRESET') {
                this.destroyConnection(address);
            }
        });
        return connectionResolver.promise;
    }

    private connectNetSocket(address: Address): Promise<net.Socket> {
        let connectionResolver = Promise.defer<net.Socket>();
        let socket = net.connect(address.port, address.host);
        socket.once('connect', () => {
            connectionResolver.resolve(socket);
        });
        socket.on('error', (e: any) => {
            this.logger.warn('ClientConnectionManager', 'Could not connect to address ' + address.toString(), e);
            connectionResolver.reject(e);
            if (e.code === 'EPIPE' || e.code === 'ECONNRESET') {
                this.destroyConnection(address);
            }
        });
        return connectionResolver.promise;
    }

    private initiateCommunication(connection: ClientConnection): Promise<void> {
        // Send the protocol version
        let buffer = new Buffer(3);
        buffer.write('CB2');
        return connection.write(buffer);
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
