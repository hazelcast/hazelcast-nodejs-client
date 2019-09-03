import {ClientMessage, Frame} from '../ClientMessage';

export class CodecUtil {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static fastForwardToEndFrame(frame: Frame): void {
        while (frame.next) {
            frame = frame.next;
        }
    }

    public static encodeNullable<T>(clientMessage: ClientMessage, value: T,
                                    encode: (clientMessage: ClientMessage, value: T) => void): void {
        if (value == null) {
            clientMessage.add(ClientMessage.NULL_FRAME);
        } else {
            encode(clientMessage, value);
        }
    }

    public static nextFrameIsDataStructureEndFrame(frame: Frame): boolean {
        try {
            return frame.next.isEndFrame();
        } finally {
            frame.previous();
        }
    }

    public static nextFrameIsNullEndFrame(frame: Frame): boolean {
        const isNull: boolean = frame.next.isNullFrame();
        if (!isNull) {
            frame.previous();
        }
        return isNull;
    }

    public static decodeNullable<T>(frame: Frame, decode: (frame: Frame) => T): T {
        return CodecUtil.nextFrameIsNullEndFrame(frame) ? null : decode.apply(frame);
    }

}
