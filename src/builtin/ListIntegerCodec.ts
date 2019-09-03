import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';
import {FixedSizeTypes} from './FixedSizeTypes';

export class ListIntegerCodec {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection: number[]): void {
        const itemCount: number = collection.length;
        const frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * BitsUtil.INT_SIZE_IN_BYTES));
        for (let i = 0; i < itemCount; i++) {
            FixedSizeTypes.encodeInt(frame.content, i * BitsUtil.INT_SIZE_IN_BYTES, collection[i]);
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): number[] {
        const itemCount: number = frame.content == null ? 0 : frame.content.length / BitsUtil.INT_SIZE_IN_BYTES;
        const result: number[] = new Array<number>(itemCount);
        for (let i = 0; i < itemCount; i++) {
            result.push(FixedSizeTypes.decodeInt(frame.content, i * BitsUtil.INT_SIZE_IN_BYTES));
        }
        return result;
    }

    public static decodeInt(frame: Frame): number[] {
        return ListIntegerCodec.decode(frame.next);
    }

}
