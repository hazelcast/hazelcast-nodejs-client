import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNByteCodec {

    static encode(clientMessage: ClientMessage, items: number[]): void {
        ListCNFixedSizeCodec.encode(clientMessage, items, BitsUtil.BYTE_SIZE_IN_BYTES, FixSizedTypesCodec.encodeByte);
    }

    static decode(clientMessage: ClientMessage): number[] {
        return ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil.BYTE_SIZE_IN_BYTES, FixSizedTypesCodec.decodeByte);
    }
}
