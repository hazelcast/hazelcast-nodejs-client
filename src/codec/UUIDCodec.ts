import ClientMessage = require('../ClientMessage');
import {UUID} from '../core/UUID';

export class UUIDCodec {
    static decode(clientMessage: ClientMessage, toObject: Function): UUID {
        let most = clientMessage.readLong();
        let least = clientMessage.readLong();
        return new UUID(most, least);
    }
}
