import {ClientMessage} from '../../protocol/ClientMessage';

/** @internal */
export class ListCNDoubleCodec {

    static encode<T>(clientMessage: ClientMessage, items: T[]): void {
        return;
    }

    static decode<T>(clientMessage: ClientMessage): T[] {
        return [];
    }
}
