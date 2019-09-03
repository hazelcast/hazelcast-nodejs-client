import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';
import {FixedSizeTypes} from './FixedSizeTypes';
import {UUID} from '../core/UUID';

export class ListUUIDCodec {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection: UUID[]): void {
        const itemCount: number = collection.length;
        const frame: Frame = new Frame(Buffer.allocUnsafe(itemCount * BitsUtil.LONG_SIZE_IN_BYTES));
        for (let i = 0; i < itemCount; i++) {
            FixedSizeTypes.encodeUUID(frame.content, i * BitsUtil.INT_SIZE_IN_BYTES, collection[i]);
        }
        clientMessage.add(frame);
    }

    public static decode(frame: Frame): UUID[] {
        const itemCount: number = frame.content.length / FixedSizeTypes.UUID_SIZE_IN_BYTES;
        const result: UUID[] = new Array<UUID>(itemCount);
        for (let i = 0; i < itemCount; i++) {
            result.push(FixedSizeTypes.decodeUUID(frame.content, i * FixedSizeTypes.UUID_SIZE_IN_BYTES));
        }
        return result;
    }

    public static decodeUUID(frame: Frame): UUID[] {
        return ListUUIDCodec.decode(frame.next);
    }

}
