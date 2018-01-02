import net = require('net');
import tls = require('tls');
import stream = require('stream');
import Address = require('../Address');
import * as Promise from 'bluebird';
import {BitsUtil} from '../BitsUtil';
import {LoggingService} from '../logging/LoggingService';
import {ClientNetworkConfig} from '../Config';
import {ClientConnectionManager} from './ClientConnectionManager';
import {BuildMetadata} from '../BuildMetadata';

export class ClientConnection {
    address: Address;
    localAddress: Address;
    socket: stream.Duplex;
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

        if (this.clientNetworkConfig.sslOptions) {
            var sslSocket = tls.connect(this.address.port, this.address.host, this.clientNetworkConfig.sslOptions, conCallback);
            this.localAddress = new Address(sslSocket.address().address, sslSocket.address().port);
            this.socket = sslSocket as stream.Duplex;
        } else {
            var netSocket = net.connect(this.address.port, this.address.host, conCallback);
            this.localAddress = new Address(netSocket.localAddress, netSocket.localPort);
            this.socket = netSocket as stream.Duplex;
        }

        this.socket.on('error', (e: any) => {
            this.logging.warn('ClientConnection',
                'Could not connect to address ' + this.address.toString(), e);
            ready.reject(e);
            if (e.code === 'EPIPE' || e.code === 'ECONNRESET') {
                this.connectionManager.destroyConnection(this.address);
            }
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
