import {ClientMessage, Frame} from "../ClientMessage";
import {Buffer} from 'safe-buffer';
import {BitsUtil} from "../BitsUtil";
import {FixedSizeTypes} from "./FixedSizeTypes";
// @ts-ignore
import * as Long from "long";


export class MapIntegerLongCodec {

    private static ENTRY_SIZE_IN_BYTES : number = BitsUtil.INT_SIZE_IN_BYTES + BitsUtil.LONG_SIZE_IN_BYTES;

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection : Array<[number,Long]>): void {
        var itemCount: number = collection.length;
        var frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES));
        for (var i = 0; i < itemCount; i++) {
            var entry : Map<number, Long> = collection[i];
            FixedSizeTypes.encodeInt(frame.content, i * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES, entry.getKey());
            FixedSizeTypes.encodeLong(frame.content, i * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES, entry.getValue());
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Array<[number,Long]> {
        var itemCount: number = frame.content.length / MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES;
        var result: Array<[number,Long]> = new Array<[number, Long]>();
        for (var i = 0; i < itemCount; i++) {
            var key : number = FixedSizeTypes.decodeInt(frame.content, i * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES);
            var value : Long = FixedSizeTypes.decodeLong(frame.content, i * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES);
            var map  = new Map();
            map.set(key, value);
            result.push(map);
        }
        return result;
    }


}
