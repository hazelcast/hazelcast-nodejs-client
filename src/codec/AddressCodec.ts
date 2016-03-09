/* tslint:disable */
import ClientMessage = require('../ClientMessage');
import {BitsUtil} from '../BitsUtil';
import Address = require('../Address');
import {Data} from '../serialization/Data';
import {MapMessageType} from './MapMessageType';

export class AddressCodec {
    static encode(clientMessage:ClientMessage, target:Address): void {
        clientMessage.appendString(target.host);
        clientMessage.appendInt32(target.port);
    }

    static decode(clientMessage: ClientMessage) {
        var host = clientMessage.readString();
        var port = clientMessage.readInt32();
        return new Address(host, port);
    }
}
