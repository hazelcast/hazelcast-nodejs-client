import {ClientMessage} from '../../protocol/ClientMessage';
import {CodecUtil} from './CodecUtil';
import {FixSizedTypesCodec} from './FixSizedTypesCodec';

/** @internal */
export class BigDecimalCodec {

    static decode(clientMessage: ClientMessage): number {
        // TODO: add big decimal decode here
        const buffer = clientMessage.nextFrame().content;
        return FixSizedTypesCodec.decodeInt(buffer, 0);
    }

    static decodeNullable(clientMessage: ClientMessage): number {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : BigDecimalCodec.decode(clientMessage);
    }
}
