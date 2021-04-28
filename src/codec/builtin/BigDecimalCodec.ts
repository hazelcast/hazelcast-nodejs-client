import {ClientMessage} from '../../protocol/ClientMessage';
import {CodecUtil} from './CodecUtil';

/** @internal */
export class BigDecimalCodec {

    // Return string
    static decode(clientMessage: ClientMessage): string {
        clientMessage.nextFrame();
        return '42';
    }

    static decodeNullable(clientMessage: ClientMessage): string {
        return CodecUtil.nextFrameIsNullFrame(clientMessage) ? null : BigDecimalCodec.decode(clientMessage);
    }
}
