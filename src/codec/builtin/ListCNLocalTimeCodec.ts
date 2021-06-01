import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNLocalTimeCodec {
    static decode(clientMessage: ClientMessage): string[] {
        return ListCNFixedSizeCodec.decode(
            clientMessage.nextFrame(),
            BitsUtil.LOCAL_TIME_SIZE_IN_BYTES,
            FixSizedTypesCodec.decodeLocalTime
        );
    }
}
