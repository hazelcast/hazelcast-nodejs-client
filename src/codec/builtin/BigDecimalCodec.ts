import {ClientMessage} from '../../protocol/ClientMessage';
import {CodecUtil} from './CodecUtil';
import {BitsUtil} from '../../util/BitsUtil';
import {bufferToBigInt} from '../../util/BigDecimalUtil';
import {BigDecimal} from '../../core';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class BigDecimalCodec {

    static decode(clientMessage: ClientMessage): BigDecimal {
        const buffer = clientMessage.nextFrame().content;
        const contentSize = FixSizedTypesCodec.decodeInt(buffer, 0);
        const body = buffer.slice(BitsUtil.INT_SIZE_IN_BYTES, BitsUtil.INT_SIZE_IN_BYTES + contentSize);
        const scale = FixSizedTypesCodec.decodeInt(buffer, BitsUtil.INT_SIZE_IN_BYTES + contentSize);

        return new BigDecimal(bufferToBigInt(body), scale);
    }

    static decodeNullable(clientMessage: ClientMessage): BigDecimal {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : BigDecimalCodec.decode(clientMessage);
    }
}
