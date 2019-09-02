import {ClientMessage} from "../ClientMessage";
import {Frame} from "../ClientMessage";
import {BitsUtil} from "../BitsUtil";
import {Buffer} from 'safe-buffer';
import {FixedSizeTypes} from "./FixedSizeTypes";
import {StringCodec} from "/Users/gulcesirvanci/Desktop/hazelcast-client-protocol/output/ts_protocol/StringCodec";
import Address = require("../Address");
import {ClientErrorFactory} from "./ErrorFactory";
import {ErrorCodec} from "./ErrorCodec";
import {ListMultiFrameCodec} from "./ListMultiFrameCodec";
import {ErrorHolder} from "../ErrorHolder";


export class ErrorsCodec {
    private static INITIAL_FRAME_SIZE : number = BitsUtil.CORRELATION_ID_FIELD_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;

    constructor() {
    }

    public static encode(errorHolder: Array<ErrorHolder>) : ClientMessage {
       var clientMessage : ClientMessage = ClientMessage.createForEncode();
       var initialFrame : Frame = new Frame(Buffer.allocUnsafe(ErrorsCodec.INITIAL_FRAME_SIZE),ClientMessage.UNFRAGMENTED_MESSAGE);
       clientMessage.add(initialFrame);
       clientMessage.setMessageType(ErrorCodec.EXCEPTION);
       ListMultiFrameCodec.encode(clientMessage,errorHolder,ErrorCodec.encode);
       return clientMessage;
    }

    public static decode(clientMessage: ClientMessage) : Array<ErrorHolder> {
        var frame : Frame = clientMessage.get();
        //initial frame
        frame = frame.next;
        return ListMultiFrameCodec.decode(frame, ErrorCodec.decode);
    }



}
