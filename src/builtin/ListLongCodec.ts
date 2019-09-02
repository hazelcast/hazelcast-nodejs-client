import {ClientMessage, Frame} from "../ClientMessage";
import {Buffer} from 'safe-buffer';
import {BitsUtil} from "../BitsUtil";
import {FixedSizeTypes} from "./FixedSizeTypes";
// @ts-ignore
import * as Long from "long";


export class ListLongCodec {

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection: Array<Long>): void {
        var itemCount: number = collection.length;
        var frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * BitsUtil.LONG_SIZE_IN_BYTES));
        for (var i = 0; i < itemCount; i++) {
            FixedSizeTypes.encodeLong(frame.content, i * BitsUtil.INT_SIZE_IN_BYTES, collection[i]);
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Array<Long> {
        var itemCount: number = frame.content == null ? 0 : frame.content.length / BitsUtil.LONG_SIZE_IN_BYTES;
        var result: Array<Long> = new Array<Long>(itemCount);
        for (var i = 0; i < itemCount; i++) {
            result.push(FixedSizeTypes.decodeLong(frame.content, i * BitsUtil.LONG_SIZE_IN_BYTES));
        }
        return result;
    }

    public static decodeLong(frame: Frame): Array<Long> {
        return ListLongCodec.decode(frame.next);
    }

}
