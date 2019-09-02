import {ClientMessage, Frame} from "../ClientMessage";
import {Buffer} from 'safe-buffer';
import {BitsUtil} from "../BitsUtil";
import {FixedSizeTypes} from "./FixedSizeTypes";

export class ListIntegerCodec {

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection: Array<number>): void {
        var itemCount: number = collection.length;
        var frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * BitsUtil.INT_SIZE_IN_BYTES));
        for (var i = 0; i < itemCount; i++) {
            FixedSizeTypes.encodeInt(frame.content, i * BitsUtil.INT_SIZE_IN_BYTES, collection[i]);
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Array<number> {
        var itemCount: number = frame.content == null ? 0 : frame.content.length / BitsUtil.INT_SIZE_IN_BYTES;
        var result: Array<number> = new Array<number>(itemCount);
        for (var i = 0; i < itemCount; i++) {
            result.push(FixedSizeTypes.decodeInt(frame.content, i * BitsUtil.INT_SIZE_IN_BYTES));
        }
        return result;
    }

    public static decodeInt(frame: Frame): Array<number> {
        return ListIntegerCodec.decode(frame.next);
    }

}
