import net = require('net');
import tls = require('tls');
import stream = require('stream');
import * as Promise from 'bluebird';
import {BitsUtil} from '../BitsUtil';
import {LoggingService} from '../logging/LoggingService';
import {ClientNetworkConfig} from '../Config';
import Address = require('../Address');
import ClientConnectionManager = require('./ClientConnectionManager');

class ClientConnection {
    address: Address;
    localAddress: Address;
    socket: stream.Duplex;
    lastRead: number;
    heartbeating = true;

    private readBuffer: Buffer;
    private logging =  LoggingService.getLoggingService();
    private clientNetworkConfig: ClientNetworkConfig;
    private connectionManager: ClientConnectionManager;

    constructor(connectionManager: ClientConnectionManager, address: Address, clientNetworkConfig: ClientNetworkConfig) {
        this.address = address;
        this.clientNetworkConfig = clientNetworkConfig;
        this.readBuffer = new Buffer(0);
        this.lastRead = 0;
        this.connectionManager = connectionManager;
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
                'Could not connect to address ' + Address.encodeToString(this.address), e);
            ready.reject(e);
            if (e.code === 'EPIPE' || e.code === 'ECONNRESET') {
                this.connectionManager.destroyConnection(this.address);
            }
        });

        return ready.promise;
    }

    write(buffer: Buffer, cb: (err: any) => void ): void {
        this.socket.write(buffer, 'utf8', cb);
    }

    /**
     * Closes this connection.
     */
    close() {
        this.socket.end();
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

export = ClientConnection;
