import {ClientMessage} from '../../protocol/ClientMessage';
import * as Long from 'long';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNLocalDateTimeCodec {

    static encode(clientMessage: ClientMessage, items: string[]): void {
        ListCNFixedSizeCodec.encode(
            clientMessage,
            items,
            BitsUtil.LOCAL_DATETIME_SIZE_IN_BYTES,
            FixSizedTypesCodec.encodeLocalDatetime
        );
    }

    static decode(clientMessage: ClientMessage): string[] {
        return ListCNFixedSizeCodec.decode(
            clientMessage.nextFrame(),
            BitsUtil.LOCAL_DATETIME_SIZE_IN_BYTES,
            FixSizedTypesCodec.decodeLocalDatetime
        );
    }
}
