/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*tslint:disable:max-line-length*/
import {FixSizedTypesCodec} from '../builtin/FixSizedTypesCodec';
import {BitsUtil} from '../../BitsUtil';
import {ClientMessage, BEGIN_FRAME, END_FRAME, Frame} from '../../ClientMessage';
import {CodecUtil} from '../builtin/CodecUtil';
import {UUID} from '../../core/UUID';
import {Address} from '../../Address';
import {AddressCodec} from './AddressCodec';
import {MapCodec} from '../builtin/MapCodec';
import {StringCodec} from '../builtin/StringCodec';
import {MemberVersion} from '../../core/MemberVersion';
import {MemberVersionCodec} from './MemberVersionCodec';
import {MemberInfo} from '../../core/MemberInfo';

const UUID_OFFSET = 0;
const LITE_MEMBER_OFFSET = UUID_OFFSET + BitsUtil.UUID_SIZE_IN_BYTES;
const INITIAL_FRAME_SIZE = LITE_MEMBER_OFFSET + BitsUtil.BOOLEAN_SIZE_IN_BYTES;

export class MemberInfoCodec {
    static encode(clientMessage: ClientMessage, memberInfo: MemberInfo): void {
        clientMessage.addFrame(BEGIN_FRAME.copy());

        const initialFrame = Frame.createInitialFrame(INITIAL_FRAME_SIZE, undefined);
        FixSizedTypesCodec.encodeUUID(initialFrame.content, UUID_OFFSET, memberInfo.uuid);
        FixSizedTypesCodec.encodeBoolean(initialFrame.content, LITE_MEMBER_OFFSET, memberInfo.liteMember);
        clientMessage.addFrame(initialFrame);

        AddressCodec.encode(clientMessage, memberInfo.address);
        MapCodec.encode(clientMessage, memberInfo.attributes, StringCodec.encode, StringCodec.encode);
        MemberVersionCodec.encode(clientMessage, memberInfo.version);

        clientMessage.addFrame(END_FRAME.copy());
    }

    static decode(clientMessage: ClientMessage): MemberInfo {
        // begin frame
        clientMessage.nextFrame();

        const initialFrame = clientMessage.nextFrame();
        const uuid: UUID = FixSizedTypesCodec.decodeUUID(initialFrame.content, UUID_OFFSET);
        const liteMember: boolean = FixSizedTypesCodec.decodeBoolean(initialFrame.content, LITE_MEMBER_OFFSET);
        const address: Address = AddressCodec.decode(clientMessage);
        const attributes: Map<string, string> = MapCodec.decode(clientMessage, StringCodec.decode, StringCodec.decode);
        const version: MemberVersion = MemberVersionCodec.decode(clientMessage);

        CodecUtil.fastForwardToEndFrame(clientMessage);

        return new MemberInfo(address, uuid, attributes, liteMember, version);
    }
}
