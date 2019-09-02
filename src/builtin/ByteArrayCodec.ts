import {ClientMessage, Frame} from "../ClientMessage";
import {Buffer} from 'safe-buffer';

export class ByteArrayCodec {

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, buffer: Buffer): void {
        clientMessage.add(new Frame(buffer));
    }

    public static decodeContent(frame: Frame): Buffer {
        return frame.content;
    }

    public static decode(frame: Frame): Buffer {
        return this.decodeContent(frame.next);
    }

}
