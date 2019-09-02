import {ClientMessage, Frame} from "../ClientMessage";
import {Buffer} from 'safe-buffer';
import {BitsUtil} from "../BitsUtil";
import {FixedSizeTypes} from "./FixedSizeTypes";
import {UUID} from '/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/lib/core/UUID';


export class ListUUIDCodec {

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection: Array<UUID>): void {
        var itemCount : number = collection.length;
        var frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * BitsUtil.LONG_SIZE_IN_BYTES));
        for (var i = 0; i < itemCount; i++) {
            FixedSizeTypes.encodeUUID(frame.content, i * BitsUtil.INT_SIZE_IN_BYTES, collection[i]);
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Array<UUID> {
        var itemCount : number = frame.content.length / FixedSizeTypes.UUID_SIZE_IN_BYTES;
        var result : Array<UUID>= new Array<UUID>(itemCount);
        for (var i = 0; i < itemCount; i++) {
            result.push(FixedSizeTypes.decodeUUID(frame.content, i * FixedSizeTypes.UUID_SIZE_IN_BYTES));
        }
        return result;
    }

    public static decodeUUID(frame: Frame): Array<UUID> {
        return ListUUIDCodec.decode(frame.next);
    }

}
