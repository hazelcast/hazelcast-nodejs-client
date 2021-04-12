import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';
import {HzOffsetDateTime} from '../../sql/DataTypes';

/** @internal */
export class ListCNOffsetDateTimeCodec {

    static encode(clientMessage: ClientMessage, items: boolean[]): void {
    }

    static decode(clientMessage: ClientMessage): HzOffsetDateTime[] {
        return ListCNFixedSizeCodec.decode(
            clientMessage.nextFrame(),
            BitsUtil.OFFSET_DATE_TIME_SIZE_IN_BYTES,
            FixSizedTypesCodec.decodeOffsetDateTime
        );
    }
}
