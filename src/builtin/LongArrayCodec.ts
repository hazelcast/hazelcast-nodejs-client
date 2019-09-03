import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';
import {FixedSizeTypes} from './FixedSizeTypes';
import * as Long from 'long';

export class LongArrayCodec {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, array: Long[]): void {
        const itemCount: number = array.length;
        const frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * BitsUtil.LONG_SIZE_IN_BYTES));
        for (let i = 0; i < itemCount; i++) {
            FixedSizeTypes.encodeLong(frame.content, i * BitsUtil.INT_SIZE_IN_BYTES, array[i]);
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Long[] {
        const itemCount: number = frame.content == null ? 0 : frame.content.length / BitsUtil.LONG_SIZE_IN_BYTES;
        const result: Long[] = new Long[itemCount];
        for (let i = 0; i < itemCount; i++) {
            result[i] = FixedSizeTypes.decodeLong(frame.content, i * BitsUtil.LONG_SIZE_IN_BYTES);
        }
        return result;
    }

    public static decodeLong(frame: Frame): Long[] {
        return LongArrayCodec.decode(frame.next);
    }

}
