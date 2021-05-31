import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNShortCodec {
    static decode(clientMessage: ClientMessage): number[] {
        return ListCNFixedSizeCodec.decode(
            clientMessage.nextFrame(), BitsUtil.SHORT_SIZE_IN_BYTES, FixSizedTypesCodec.decodeShort
        );
    }
}
