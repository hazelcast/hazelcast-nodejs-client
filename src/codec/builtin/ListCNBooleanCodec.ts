import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNBooleanCodec {
    static decode(clientMessage: ClientMessage): boolean[] {
        return ListCNFixedSizeCodec.decode(
            clientMessage.nextFrame(), BitsUtil.BOOLEAN_SIZE_IN_BYTES, FixSizedTypesCodec.decodeBoolean
        );
    }
}
