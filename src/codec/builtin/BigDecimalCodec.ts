import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';

/** @internal */
export class BigDecimalCodec {

    static encode(clientMessage: ClientMessage, items: boolean[]): void {
        ListCNFixedSizeCodec.encode(clientMessage, items);
    }

    static encodeNullable(clientMessage: ClientMessage, items: boolean[]): void {
        ListCNFixedSizeCodec.encode(clientMessage, items);
    }

    static decode(clientMessage: ClientMessage): boolean[] {
        return ListCNFixedSizeCodec.decode(clientMessage);
    }

    static decodeNullable(clientMessage: ClientMessage): number {
        return 1;
    }
}
