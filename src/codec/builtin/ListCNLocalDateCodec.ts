import {ClientMessage} from '../../protocol/ClientMessage';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';
import {HzLocalDate} from '../../sql/DataTypes';

/** @internal */
export class ListCNLocalDateCodec {

    static encode(clientMessage: ClientMessage, items: HzLocalDate[]): void {
        ListCNFixedSizeCodec.encode(clientMessage, items, BitsUtil.LOCAL_DATE_SIZE_IN_BYTES, FixSizedTypesCodec.encodeLocalDate);
    }

    static decode(clientMessage: ClientMessage): HzLocalDate[] {
        return ListCNFixedSizeCodec.decode(
            clientMessage.nextFrame(),
            BitsUtil.LOCAL_DATE_SIZE_IN_BYTES,
            FixSizedTypesCodec.decodeLocalDate
        );
    }
}
