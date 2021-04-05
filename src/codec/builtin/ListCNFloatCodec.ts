import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNFloatCodec {

    static encode(clientMessage: ClientMessage, items: number[]): void {
        ListCNFixedSizeCodec.encode(clientMessage, items, BitsUtil.FLOAT_SIZE_IN_BYTES, FixSizedTypesCodec.encodeFloat);
    }

    static decode(clientMessage: ClientMessage): number[] {
        return ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil.FLOAT_SIZE_IN_BYTES, FixSizedTypesCodec.decodeFloat);
    }
}
