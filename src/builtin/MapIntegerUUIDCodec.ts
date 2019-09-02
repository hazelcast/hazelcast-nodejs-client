import {ClientMessage, Frame} from "../ClientMessage";
import {Buffer} from 'safe-buffer';
import {BitsUtil} from "../BitsUtil";
import {FixedSizeTypes} from "./FixedSizeTypes";
// @ts-ignore
import * as Long from "long";
import {UUID} from '/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/lib/core/UUID';



export class MapIntegerUUIDCodec {

    private static ENTRY_SIZE_IN_BYTES : number = BitsUtil.INT_SIZE_IN_BYTES + FixedSizeTypes.UUID_SIZE_IN_BYTES;

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection : Array<[number,UUID]>): void {
        var itemCount: number = collection.length;
        var frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES));
        var iterator: Array<[number, Long]> = collection;

        for (var i = 0; i < itemCount; i++) {
            var entry : Map<number, Long> = iterator[i];
            FixedSizeTypes.encodeInt(frame.content, i * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES, entry.getKey());
            FixedSizeTypes.encodeLong(frame.content, i * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES, entry.getValue());
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Array<[number,Long]> {
        var itemCount: number = frame.content.length / MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES;
        var result: Array<[number,Long]> = new Array<[number, Long]>();
        for (var i = 0; i < itemCount; i++) {
            var key : number = FixedSizeTypes.decodeInt(frame.content, i * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES);
            var value : Long = FixedSizeTypes.decodeLong(frame.content, i * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES);
            var map  = new Map();
            map.set(key, value);
            result.push(map);
        }
        return result;
    }


}
