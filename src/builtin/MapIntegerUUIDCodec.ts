import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';
import {FixedSizeTypes} from './FixedSizeTypes';
import {UUID} from '../core/UUID';

export class MapIntegerUUIDCodec {

    private static ENTRY_SIZE_IN_BYTES: number = BitsUtil.INT_SIZE_IN_BYTES + FixedSizeTypes.UUID_SIZE_IN_BYTES;

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection: Array<[number, UUID]>): void {
        const itemCount: number = collection.length;
        const frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES));
        const iterator: Array<[number, UUID]> = collection;

        for (let i = 0; i < itemCount; i++) {
            const entry: [number, UUID] = iterator[i];
            FixedSizeTypes.encodeInt(frame.content, i * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES, entry[0]);
            FixedSizeTypes.encodeUUID(frame.content,
                i * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES, entry[1]);
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Array<[number, UUID]> {
        const itemCount: number = frame.content.length / MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES;
        const result: Array<[number, UUID]> = new Array<[number, UUID]>();
        for (let i = 0; i < itemCount; i++) {
            const key: number = FixedSizeTypes.decodeInt(frame.content, i * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES);
            const value: UUID = FixedSizeTypes.decodeUUID(frame.content,
                i * MapIntegerUUIDCodec.ENTRY_SIZE_IN_BYTES + BitsUtil.INT_SIZE_IN_BYTES);
            result.push([key, value]);
        }
        return result;
    }
}
