import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';
import {FixedSizeTypes} from './FixedSizeTypes';
import * as Long from 'long';
import {UUID} from '../core/UUID';

export class MapUUIDLongCodec {

    private static ENTRY_SIZE_IN_BYTES: number = FixedSizeTypes.UUID_SIZE_IN_BYTES + BitsUtil.LONG_SIZE_IN_BYTES;

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection: Array<[UUID, Long]>): void {
        const itemCount: number = collection.length;
        const frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES));
        const iterator: Array<[UUID, Long]> = collection;

        for (let i = 0; i < itemCount; i++) {
            const entry: [UUID, Long] = iterator[i];
            FixedSizeTypes.encodeUUID(frame.content, i * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES, entry[0]);
            FixedSizeTypes.encodeLong(frame.content,
                i * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES + FixedSizeTypes.UUID_SIZE_IN_BYTES, entry[1]);
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): Array<[UUID, Long]> {
        const itemCount: number = frame.content.length / MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES;
        const result: Array<[UUID, Long]> = new Array<[UUID, Long]>();
        for (let i = 0; i < itemCount; i++) {
            const key: UUID = FixedSizeTypes.decodeUUID(frame.content, i * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES);
            const value: Long = FixedSizeTypes.decodeLong(frame.content,
                i * MapUUIDLongCodec.ENTRY_SIZE_IN_BYTES + FixedSizeTypes.UUID_SIZE_IN_BYTES);
            result.push([key, value]);
        }
        return result;
    }
}
