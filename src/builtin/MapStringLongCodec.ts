import {ClientMessage, Frame} from '../ClientMessage';
import * as Long from 'long';
import {StringCodec} from './StringCodec';
import {ListLongCodec} from './ListLongCodec';
import {ListMultiFrameCodec} from './ListMultiFrameCodec';

export class MapStringLongCodec {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, collection: Array<[string, Long]>): void {
        const valueList: Long[] = new Array<Long>(collection.length);
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        collection.forEach((entry) => {
            StringCodec.encode(clientMessage, entry[0]);
            valueList.push(entry[1]);
        });

        clientMessage.add(ClientMessage.END_FRAME);
        ListLongCodec.encode(clientMessage, valueList);
    }

    public static decode(frame: Frame): Array<[string, Long]> {
        const listK: string[] = ListMultiFrameCodec.decode(frame, StringCodec.decode);
        const listV: Long[] = ListLongCodec.decode(frame);

        const result: Array<[string, Long]> = [];
        for (let i = 0; i < listK.length; i++) {
            result.push([listK[i], listV[i]]);
        }

        return result;
    }
}
