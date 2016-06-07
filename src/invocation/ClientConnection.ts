import net = require('net');
import * as Q from 'q';
import Address = require('../Address');
import {BitsUtil} from '../BitsUtil';
import {LoggingService} from '../logging/LoggingService';

class ClientConnection {
    address: Address;
    socket: net.Socket;
    lastRead: number;
    heartbeating = true;

    private readBuffer: Buffer;
    private logging =  LoggingService.getLoggingService();

    constructor(address: Address) {
        this.address = address;
        this.readBuffer = new Buffer(0);
        this.lastRead = 0;
    }

    /**
     * Returns the address of local port that is associated with this connection.
     * @returns
     */
    getLocalAddress() {
        return new Address(this.socket.localAddress, this.socket.localPort);
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
    connect(): Q.Promise<ClientConnection> {
        var ready = Q.defer<ClientConnection>();

        this.socket = net.connect(this.address.port, this.address.host, () => {

            // Send the protocol version
            var buffer = new Buffer(3);
            buffer.write('CB2');
            this.socket.write(buffer);
            ready.resolve(this);
        });

        this.socket.on('error', (e: any) => {
            this.logging.warn('ClientConnection',
                'Could not connect to address ' + Address.encodeToString(this.address), e);
            ready.reject(e);
        });

        return ready.promise;
    }

    write(buffer: Buffer): Q.Promise<void> {
        var deferred = Q.defer<void>();
        this.socket.write(buffer, 'utf8', (e: any) => {
            if (e === undefined) {
                deferred.resolve();
            } else {
                this.logging.warn('ClientConnection',
                    'Error sending message to ' + Address.encodeToString(this.address) + ' ' + e);
                deferred.reject(e);
            }
        });
        return deferred.promise;
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
