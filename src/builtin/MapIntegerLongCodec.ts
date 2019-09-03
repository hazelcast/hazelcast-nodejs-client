import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';
import {FixedSizeTypes} from './FixedSizeTypes';
import * as Long from 'long';

export class MapIntegerLongCodec {

    private static ENTRY_SIZE_IN_BYTES: number = BitsUtil.INT_SIZE_IN_BYTES + BitsUtil.LONG_SIZE_IN_BYTES;

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection: Array<[number, Long]>): void {
        const itemCount: number = collection.length;
        const frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES));
        for (let i = 0; i < itemCount; i++) {
            const entry: [number, Long] = collection[i];
            FixedSizeTypes.encodeInt(frame.content, i * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES, entry[0]);
            FixedSizeTypes.encodeLong(frame.content,
                i * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES, entry[1]);
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Array<[number, Long]> {
        const itemCount: number = frame.content.length / MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES;
        const result: Array<[number, Long]> = new Array<[number, Long]>();
        for (let i = 0; i < itemCount; i++) {
            const key: number = FixedSizeTypes.decodeInt(frame.content, i * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES);
            const value: Long = FixedSizeTypes.decodeLong(frame.content,
                i * MapIntegerLongCodec.ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES);
            result.push([key, value]);
        }
        return result;
    }

}
