import {ClientMessage} from '../../protocol/ClientMessage';
import * as Long from 'long';
import {ListCNFixedSizeCodec} from './ListCNFixedSizeCodec';
import {BitsUtil} from '../../util/BitsUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class ListCNLongCodec {

    static encode(clientMessage: ClientMessage, items: Long[]): void {
        ListCNFixedSizeCodec.encode(clientMessage, items, BitsUtil.LONG_SIZE_IN_BYTES, FixSizedTypesCodec.encodeLong);
    }

    static decode(clientMessage: ClientMessage): Long[] {
        return ListCNFixedSizeCodec.decode(clientMessage.nextFrame(), BitsUtil.LONG_SIZE_IN_BYTES, FixSizedTypesCodec.decodeLong);
    }
}
