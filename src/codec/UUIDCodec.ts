import ClientMessage = require('../ClientMessage');
import {UUID} from '../core/UUID';
export class UUIDCodec {
    static decode(clientMessage: ClientMessage, toObject: Function): UUID  {
        var uuid: UUID;
        uuid.mostSignificant = clientMessage.readLong();
        uuid.leastSignificant = clientMessage.readLong();
        return uuid;
    }
}
