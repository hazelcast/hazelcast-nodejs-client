import {ClientMessage, Frame} from '../ClientMessage';
import {Buffer} from 'safe-buffer';
import {BitsUtil} from '../BitsUtil';
import {FixedSizeTypes} from './FixedSizeTypes';
import {UUID} from '../core/UUID';
import {Member} from '../core/Member';
import {AddressCodec} from './AddressCodec';
import {MapCodec} from './MapCodec';
import {StringCodec} from './StringCodec';
import {Address} from '../Address';
import {CodecUtil} from './CodecUtil';

export class MemberCodec {

    private static LITE_MEMBER_OFFSET: number = 0;
    private static UUID_OFFSET: number = MemberCodec.LITE_MEMBER_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;
    private static INITIAL_FRAME_SIZE: number = MemberCodec.UUID_OFFSET + FixedSizeTypes.UUID_SIZE_IN_BYTES;

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public static encode(clientMessage: ClientMessage, member: Member): void {
        clientMessage.add(ClientMessage.BEGIN_FRAME);
        const initialFrame: Frame = new Frame(Buffer.allocUnsafe(MemberCodec.INITIAL_FRAME_SIZE));
        FixedSizeTypes.encodeBoolean(initialFrame.content, MemberCodec.LITE_MEMBER_OFFSET, member.isLiteMember);
        FixedSizeTypes.encodeUUID(initialFrame.content, MemberCodec.UUID_OFFSET, member.uuid);

        clientMessage.add(initialFrame);

        AddressCodec.encode(clientMessage, member.address);
        MapCodec.encode(clientMessage, member.attributes, StringCodec.encode, StringCodec.encode);

        clientMessage.add(ClientMessage.END_FRAME);

    }

    public static decode(frame: Frame): Member {
        frame = frame.next;
        const initialFrame: Frame = frame.next;
        const isLiteMember: boolean = FixedSizeTypes.decodeBoolean(initialFrame.content, MemberCodec.LITE_MEMBER_OFFSET);
        const uuid: UUID = FixedSizeTypes.decodeUUID(initialFrame.content, MemberCodec.UUID_OFFSET);

        const address: Address = AddressCodec.decode(frame);
        const attributes: Array<[string, string]> = MapCodec.decodeToMap(frame, StringCodec.decode, StringCodec.decode);

        CodecUtil.fastForwardToEndFrame(frame);

        return new Member(address, uuid.toString(), isLiteMember, attributes);

    }

}
