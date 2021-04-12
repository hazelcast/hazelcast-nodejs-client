import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNIntegerCodec {
    static decode(clientMessage: ClientMessage): number[] {
        return ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil.INT_SIZE_IN_BYTES, FixSizedTypesCodec.decodeInt);
    }
}
