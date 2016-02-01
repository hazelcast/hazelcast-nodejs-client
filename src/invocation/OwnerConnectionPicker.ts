import Address = require('../Address');
import ClientConnection = require('./ClientConnection');
import Q = require('q');

class OwnerConnectionPicker {

    private addresses: Address[];
    private ready = Q.defer<ClientConnection>();

    constructor(addresses: Address[]) {
        this.addresses = addresses;
    }

    public pick(): Q.Promise<ClientConnection> {
        this.tryAddress(0);
        return this.ready.promise;
    }

    private tryAddress(index: number) {
        if (index >= this.addresses.length) {
            this.ready.reject('Unable to connect to any of the following addresses ' + this.addresses);
        }

        var currentAddress = this.addresses[index];
        var clientConnection = new ClientConnection(currentAddress);
        clientConnection.connect().then((connection: ClientConnection) => {
            this.ready.resolve(connection);
        }).catch(() => {
            this.tryAddress(index + 1);
        });
    }
}

export = OwnerConnectionPicker
