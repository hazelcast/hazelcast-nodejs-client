import {ClientMessage, Frame} from '../ClientMessage';
import {BitsUtil} from '../BitsUtil';
import {Buffer} from 'safe-buffer';
import {ErrorCodec} from './ErrorCodec';
import {ListMultiFrameCodec} from '../builtin/ListMultiFrameCodec';
import {ErrorHolder} from './ErrorHolder';

export class ErrorsCodec {
    private static INITIAL_FRAME_SIZE: number = BitsUtil.CORRELATION_ID_FIELD_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(errorHolder: ErrorHolder[]): ClientMessage {
        const clientMessage: ClientMessage = ClientMessage.createForEncode();
        // tslint:disable-next-line:max-line-length
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(ErrorsCodec.INITIAL_FRAME_SIZE), ClientMessage.UNFRAGMENTED_MESSAGE);
        clientMessage.add(initialFrame);
        clientMessage.setMessageType(ErrorCodec.EXCEPTION);
        ListMultiFrameCodec.encode(clientMessage, errorHolder, ErrorCodec.encode);
        return clientMessage;
    }

    public static decode(clientMessage: ClientMessage): ErrorHolder[] {
        let frame: Frame = clientMessage.get();
        frame = frame.next;
        return ListMultiFrameCodec.decode(frame, ErrorCodec.decode);
    }

}
