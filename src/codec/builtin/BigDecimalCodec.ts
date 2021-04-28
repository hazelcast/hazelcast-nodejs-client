import {ClientMessage} from '../../protocol/ClientMessage';
import {CodecUtil} from './CodecUtil';

/** @internal */
export class BigDecimalCodec {

    // Return string
    static decode(clientMessage: ClientMessage): string {
        return '';
    }

    static decodeNullable(clientMessage: ClientMessage): string {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : BigDecimalCodec.decode(clientMessage);
    }
}
