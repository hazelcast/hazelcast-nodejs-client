import {ClientMessage} from "../ClientMessage";
import {Frame} from "../ClientMessage";
import {BitsUtil} from "../BitsUtil";
import {Buffer} from 'safe-buffer';
import {FixedSizeTypes} from "./FixedSizeTypes";
import {StringCodec} from "/Users/gulcesirvanci/Desktop/hazelcast-client-protocol/ts/customCodecs/ts_protocol/StringCodec";
import Address = require("../Address");
import {CodecUtil} from "./CodecUtil";


export class AddressCodec {
    private static PORT_OFFSET : number = 0;
    private static INITIAL_FRAME_SIZE : number = AddressCodec.PORT_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;

    constructor() {
    }

    public static encode(clientMessage: ClientMessage, address: Address) : void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(AddressCodec.INITIAL_FRAME_SIZE));
        FixedSizeTypes.encodeInt(initialFrame.content, AddressCodec.PORT_OFFSET, address.port);
        clientMessage.add(initialFrame);
        StringCodec.encode(clientMessage, address.host);
        clientMessage.add(ClientMessage.END_FRAME);
    }

    public static decode(frame: Frame) : Address {
        // begin frame
        frame = frame.next;
        const initialFrame: Frame = frame.next;
        const port: number = FixedSizeTypes.decodeInt(initialFrame.content, AddressCodec.PORT_OFFSET);
        const host: string = StringCodec.decode(frame);
        CodecUtil.fastForwardToEndFrame(frame);
        try {
            return new Address(host, port);
        } catch (err) {
            //console.error(err);
        }
    }



}
