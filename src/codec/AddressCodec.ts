/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import Address = require('../Address');

export class AddressCodec {
    static encode(clientMessage: ClientMessage, target: Address): void {
        clientMessage.appendString(target.host);
        clientMessage.appendInt32(target.port);
    }

    static decode(clientMessage: ClientMessage, toObjectFunction: Function) {
        var host = clientMessage.readString();
        var port = clientMessage.readInt32();
        return new Address(host, port);
    }
}
