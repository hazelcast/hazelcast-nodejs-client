/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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

import {Buffer} from 'safe-buffer';
import * as Promise from 'bluebird';
import {EventEmitter} from 'events';
import HazelcastClient from '../HazelcastClient';
import {ClientNotActiveError, HazelcastError, IllegalStateError} from '../HazelcastError';
import {ClientConnection} from './ClientConnection';
import {ConnectionAuthenticator} from './ConnectionAuthenticator';
import * as net from 'net';
import * as tls from 'tls';
import {DeferredPromise} from '../Util';
import {AddressTranslator} from '../connection/AddressTranslator';
import {AddressProvider} from '../connection/AddressProvider';
import {ILogger} from '../logging/ILogger';
import Address = require('../Address');

const EMIT_CONNECTION_CLOSED = 'connectionClosed';
const EMIT_CONNECTION_OPENED = 'connectionOpened';

/**
 * Maintains connections between the client and members of the cluster.
 */
export class ClientConnectionManager extends EventEmitter {
    establishedConnections: { [address: string]: ClientConnection } = {};
    readonly addressProviders: AddressProvider[];
    private readonly client: HazelcastClient;
    private pendingConnections: { [address: string]: Promise.Resolver<ClientConnection> } = {};
    private logger: ILogger;
    private readonly addressTranslator: AddressTranslator;

    constructor(client: HazelcastClient, addressTranslator: AddressTranslator, addressProviders: AddressProvider[]) {
        super();
        this.client = client;
        this.logger = this.client.getLoggingService().getLogger();
        this.addressTranslator = addressTranslator;
        this.addressProviders = addressProviders;
    }

    getActiveConnections(): { [address: string]: ClientConnection } {
        return this.establishedConnections;
    }

    /**
     * Returns the {@link ClientConnection} with given {@link Address}. If there is no such connection established,
     * it first connects to the address and then return the {@link ClientConnection}.
     * @param address
     * @param asOwner Sets the connected node as owner of this client if true.
     * @returns {Promise<ClientConnection>|Promise<T>}
     */
    getOrConnect(address: Address, asOwner: boolean = false): Promise<ClientConnection> {
        const addressIndex = address.toString();
        const connectionResolver: Promise.Resolver<ClientConnection> = DeferredPromise<ClientConnection>();

        const establishedConnection = this.establishedConnections[addressIndex];
        if (establishedConnection) {
            connectionResolver.resolve(establishedConnection);
            return connectionResolver.promise;
        }

        const pendingConnection = this.pendingConnections[addressIndex];
        if (pendingConnection) {
            return pendingConnection.promise;
        }

        this.pendingConnections[addressIndex] = connectionResolver;

        const processResponseCallback = (data: Buffer) => {
            this.client.getInvocationService().processResponse(data);
        };

        this.addressTranslator.translate(address).then((addr) => {
            if (addr == null) {
                throw new RangeError('Address Translator could not translate address ' + addr.toString());
            }

            this.triggerConnect(addr, asOwner).then((socket: net.Socket) => {
                const clientConnection = new ClientConnection(this.client, addr, socket);

                return this.initiateCommunication(clientConnection).then(() => {
                    return clientConnection.registerResponseCallback(processResponseCallback);
                }).then(() => {
                    return this.authenticate(clientConnection, asOwner);
                }).then(() => {
                    this.establishedConnections[clientConnection.getAddress().toString()] = clientConnection;
                    this.onConnectionOpened(clientConnection);
                    connectionResolver.resolve(clientConnection);
                });
            }).catch((e: any) => {
                connectionResolver.reject(e);
            }).finally(() => {
                delete this.pendingConnections[addressIndex];
            });
        });

        const connectionTimeout = this.client.getConfig().networkConfig.connectionTimeout;
        if (connectionTimeout !== 0) {
            return connectionResolver.promise.timeout(connectionTimeout, new HazelcastError(
                'Connection timed-out')).finally(() => {
                delete this.pendingConnections[addressIndex];
            });
        }
        return connectionResolver.promise;
    }

    /**
     * Destroys the connection with given node address.
     * @param address
     */
    destroyConnection(address: Address): void {
        const addressStr = address.toString();
        if (this.pendingConnections.hasOwnProperty(addressStr)) {
            this.pendingConnections[addressStr].reject(null);
        }
        if (this.establishedConnections.hasOwnProperty(addressStr)) {
            const conn = this.establishedConnections[addressStr];
            delete this.establishedConnections[addressStr];
            conn.close();
            this.onConnectionClosed(conn);
        }
    }

    shutdown(): void {
        for (const pending in this.pendingConnections) {
            this.pendingConnections[pending].reject(new ClientNotActiveError('Client is shutting down!'));
        }
        for (const conn in this.establishedConnections) {
            this.establishedConnections[conn].close();
        }
    }

    private triggerConnect(address: Address, asOwner: boolean): Promise<net.Socket> {
        if (!asOwner) {
            if (this.client.getClusterService().getOwnerConnection() == null) {
                const error = new IllegalStateError('Owner connection is not available!');
                return Promise.reject(error);
            }
        }

        if (this.client.getConfig().networkConfig.sslConfig.enabled) {
            if (this.client.getConfig().networkConfig.sslConfig.sslOptions) {
                const opts = this.client.getConfig().networkConfig.sslConfig.sslOptions;
                return this.connectTLSSocket(address, opts);
            } else if (this.client.getConfig().networkConfig.sslConfig.sslOptionsFactory) {
                const factory = this.client.getConfig().networkConfig.sslConfig.sslOptionsFactory;
                const factoryProperties = this.client.getConfig().networkConfig.sslConfig.sslOptionsFactoryProperties;
                return factory.init(factoryProperties).then(() => {
                    return this.connectTLSSocket(address, factory.getSSLOptions());
                });
            } else {
                // the default behavior when ssl is enabled
                const opts = this.client.getConfig().networkConfig.sslConfig.sslOptions = {
                    checkServerIdentity: (): any => null,
                    rejectUnauthorized: true,
                };
                return this.connectTLSSocket(address, opts);
            }
        } else {
            return this.connectNetSocket(address);
        }
    }

    private connectTLSSocket(address: Address, configOpts: any): Promise<tls.TLSSocket> {
        const connectionResolver = DeferredPromise<tls.TLSSocket>();
        const socket = tls.connect(address.port, address.host, configOpts);
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
        const connectionResolver = DeferredPromise<net.Socket>();
        const socket = net.connect(address.port, address.host);
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
        const buffer = Buffer.from('CB2');
        return connection.write(buffer);
    }

    private onConnectionClosed(connection: ClientConnection): void {
        this.emit(EMIT_CONNECTION_CLOSED, connection);
    }

    private onConnectionOpened(connection: ClientConnection): void {
        this.emit(EMIT_CONNECTION_OPENED, connection);
    }

    private authenticate(connection: ClientConnection, ownerConnection: boolean): Promise<void> {
        const authenticator = new ConnectionAuthenticator(connection, this.client);
        return authenticator.authenticate(ownerConnection);
    }
}
