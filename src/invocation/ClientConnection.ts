import net = require('net');
import Q = require('q');
import Address = require('../Address');

class ClientConnection {
    private address: Address;
    private socket: net.Socket;

    constructor(address: Address) {
        this.address = address;
    }

    connect(): Q.Promise<ClientConnection> {
        var ready = Q.defer<ClientConnection>();

        this.socket = net.connect(this.address.port, this.address.host, () => {
            console.log('Connection established');

            // Send the protocol version
            var buffer = new Buffer(3);
            buffer.write('CB2');
            this.socket.write(buffer);
            ready.resolve(this);
        });

        this.socket.on('error', (e: any) => {
            console.log('Could not connect to address ' + this.address);
            ready.reject(e);
        });

        return ready.promise;
    }

    write(buffer: Buffer) {
        this.socket.write(buffer);
    }

    registerReadCallback(callback: Function) {
        this.socket.on('data', callback);
    }
}

export = ClientConnection
