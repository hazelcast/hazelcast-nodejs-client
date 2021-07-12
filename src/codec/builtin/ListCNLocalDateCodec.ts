import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';
import {HzLocalDateClass} from '../../core';

/** @internal */
export class ListCNLocalDateCodec {
    static decode(clientMessage: ClientMessage): HzLocalDateClass[] {
        return ListCNFixedSizeCodec.decode(
            clientMessage.nextFrame(),
            BitsUtil.LOCAL_DATE_SIZE_IN_BYTES,
            FixSizedTypesCodec.decodeLocalDate
        );
    }
}
