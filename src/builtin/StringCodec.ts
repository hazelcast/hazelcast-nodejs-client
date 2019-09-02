import {ClientMessage} from "../ClientMessage";
import {Frame} from "../ClientMessage";
import {BitsUtil} from "../BitsUtil";
import {Buffer} from 'safe-buffer';


export class StringCodec {
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, value: string) : void {
       clientMessage.add(new Frame(Buffer.from(value, "utf8")));
    }

    public static decode(frame: Frame) : string {
    return StringCodec.decodeFrame(frame.next);
}

public static decodeFrame(frame: Frame) : string {
    return frame.content.toString('utf8');
}

}
