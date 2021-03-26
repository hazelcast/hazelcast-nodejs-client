import {ClientMessage} from '../../protocol/ClientMessage';
import * as Long from 'long';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';

/** @internal */
export class ListCNFloatCodec {

    static encode(clientMessage: ClientMessage, items: boolean[]): void {
        ListCNFixedSizeCodec.encode(clientMessage, items);
    }

    static decode(clientMessage: ClientMessage): boolean[] {
        return ListCNFixedSizeCodec.decode(clientMessage);
    }
}
