import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNDoubleCodec {

    static encode(clientMessage: ClientMessage, items: number[]): void {
        ListCNFixedSizeCodec.encode(clientMessage, items, BitsUtil.DOUBLE_SIZE_IN_BYTES, FixSizedTypesCodec.encodeDouble);
    }

    static decode(clientMessage: ClientMessage): number[] {
        return ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil.DOUBLE_SIZE_IN_BYTES, FixSizedTypesCodec.decodeDouble);
    }
}
