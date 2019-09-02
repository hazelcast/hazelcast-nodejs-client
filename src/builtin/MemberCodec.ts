import {ClientMessage, Frame} from "../ClientMessage";
import {Buffer} from 'safe-buffer';
import {BitsUtil} from "../BitsUtil";
import {FixedSizeTypes} from "./FixedSizeTypes";
// @ts-ignore
import * as Long from "long";
import {UUID} from '/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/lib/core/UUID';
import {Member} from "/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/src/core/Member";
import {ListLongCodec} from "./ListLongCodec";
import {ListMultiFrameCodec} from "./ListMultiFrameCodec";
import {AddressCodec} from "./AddressCodec";
import {MapCodec} from "./MapCodec";
import {StringCodec} from "./StringCodec";
import Address = require("/Users/gulcesirvanci/Desktop/hazelcast-nodejs-client/src/Address");
import {CodecUtil} from "./CodecUtil";



export class MemberCodec {

    private static LITE_MEMBER_OFFSET : number = 0;
    private static UUID_OFFSET : number = MemberCodec.LITE_MEMBER_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    private static INITIAL_FRAME_SIZE : number = MemberCodec.UUID_OFFSET + FixedSizeTypes.UUID_SIZE_IN_BYTES;

    constructor() {
    }

    public static encode(clientMessage: ClientMessage,member : Member): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        var initialFrame : Frame = new Frame(Buffer.allocUnsafe(MemberCodec.INITIAL_FRAME_SIZE));
        FixedSizeTypes.encodeBoolean(initialFrame.content, MemberCodec.LITE_MEMBER_OFFSET, member.isLiteMember);
        FixedSizeTypes.encodeUUID(initialFrame.content, MemberCodec.UUID_OFFSET, member.uuid);

        clientMessage.add(initialFrame);

        AddressCodec.encode(clientMessage, member.address);
        MapCodec.encode(clientMessage, member.attributes, StringCodec.encode, StringCodec.encode);

        clientMessage.add(ClientMessage.END_FRAME);

    }

    public static decode(frame: Frame): Member{
        frame = frame.next;
        var initialFrame : Frame = frame.next;
        var isLiteMember : boolean = FixedSizeTypes.decodeBoolean(initialFrame.content,MemberCodec.LITE_MEMBER_OFFSET);
        var uuid :  UUID = FixedSizeTypes.decodeUUID(initialFrame.content, MemberCodec.UUID_OFFSET);

        var address : Address = AddressCodec.decode(frame);
        var attributes : Map<string, string> = MapCodec.decodeToMap(frame, StringCodec.decode, StringCodec.decode);

        CodecUtil.fastForwardToEndFrame(frame);

        return new Member(address, uuid.toString(), isLiteMember, attributes);

    }


}
