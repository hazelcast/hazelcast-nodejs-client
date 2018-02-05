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

import net = require('net');
import tls = require('tls');
import stream = require('stream');
import Address = require('../Address');
import * as Promise from 'bluebird';
import {BitsUtil} from '../BitsUtil';
import {LoggingService} from '../logging/LoggingService';
import {ClientNetworkConfig} from '../config/ClientNetworkConfig';
import {ClientConnectionManager} from './ClientConnectionManager';
import {BuildMetadata} from '../BuildMetadata';
import {loadNameFromPath} from '../Util';
import {BasicSSLOptionsFactory} from '../connection/BasicSSLOptionsFactory';
import {HazelcastError} from '../HazelcastError';

export class ClientConnection {
    address: Address;
    localAddress: Address;
    socket: net.Socket;
    lastRead: number;
    heartbeating = true;

    private readBuffer: Buffer;
    private logging =  LoggingService.getLoggingService();
    private clientNetworkConfig: ClientNetworkConfig;
    private connectionManager: ClientConnectionManager;
    private closedTime: number;
    private connectedServerVersionString: string;
    private connectedServerVersion: number;
    private authenticatedAsOwner: boolean;

    constructor(connectionManager: ClientConnectionManager, address: Address, clientNetworkConfig: ClientNetworkConfig) {
        this.address = address;
        this.clientNetworkConfig = clientNetworkConfig;
        this.readBuffer = new Buffer(0);
        this.lastRead = 0;
        this.connectionManager = connectionManager;
        this.closedTime = 0;
        this.connectedServerVersionString = null;
        this.connectedServerVersion = BuildMetadata.UNKNOWN_VERSION_ID;
    }

    /**
     * Returns the address of local port that is associated with this connection.
     * @returns
     */
    getLocalAddress() {
        return this.localAddress;
    }

    /**
     * Returns the address of remote node that is associated with this connection.
     * @returns
     */
    getAddress(): Address {
        return this.address;
    }

    protected createSocket(conCallback: () => void): Promise<void> {
        if (this.clientNetworkConfig.sslOptions) {
            var sslSocket = tls.connect(this.address.port, this.address.host, this.clientNetworkConfig.sslOptions, conCallback);
            this.socket = sslSocket;
            return Promise.resolve();
        } else if (this.clientNetworkConfig.sslOptionsFactoryConfig) {
            let factoryConfig = this.clientNetworkConfig.sslOptionsFactoryConfig;
            let factoryProperties = this.clientNetworkConfig.sslOptionsFactoryProperties;
            let factory: any;
                if (factoryConfig.path) {
                    factory = new (loadNameFromPath(factoryConfig.path, factoryConfig.exportedName))();
                } else {
                    factory = new BasicSSLOptionsFactory();
                }
            return factory.init(factoryProperties).then(() => {
                let sslSocket = tls.connect(this.address.port, this.address.host, factory.getSSLOptions(), conCallback);
                this.socket = sslSocket;
                return;
            });
        } else {
            var netSocket = net.connect(this.address.port, this.address.host, conCallback);
            this.socket = netSocket;
            return Promise.resolve();
        }
    }

    /**
     * Connects to remote server and sets the hazelcast protocol.
     * @returns
     */
    connect(): Promise<ClientConnection> {
        var ready = Promise.defer<ClientConnection>();

        var conCallback = () => {
            // Send the protocol version
            var buffer = new Buffer(3);
            buffer.write('CB2');
            this.socket.write(buffer);
            ready.resolve(this);
        };

        this.createSocket(conCallback).then(() => {
            this.localAddress = new Address(this.socket.localAddress, this.socket.localPort);
            this.socket.on('error', (e: any) => {
                this.logging.warn('ClientConnection',
                    'Could not connect to address ' + this.address.toString(), e);
                ready.reject(e);
                if (e.code === 'EPIPE' || e.code === 'ECONNRESET') {
                    this.connectionManager.destroyConnection(this.address);
                }
            });
        }).catch((e) => {
            ready.reject(e);
        });
        return ready.promise;
    }

    write(buffer: Buffer): Promise<void> {
        let deferred = Promise.defer<void>();
        try {
            this.socket.write(buffer, (err: any) => {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            });
        } catch (err) {
            deferred.reject(err);
        }
        return deferred.promise;
    }

    setConnectedServerVersion(versionString: string): void {
        this.connectedServerVersionString = versionString;
        this.connectedServerVersion =  BuildMetadata.calculateVersion(versionString);
    }

    getConnectedServerVersion(): number {
        return this.connectedServerVersion;
    }

    /**
     * Closes this connection.
     */
    close(): void {
        this.socket.end();
        this.closedTime = Date.now();
    }

    isAlive(): boolean {
        return this.closedTime === 0;
    }

    isAuthenticatedAsOwner(): boolean {
        return this.authenticatedAsOwner;
    }

    setAuthneticatedAsOwner(asOwner: boolean): void {
        this.authenticatedAsOwner = asOwner;
    }

    toString(): string {
        return this.address.toString();
    }

    /**
     * Registers a function to pass received data on 'data' events on this connection.
     * @param callback
     */
    registerResponseCallback(callback: Function) {
        this.socket.on('data', (buffer: Buffer) => {
            this.lastRead = new Date().getTime();
            this.readBuffer = Buffer.concat([this.readBuffer, buffer], this.readBuffer.length + buffer.length);
            while (this.readBuffer.length >= BitsUtil.INT_SIZE_IN_BYTES ) {
                var frameSize = this.readBuffer.readInt32LE(0);
                if (frameSize > this.readBuffer.length) {
                    return;
                }
                var message: Buffer = new Buffer(frameSize);
                this.readBuffer.copy(message, 0, 0, frameSize);
                this.readBuffer = this.readBuffer.slice(frameSize);
                callback(message);
            }
        });
    }
}
