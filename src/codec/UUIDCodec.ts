import ClientMessage = require('../ClientMessage');
import {UUID} from '../core/UUID';
export class UUIDCodec {
    static decode(clientMessage: ClientMessage, toObject: Function): UUID  {
        var uuid: UUID = {
            'mostSignificant': clientMessage.readLong(),
            'leastSignificant': clientMessage.readLong()
        };
        return uuid;
    }
}
